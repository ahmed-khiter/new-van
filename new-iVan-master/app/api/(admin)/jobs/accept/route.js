import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { validateSubscriptionForJob } from "@/utils/subscriptionService";
import { handleJobAcceptanceChatCreation } from "@/utils/chatService";
import { handleJobAcceptanceEmailSending } from "@/utils/jobAcceptanceEmailService";
import { broadcastJobAccepted } from "@/utils/deliveryNotificationService";
import { sendEmail } from "@/lib/sendEmail";

export const POST = async (req) => {
    try {
        const userIdHeader = req.headers.get("user-id");
        const userId = parseInt(userIdHeader, 10);
        const { id } = await req.json();

        if (!id) {
            return NextResponse.json({ 
                success: false,
                message: "Job ID is required",
                data: null
            }, { status: 400 });
        }
        if (isNaN(userId)) {
            return NextResponse.json({ 
                success: false,
                message: "Invalid provider ID",
                data: null
            }, { status: 400 });
        }


        // Fetch job
        const job = await prisma.jobs.findUnique({ 
            where: { id }
        });

        if (!job) {
            return NextResponse.json({ 
                success: false,
                message: "Job not found",
                data: null
            }, { status: 404 });
        }
        const user = await prisma.users.findUnique({
            where: { id: userId },
            select: { settings: true, status: true },
        });

        // Check if provider account is suspended
        if (user?.status === 'suspended') {
            return NextResponse.json({
                success: false,
                message: "Your account has been suspended. You cannot accept new jobs. Please contact support for assistance.",
                data: { accountSuspended: true }
            }, { status: 403 });
        }

        if (!user?.settings?.services) {
            return NextResponse.json({
                success: false,
                message: "No services found for this user",
                data: { serviceApproved: false, category: job.category }
            }, { status: 403 });
        }

        // Validate subscription using the service
        const { valid, subscription, error: subscriptionError, reason: subscriptionReason } = await validateSubscriptionForJob(userId);

        if (!valid) {
            return NextResponse.json({
                success: false,
                message: subscriptionError,
                data: { 
                    subscriptionRequired: true,
                    subscriptionCancelled: subscriptionReason === "subscription_cancelled"
                }
            }, { status: 403 });
        }


        const userService = user.settings.services.find(
            (service) => service.name === job.category
        );

        if (!userService || userService.status !== "Approved") {
            return NextResponse.json({
                success: false,
                message: `Your service for category "${job.category}" is not approved yet.`,
                data: { serviceApproved: false, category: job.category }
            }, { status: 403 });
        }

        if (job.acceptedById) {
            return NextResponse.json({
                success: false,
                message: "Job is already accepted by another provider",
                data: null
            }, { status: 409 });
        }


        if (job.status !== "active") {
            return NextResponse.json({
                success: false,
                message: "Job is not available to accept",
                data: null
            }, { status: 400 });
        }


        const updatedJob = await prisma.jobs.update({
            where: { id },
            data: {
                status: "open",
                acceptedById: userId,
            },
        });
        await prisma.documents.updateMany({
            where: { jobId: updatedJob.id },
            data: { userId },
        });

        // Check if job is linked to a delivery order
        let orderUpdated = false;
        let deliveryOrder = null;

        if (job.deliveryOrderId) {
            // Fetch the order linked to this job with all related data
            deliveryOrder = await prisma.product_orders.findUnique({
                where: { id: job.deliveryOrderId },
                include: {
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true
                        }
                    },
                    cart: {
                        include: {
                            cartItems: {
                                include: {
                                    product: {
                                        include: {
                                            createdBy: {
                                                select: {
                                                    id: true,
                                                    firstName: true,
                                                    lastName: true,
                                                    email: true
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            });
            
            if (deliveryOrder) {
                // Update order status to "dispatched" and set delivery provider
                // "dispatched" means driver has accepted the job but hasn't picked up yet
                // When driver actually picks up from restaurant/shop, status will be updated to "in-transit" via delivery-status route
                await prisma.product_orders.update({
                    where: { id: job.deliveryOrderId },
                    data: {
                        deliveryStatus: "dispatched",
                        deliveryProviderId: userId,
                        providerAcceptedAt: new Date()
                    }
                });
                orderUpdated = true;
                console.log(`Order ${job.deliveryOrderId} updated to dispatched status for provider ${userId}`);
            }
        }

        // Create chat for the job (non-blocking)
        handleJobAcceptanceChatCreation(updatedJob.id, userId);

        // Send job acceptance email to provider (non-blocking)
        handleJobAcceptanceEmailSending(updatedJob.id, userId);

        // If this is a delivery order, notify shop owner and customer
        if (orderUpdated && deliveryOrder) {
            try {
                // Get shop owner from the first product in the order
                const firstProduct = deliveryOrder.cart?.cartItems?.[0]?.product;
                const shopOwner = firstProduct?.createdBy;

                // Notify shop owner
                if (shopOwner && shopOwner.email) {
                    try {
                        await sendEmail({
                            type: "deliveryAssigned",
                            email: shopOwner.email,
                            subject: `Delivery Provider Assigned - Order #${deliveryOrder.id}`,
                            shopOwnerName: `${shopOwner.firstName}${shopOwner.lastName ? ` ${shopOwner.lastName}` : ''}`,
                            orderId: deliveryOrder.id,
                            providerId: userId,
                            customerName: `${deliveryOrder.user?.firstName}${deliveryOrder.user?.lastName ? ` ${deliveryOrder.user.lastName}` : ''}`,
                            deliveryAddress: deliveryOrder.deliveryAddress
                        });
                        console.log(`Shop owner notification sent to ${shopOwner.email} for order ${deliveryOrder.id}`);
                    } catch (emailError) {
                        console.error("Error sending shop owner notification:", emailError);
                    }
                }

                // Notify customer
                if (deliveryOrder.user && deliveryOrder.user.email) {
                    try {
                        await sendEmail({
                            type: "deliveryAssignedToCustomer",
                            email: deliveryOrder.user.email,
                            subject: `Your Order is Out for Delivery - Order #${deliveryOrder.id}`,
                            customerName: `${deliveryOrder.user.firstName}${deliveryOrder.user.lastName ? ` ${deliveryOrder.user.lastName}` : ''}`,
                            orderId: deliveryOrder.id,
                            providerId: userId,
                            deliveryAddress: deliveryOrder.deliveryAddress
                        });
                        console.log(`Customer notification sent to ${deliveryOrder.user.email} for order ${deliveryOrder.id}`);
                    } catch (emailError) {
                        console.error("Error sending customer notification:", emailError);
                    }
                }
            } catch (error) {
                console.error("Error sending delivery assignment notifications:", error);
                // Don't fail the job acceptance if notifications fail
            }
        }

        // Emit socket event to remove job from other providers' queues
        try {
            await broadcastJobAccepted(id, userId);
            console.log(`Socket notification sent: job ${id} accepted by provider ${userId}`);
        } catch (socketError) {
            console.error("Error sending socket notification (non-critical):", socketError);
            // Don't fail the job acceptance if socket notification fails
        }

        return NextResponse.json({
            success: true,
            message: "Job accepted successfully",
            data: { 
                job: updatedJob,
                orderUpdated: orderUpdated,
                deliveryOrderId: job.deliveryOrderId || null
            }
        }, { status: 200 });
    } catch (error) {
        console.error("Accept job error:", error);
        return NextResponse.json({ 
            success: false,
            message: error.message || "Failed to accept job",
            data: null
        }, { status: 500 });
    }
};
