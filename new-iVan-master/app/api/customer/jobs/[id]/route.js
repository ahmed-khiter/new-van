import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export const GET = async (req, { params }) => {
    try {
        const userId = req.headers.get("user-id");
        const jobId = params.id;

        if (!userId) {
            return NextResponse.json(
                { error: "User ID is required" },
                { status: 401 }
            );
        }

        if (!jobId) {
            return NextResponse.json(
                { error: "Job ID is required" },
                { status: 400 }
            );
        }

        const job = await prisma.jobs.findUnique({
            where: { id: jobId },
            include: {
                createdBy: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        phone: true
                    }
                },
                acceptedBy: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        phone: true,
                        profilePicture: true,
                        latitude: true,
                        longitude: true
                    }
                },
                productOrders: {
                    select: {
                        id: true,
                        deliveryStatus: true,
                        status: true,
                        deliveryAddress: true
                    }
                },
                chat: {
                    select: {
                        id: true
                    }
                }
            }
        });

        // Get transaction for this job to include card information
        const transaction = await prisma.transaction.findFirst({
            where: { job_id: jobId },
            select: {
                cardBrand: true,
                lastFourDigit: true
            },
            orderBy: { date: 'desc' }
        });

        if (!job) {
            return NextResponse.json(
                { error: "Job not found" },
                { status: 404 }
            );
        }

        // Verify the job belongs to the user
        if (job.createdById !== parseInt(userId)) {
            return NextResponse.json(
                { error: "Unauthorized access to this job" },
                { status: 403 }
            );
        }

        // Add chatId and transaction card info to the job object and remove the nested chat object
        // Note: All base job fields (including price) are included since we use 'include' not 'select'
        const { chat, ...jobWithoutChat } = job;
        const jobWithChatId = {
            ...jobWithoutChat,
            chatId: chat?.id || null,
            price: job.price, // Explicitly ensure price is included
            transaction: transaction || null // Include transaction with card info
        };

        return NextResponse.json({
            success: true,
            job: jobWithChatId
        }, { status: 200 });

    } catch (error) {
        console.error("Error fetching job:", error);
        return NextResponse.json(
            { error: error.message || "Failed to fetch job" },
            { status: 500 }
        );
    }
};

