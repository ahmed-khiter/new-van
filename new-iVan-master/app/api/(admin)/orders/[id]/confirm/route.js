import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { notifyProvidersAboutJob } from "@/utils/jobService";
import { notifyNearbyProvidersAboutDeliveryJob } from "@/utils/deliveryNotificationService";
import { fetchProvidersWithLocation } from "@/utils/jobService";

export const dynamic = 'force-dynamic';

export const POST = async (req, { params }) => {
    try {
        const userRole = req.headers.get("role");
        const userId = req.headers.get("user-id");
        const orderId = params.id;

        // Verify user is a shop owner or restaurant
        if (userRole !== 'shop-owner' && userRole !== 'restaurant') {
            return NextResponse.json({
                success: false,
                message: "Only shop owners and restaurants can confirm orders"
            }, { status: 403 });
        }

        if (!userId || !orderId) {
            return NextResponse.json({
                success: false,
                message: "Missing required parameters: userId and orderId"
            }, { status: 400 });
        }

        const shopOwnerId = parseInt(userId);

        // Fetch the order with all related data
        const order = await prisma.product_orders.findUnique({
            where: { id: orderId },
            include: {
                cart: {
                    include: {
                        cartItems: {
                            include: {
                                product: {
                                    select: {
                                        id: true,
                                        name: true,
                                        createdById: true
                                    }
                                }
                            }
                        }
                    }
                },
                job: {
                    select: {
                        id: true,
                        status: true,
                        category: true,
                        pickupLat: true,
                        pickupLng: true,
                        notificationSentAt: true
                    }
                }
            }
        });

        if (!order) {
            return NextResponse.json({
                success: false,
                message: "Order not found"
            }, { status: 404 });
        }

        // Step 1: Verify order status is "paid"
        if (order.status !== "paid") {
            return NextResponse.json({
                success: false,
                message: `Order cannot be confirmed. Current status: ${order.status}. Order must be in "paid" status.`
            }, { status: 400 });
        }

        // Step 2: Verify shop owner owns products in the order
        const cartItems = order.cart?.cartItems || [];
        
        if (cartItems.length === 0) {
            return NextResponse.json({
                success: false,
                message: "Order has no items"
            }, { status: 400 });
        }

        // Check if all products belong to this shop owner
        const allProductsOwnedByShopOwner = cartItems.every(item => {
            return item.product?.createdById === shopOwnerId;
        });

        if (!allProductsOwnedByShopOwner) {
            return NextResponse.json({
                success: false,
                message: "You can only confirm orders containing your own products"
            }, { status: 403 });
        }

        // Check if order is already confirmed
        if (order.deliveryStatus === "confirmed" || order.deliveryStatus === "assigned" || order.deliveryStatus === "in-transit" || order.deliveryStatus === "delivered") {
            return NextResponse.json({
                success: false,
                message: `Order is already ${order.deliveryStatus}`
            }, { status: 400 });
        }

        // Step 3 & 4: Update deliveryStatus to "confirmed" and set shop confirmation fields
        const updatedOrder = await prisma.product_orders.update({
            where: { id: orderId },
            data: {
                deliveryStatus: "confirmed",
                shopConfirmedAt: new Date(),
                shopConfirmedById: shopOwnerId
            },
            include: {
                job: true
            }
        });

        // Step 5: Activate the linked job if it exists and status is "draft"
        let jobActivated = false;
        let notificationResult = null;

        if (order.jobId && order.job) {
            const job = order.job;

            if (job.status === "draft") {
                // Update job status to "active"
                const updatedJob = await prisma.jobs.update({
                    where: { id: order.jobId },
                    data: {
                        status: "active",
                        deliveryOrderId: orderId,
                        notificationSentAt: new Date()
                    }
                });

                jobActivated = true;

                // Step 6: Trigger provider notifications (email + real-time)
                try {
                    // Send email notifications
                    const emailNotificationResult = await notifyProvidersAboutJob(updatedJob);
                    console.log(
                        `Email notifications sent for confirmed order ${orderId}, job ${order.jobId}:`,
                        emailNotificationResult
                    );

                    // Send real-time Socket.IO notifications
                    try {
                        const jobLocation = { lat: updatedJob.pickupLat, lng: updatedJob.pickupLng };
                        // Map restaurant and shop categories to Van for provider matching
                        const providerCategory = (updatedJob.category === "restaurant" || updatedJob.category === "shop") 
                            ? "Van" 
                            : (updatedJob.category || "Van");
                        const nearbyProviders = await fetchProvidersWithLocation(
                            providerCategory,
                            jobLocation,
                            50
                        );

                        if (nearbyProviders && nearbyProviders.length > 0) {
                            const realtimeResult = await notifyNearbyProvidersAboutDeliveryJob(
                                nearbyProviders,
                                updatedJob
                            );
                            console.log(
                                `Real-time notifications sent to ${realtimeResult.notifiedCount} providers for job ${order.jobId}`
                            );
                        }

                        notificationResult = emailNotificationResult;
                    } catch (realtimeError) {
                        console.error(
                            "Error sending real-time notifications (non-critical):",
                            realtimeError
                        );
                        // Continue with email notification result even if real-time fails
                        notificationResult = emailNotificationResult;
                    }
                } catch (error) {
                    console.error(
                        "Error sending provider notifications for confirmed order:",
                        error
                    );
                    // Don't fail the confirmation if notification fails
                    notificationResult = {
                        success: false,
                        notifiedCount: 0,
                        errors: [error.message]
                    };
                }
            } else if (job.status === "active") {
                // Job is already active, check if notifications need to be sent
                if (!job.notificationSentAt) {
                    // Update notification timestamp and deliveryOrderId, then send notifications
                    const updatedJob = await prisma.jobs.update({
                        where: { id: order.jobId },
                        data: {
                            deliveryOrderId: orderId,
                            notificationSentAt: new Date()
                        }
                    });

                    // Send notifications (email + real-time)
                    try {
                        // Send email notifications
                        const emailNotificationResult = await notifyProvidersAboutJob(updatedJob);
                        console.log(
                            `Email notifications sent for confirmed order ${orderId}, job ${order.jobId}:`,
                            emailNotificationResult
                        );

                        // Send real-time Socket.IO notifications
                        try {
                            const jobLocation = { lat: updatedJob.pickupLat, lng: updatedJob.pickupLng };
                            const nearbyProviders = await fetchProvidersWithLocation(
                                updatedJob.category || "Van",
                                jobLocation,
                                50
                            );

                            if (nearbyProviders && nearbyProviders.length > 0) {
                                const realtimeResult = await notifyNearbyProvidersAboutDeliveryJob(
                                    nearbyProviders,
                                    updatedJob
                                );
                                console.log(
                                    `Real-time notifications sent to ${realtimeResult.notifiedCount} providers for job ${order.jobId}`
                                );
                            }

                            notificationResult = emailNotificationResult;
                        } catch (realtimeError) {
                            console.error(
                                "Error sending real-time notifications (non-critical):",
                                realtimeError
                            );
                            // Continue with email notification result even if real-time fails
                            notificationResult = emailNotificationResult;
                        }
                    } catch (error) {
                        console.error(
                            "Error sending provider notifications:",
                            error
                        );
                        notificationResult = {
                            success: false,
                            notifiedCount: 0,
                            errors: [error.message]
                        };
                    }
                } else {
                    // Notifications already sent, just update deliveryOrderId link
                    await prisma.jobs.update({
                        where: { id: order.jobId },
                        data: {
                            deliveryOrderId: orderId
                        }
                    });
                    console.log(`Job ${order.jobId} already has notifications sent, only updated deliveryOrderId`);
                }
            }
        } else {
            // No job linked to this order
            console.log(`Order ${orderId} has no linked job`);
        }

        return NextResponse.json({
            success: true,
            message: "Order confirmed successfully",
            data: {
                orderId: updatedOrder.id,
                deliveryStatus: updatedOrder.deliveryStatus,
                shopConfirmedAt: updatedOrder.shopConfirmedAt,
                jobActivated: jobActivated,
                notifications: notificationResult ? {
                    notifiedCount: notificationResult.notifiedCount,
                    totalProviders: notificationResult.totalProviders,
                    success: notificationResult.success
                } : null
            }
        }, { status: 200 });

    } catch (error) {
        console.error("Error confirming order:", error);
        return NextResponse.json({
            success: false,
            message: error.message || "Failed to confirm order"
        }, { status: 500 });
    }
};

