import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const GET = async (request) => {
    const userId = request.headers.get("user-id");

    if (!userId) {
        return NextResponse.json(
            { error: "User ID header is required" },
            { status: 400 }
        );
    }

    const parsedUserId = parseInt(userId);
    try {
        const jobs = await prisma.jobs.findMany({
            where: { acceptedById: parsedUserId },
            include: {
                chat: {
                    select: {
                        id: true,
                        _count: {
                            select: {
                                messages: {
                                    where: {
                                        senderId: { not: parsedUserId },
                                        isRead: false
                                    }
                                }
                            }
                        }
                    }
                }
            },
            orderBy: { updatedAt: "desc" },
        });
        
        const updatedJobs = jobs.map(job => ({
            ...job,
            distance: job.distance * 2,
            chatId: job.chat?.id || null,
            unreadMessageCount: job.chat?._count?.messages || 0
        }));

        // Enrich with latest submitted feedback (itemId === job.id)
        const jobIds = updatedJobs.map(j => j.id);
        let feedbackMap = {};
        if (jobIds.length > 0) {
            const feedbacks = await prisma.feedbacks.findMany({
                where: {
                    itemType: 'job',
                    itemId: { in: jobIds },
                    status: 'submitted'
                },
                select: { itemId: true, rating: true, feedback: true, feedbackAt: true },
                orderBy: { feedbackAt: 'desc' }
            });

            for (const fb of feedbacks) {
                if (!feedbackMap[fb.itemId]) {
                    feedbackMap[fb.itemId] = { rating: fb.rating ?? null, feedback: fb.feedback ?? null };
                }
            }
        }

        // Fetch delivery orders for jobs that have deliveryOrderId
        const deliveryOrderIds = updatedJobs
            .map(j => j.deliveryOrderId)
            .filter(Boolean);
        
        let deliveryOrderMap = {};
        if (deliveryOrderIds.length > 0) {
            const deliveryOrders = await prisma.product_orders.findMany({
                where: { id: { in: deliveryOrderIds } },
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
            deliveryOrderMap = deliveryOrders.reduce((acc, order) => {
                acc[order.id] = order;
                return acc;
            }, {});
        }

        const jobsWithFeedback = updatedJobs.map(job => ({
            ...job,
            rating: feedbackMap[job.id]?.rating ?? null,
            feedback: feedbackMap[job.id]?.feedback ?? null,
            deliveryOrder: job.deliveryOrderId ? deliveryOrderMap[job.deliveryOrderId] || null : null
        }));

        return NextResponse.json(
            {
                message: "Provider dashboard fetched successfully",
                jobs: jobsWithFeedback,
            },
            { status: 200 }
        );
    } catch (err) {
        return NextResponse.json(
            { error: err.message || "Failed to fetch provider dashboard" },
            { status: 500 }
        );
    }
};
