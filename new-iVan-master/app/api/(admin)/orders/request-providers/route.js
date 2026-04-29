import prisma from "@/lib/prisma";
import { notifyProvidersAboutJob } from "@/utils/jobService";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export const POST = async (req, { params }) => {
    try {
        const userId = req.headers.get("user-id");
        const body = await req.json();
        const { orderId } = body;

        if (!orderId) {
            return NextResponse.json({
                success: false,
                message: "Order ID is required",
                data: null
            }, { status: 400 });
        }

        const shopOwnerId = parseInt(userId);

        // Fetch the order with all related data
        const order = await prisma.product_orders.findUnique({
            where: { id: orderId },
            include: {
                job: {
                    select: {
                        id: true,
                        status: true,
                        category: true,
                        pickupLat: true,
                        pickupLng: true,
                        notificationSentAt: true,
                        vanSize: true
                    }
                }
            }
        });

        if (!order) {
            return NextResponse.json({
                success: false,
                message: "Order not found",
                data: null
            }, { status: 404 });
        }

        // Verify order status is "paid" and deliveryStatus is "ready_to_dispatch"
        if (order.status !== "paid") {
            return NextResponse.json({
                success: false,
                message: `Order cannot send provider requests. Current status: ${order.status}. Order must be in "paid" status.`,
                data: null
            }, { status: 400 });
        }

        // Ensure job exists and update it with vehicle type
        if (!order.jobId || !order.job) {
            return NextResponse.json({
                success: false,
                message: "Order does not have a linked delivery job",
                data: null
            }, { status: 400 });
        }

        // Update job with vehicle type and ensure it's active
        const updatedJob = await prisma.jobs.update({
            where: { id: order.jobId },
            data: {
                status: "active",
                notificationSentAt: new Date()
            }
        });

        // Send notifications to providers with the specified vehicle type
        let notificationResult = null;

        try {
            // Send email notifications (will filter by vehicle type)
            const emailNotificationResult = await notifyProvidersAboutJob(updatedJob, updatedJob.vanSize);
            console.log(
                `Email notifications sent for order ${orderId}, job ${order.jobId} with vehicle type ${updatedJob.vanSize}:`,
                emailNotificationResult
            );
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
        
        await prisma.product_orders.update({
            where: { id: orderId },
            data: {
                deliveryStatus: 'waiting_for_provider'
            }
        });
        return NextResponse.json({
            success: true,
            message: "Provider request sent successfully",
            data: {
                orderId: order.id,
                jobId: updatedJob.id,
                vehicleType: updatedJob.vanSize,
                notifications: notificationResult ? {
                    notifiedCount: notificationResult.notifiedCount,
                    totalProviders: notificationResult.totalProviders,
                    success: notificationResult.success
                } : null
            }
        }, { status: 200 });

    } catch (error) {
        console.error("Error sending provider request:", error);
        return NextResponse.json({
            success: false,
            message: error.message || "Failed to send provider request",
            data: null
        }, { status: 500 });
    }
};

