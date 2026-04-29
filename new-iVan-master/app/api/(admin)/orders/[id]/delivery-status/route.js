import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { notifyOrderStatusUpdate, notifyDeliveryStarted, notifyDeliveryCompleted } from "@/utils/deliveryNotificationService";
import { sendEmail } from "@/lib/sendEmail";

export const dynamic = 'force-dynamic';

export const PATCH = async (req, { params }) => {
    try {
        const userRole = req.headers.get("role");
        const userId = req.headers.get("user-id");
        const orderId = params.id;

        if (!orderId) {
            return NextResponse.json({
                success: false,
                message: "Order ID is required"
            }, { status: 400 });
        }

        const { status, notes } = await req.json();

        if (!status) {
            return NextResponse.json({
                success: false,
                message: "Delivery status is required"
            }, { status: 400 });
        }

        // Valid status transitions
        // Note: 'dispatched' is set when driver accepts job, then transitions to 'in-transit' when picked up
        const validStatuses = ['pending', 'confirmed', 'assigned', 'dispatched', 'in-transit', 'delivered', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return NextResponse.json({
                success: false,
                message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
            }, { status: 400 });
        }

        // Get current order
        const order = await prisma.product_orders.findUnique({
            where: { id: orderId },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true
                    }
                },
                deliveryProvider: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true
                    }
                },
                shopConfirmedBy: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true
                    }
                },
                job: {
                    select: {
                        id: true,
                        status: true
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
                                                email: true,
                                                firstName: true,
                                                lastName: true
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

        if (!order) {
            return NextResponse.json({
                success: false,
                message: "Order not found"
            }, { status: 404 });
        }

        // Authorization checks based on status transition
        const currentStatus = order.deliveryStatus || 'pending';

        // Check if status transition is valid
        // Status flow: pending -> confirmed -> (assigned|dispatched) -> in-transit -> delivered
        const validTransitions = {
            'pending': ['confirmed', 'cancelled'],
            'confirmed': ['assigned', 'dispatched', 'cancelled'],
            'assigned': ['in-transit', 'cancelled'],
            'dispatched': ['in-transit', 'cancelled'], // Driver picks up from restaurant/shop
            'in-transit': ['delivered', 'cancelled'], // Out for delivery -> Order completed
            'delivered': [], // Final state
            'cancelled': [] // Final state
        };

        if (!validTransitions[currentStatus]?.includes(status)) {
            return NextResponse.json({
                success: false,
                message: `Cannot transition from ${currentStatus} to ${status}. Valid transitions: ${validTransitions[currentStatus]?.join(', ') || 'none'}`
            }, { status: 400 });
        }

        // Role-based authorization
        if (status === 'confirmed' && userRole !== 'shop-owner' && userRole !== 'restaurant') {
            return NextResponse.json({
                success: false,
                message: "Only shop owners and restaurants can confirm orders"
            }, { status: 403 });
        }

        if ((status === 'assigned' || status === 'dispatched' || status === 'in-transit' || status === 'delivered') && userRole !== 'provider') {
            return NextResponse.json({
                success: false,
                message: "Only providers can update delivery status to assigned, dispatched, in-transit, or delivered"
            }, { status: 403 });
        }

        // Only the assigned provider can update status after assignment
        if ((status === 'assigned' || status === 'dispatched' || status === 'in-transit' || status === 'delivered') && order.deliveryProviderId && parseInt(userId) !== order.deliveryProviderId) {
            return NextResponse.json({
                success: false,
                message: "Only the assigned provider can update this order"
            }, { status: 403 });
        }

        // Prepare update data
        const updateData = {
            deliveryStatus: status
        };

        // Set timestamps based on status
        if (status === 'delivered') {
            updateData.deliveredAt = new Date();
        }

        // Update order
        const updatedOrder = await prisma.product_orders.update({
            where: { id: orderId },
            data: updateData,
            include: {
                user: true,
                deliveryProvider: true,
                shopConfirmedBy: true,
                job: true
            }
        });

        // Update job status if needed
        if (order.jobId && order.job) {
            let jobStatus = order.job.status;
            
            if (status === 'in-transit') {
                jobStatus = 'in-progress';
            } else if (status === 'delivered') {
                jobStatus = 'completed';
                await prisma.jobs.update({
                    where: { id: order.jobId },
                    data: {
                        status: 'completed',
                        completedAt: new Date()
                    }
                });
            } else if (status === 'cancelled') {
                jobStatus = 'cancelled';
                await prisma.jobs.update({
                    where: { id: order.jobId },
                    data: {
                        status: 'cancelled'
                    }
                });
            }

            // Update job status if it changed
            if (jobStatus !== order.job.status) {
                await prisma.jobs.update({
                    where: { id: order.jobId },
                    data: { status: jobStatus }
                });
            }
        }

        // Send real-time status updates via Socket.IO
        try {
            // Collect user IDs to notify
            const userIdsToNotify = [];
            if (order.userId) userIdsToNotify.push(order.userId);
            if (order.shopConfirmedById) userIdsToNotify.push(order.shopConfirmedById);
            if (order.deliveryProviderId) userIdsToNotify.push(order.deliveryProviderId);

            // Notify all relevant parties
            await notifyOrderStatusUpdate(orderId, status, userIdsToNotify);

            // Emit specific events
            if (status === 'in-transit' && order.deliveryProviderId) {
                await notifyDeliveryStarted(orderId, order.deliveryProviderId, userIdsToNotify);
            } else if (status === 'delivered' && order.deliveryProviderId) {
                await notifyDeliveryCompleted(orderId, order.deliveryProviderId, userIdsToNotify);
            }
        } catch (socketError) {
            console.error("Error sending socket notification (non-critical):", socketError);
            // Don't fail the status update if socket fails
        }

        // Send email notifications based on status
        try {
            if (status === 'in-transit') {
                // Notify customer
                if (order.user && order.user.email) {
                    await sendEmail({
                        type: "deliveryInTransit",
                        email: order.user.email,
                        subject: `Your Order is Out for Delivery - Order #${orderId.substring(0, 8)}`,
                        customerName: `${order.user.firstName}${order.user.lastName ? ` ${order.user.lastName}` : ''}`,
                        orderId: orderId,
                        deliveryAddress: order.deliveryAddress
                    });
                }
            } else if (status === 'delivered') {
                // Notify customer
                if (order.user && order.user.email) {
                    await sendEmail({
                        type: "deliveryCompleted",
                        email: order.user.email,
                        subject: `Your Order Has Been Delivered - Order #${orderId.substring(0, 8)}`,
                        customerName: `${order.user.firstName}${order.user.lastName ? ` ${order.user.lastName}` : ''}`,
                        orderId: orderId,
                        deliveryAddress: order.deliveryAddress,
                        deliveredAt: updatedOrder.deliveredAt
                    });
                }

                // Notify shop owner
                const shopOwner = order.cart?.cartItems?.[0]?.product?.createdBy;
                if (shopOwner && shopOwner.email) {
                    await sendEmail({
                        type: "deliveryCompletedToShop",
                        email: shopOwner.email,
                        subject: `Order Delivered - Order #${orderId.substring(0, 8)}`,
                        shopOwnerName: `${shopOwner.firstName}${shopOwner.lastName ? ` ${shopOwner.lastName}` : ''}`,
                        orderId: orderId,
                        customerName: `${order.user?.firstName}${order.user?.lastName ? ` ${order.user.lastName}` : ''}`
                    });
                }
            }
        } catch (emailError) {
            console.error("Error sending email notifications (non-critical):", emailError);
            // Don't fail the status update if email fails
        }

        return NextResponse.json({
            success: true,
            message: `Delivery status updated to ${status}`,
            data: {
                orderId: updatedOrder.id,
                deliveryStatus: updatedOrder.deliveryStatus,
                deliveredAt: updatedOrder.deliveredAt
            }
        }, { status: 200 });

    } catch (error) {
        console.error("Error updating delivery status:", error);
        return NextResponse.json({
            success: false,
            message: error.message || "Failed to update delivery status"
        }, { status: 500 });
    }
};

