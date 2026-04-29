import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { geocodePostcode } from "@/utils/geocode";
import { handleProviderPaymentEmailSending } from "@/utils/providerPaymentEmailService";

export const POST = async (req, { params }) => {
    try {
        const { id } = params;
        const payload = await req.json();
        const userId = req.headers.get("user-id");

        if (!id) {
            return NextResponse.json({ error: "Job ID is required" }, { status: 400 });
        }

        const { id: jobId, ...updateFields } = payload;

        // Check if createdById doesn't exist and set it with current user ID
        if (userId && !updateFields.createdById) {
            // First, check if the existing job has createdById
            const existingJob = await prisma.jobs.findUnique({
                where: { id },
                select: { createdById: true }
            });
            
            // If the existing job doesn't have createdById, set it
            if (existingJob && !existingJob.createdById) {
                updateFields.createdById = Number(userId);
            }
        }

        // If job is being marked as completed, set completedAt timestamp
        if (updateFields.status === "completed") {
            updateFields.completedAt = new Date();
            updateFields.providerPaymentStatus = "pending";
        }

        const updatedJob = await prisma.jobs.update({
            where: { id },
            data: updateFields,
        });

        // If job is being marked as completed, also mark related product orders as completed and delivered
        if (updateFields.status === "completed") {
            await prisma.product_orders.updateMany({
                where: { 
                    jobId: id,
                    status: "paid"
                },
                data: { 
                    deliveryStatus: "delivered",
                    deliveredAt: new Date(),
                    shopOwnerPaymentStatus: "pending"
                }
            });
            console.log(`Job ${id} completed - related orders marked as completed and delivered`);

            // Send payment notification email to provider (non-blocking)
            if (updatedJob.acceptedById && updatedJob.price) {
                try {
                    await handleProviderPaymentEmailSending(
                        id, 
                        updatedJob.acceptedById, 
                        updatedJob.price, 
                        "Bank Transfer"
                    );
                    console.log(`Provider payment email sent for job ${id}`);
                } catch (error) {
                    console.error(`Failed to send provider payment email for job ${id}:`, error);
                    // Don't fail the job completion if email sending fails
                }
            }
        }

        return NextResponse.json(updatedJob, { status: 200 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: error.message || "Failed to update job" }, { status: 500 });
    }
};


export const GET = async (req, { params }) => {
    try {
        const { id } = params;

        if (!id) {
            return NextResponse.json({ error: "Job ID is required" }, { status: 400 });
        }

        const job = await prisma.jobs.findUnique({
            where: { id },
            include: {
                productOrders: {
                    select: {
                        id: true,
                        deliveryStatus: true,
                        status: true,
                        deliveryAddress: true,
                        shop: {
                            select: {
                                id: true,
                                name: true,
                                type: true,
                                address1: true
                            }
                        }
                    }
                }
            }
        });

        if (!job) {
            return NextResponse.json({ error: "Job not found" }, { status: 404 });
        }

        // Fetch latest submitted feedback for this job
        const latestFeedback = await prisma.feedbacks.findFirst({
            where: { itemType: 'job', itemId: id, status: 'submitted' },
            select: { rating: true, feedback: true, feedbackAt: true },
            orderBy: { feedbackAt: 'desc' }
        });

        // If job has deliveryOrderId, fetch the delivery order
        let deliveryOrder = null;
        if (job.deliveryOrderId) {
            deliveryOrder = await prisma.product_orders.findUnique({
                where: { id: job.deliveryOrderId },
                select: {
                    id: true,
                    deliveryStatus: true,
                    status: true,
                    deliveryAddress: true,
                    deliveryCity: true,
                    deliveryPostCode: true,
                    shop: {
                        select: {
                            id: true,
                            name: true,
                            type: true,
                            address1: true
                        }
                    }
                }
            });
        }

        const jobWithFeedback = {
            ...job,
            rating: latestFeedback?.rating ?? null,
            feedback: latestFeedback?.feedback ?? null,
            deliveryOrder: deliveryOrder
        };

        return NextResponse.json({ job: jobWithFeedback }, { status: 200 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: error.message || "Failed to fetch job" }, { status: 500 });
    }
};

export const DELETE = async (req, { params }) => {
    try {
        const { id } = params;
        if (!id) {
            return NextResponse.json({ error: "Job ID is required" }, { status: 400 });
        }

        // First, check if the job exists
        const existingJob = await prisma.jobs.findUnique({
            where: { id },
            include: {
                chat: {
                    include: {
                        messages: true,
                        participants: true
                    }
                }
            }
        });

        if (!existingJob) {
            return NextResponse.json({ error: "Job not found" }, { status: 404 });
        }

        // Use a transaction to ensure all related data is deleted properly
        await prisma.$transaction(async (tx) => {
            // Get product orders related to this job
            const productOrders = await tx.product_orders.findMany({
                where: { jobId: id },
                select: { id: true, cartId: true }
            });

            // Delete cart items for each product order's cart
            for (const order of productOrders) {
                if (order.cartId) {
                    await tx.cart_items.deleteMany({
                        where: { cartId: order.cartId }
                    });
                }
            }

            // Delete the product orders
            await tx.product_orders.deleteMany({
                where: { jobId: id }
            });

            // Delete empty carts (carts with no remaining items)
            const cartIds = productOrders.map(order => order.cartId).filter(Boolean);
            if (cartIds.length > 0) {
                await tx.cart.deleteMany({
                    where: {
                        id: { in: cartIds },
                        cartItems: { none: {} }
                    }
                });
            }

            // Delete messages first (if any)
            if (existingJob.chat?.messages?.length > 0) {
                await tx.messages.deleteMany({
                    where: { chatId: existingJob.chat.id }
                });
            }

            // Delete chat participants (if any)
            if (existingJob.chat?.participants?.length > 0) {
                await tx.chat_participants.deleteMany({
                    where: { chatId: existingJob.chat.id }
                });
            }

            // Delete the chat (if exists)
            if (existingJob.chat) {
                await tx.chats.delete({
                    where: { id: existingJob.chat.id }
                });
            }

            // Finally, delete the job
            await tx.jobs.delete({
                where: { id }
            });
        });

        return NextResponse.json({ 
            message: "Job and all related data deleted successfully",
        }, { status: 200 });
    } catch (error) {
        console.error("Error deleting job:", error);
        return NextResponse.json({ error: error.message || "Failed to delete job" }, { status: 500 });
    }
};