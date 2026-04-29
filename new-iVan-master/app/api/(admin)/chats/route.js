import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { createJobChat } from "@/utils/chatService";

// Create a new chat for a job (manual creation if needed)
export const POST = async (req) => {
    try {
        const { jobId } = await req.json();
        const userId = req.headers.get("user-id");
        const userRole = req.headers.get("role");

        if (!jobId) {
            return NextResponse.json({ error: "Job ID is required" }, { status: 400 });
        }

        if (!userId) {
            return NextResponse.json({ error: "User ID is required" }, { status: 401 });
        }

        // Check if job exists and get full details
        const job = await prisma.jobs.findUnique({
            where: { id: jobId },
            include: {
                createdBy: true,
                acceptedBy: true
            }
        });

        if (!job) {
            return NextResponse.json({ error: "Job not found" }, { status: 404 });
        }

        // Only allow chat creation for jobs with status "open" (accepted by provider)
        if (job.status !== "open") {
            return NextResponse.json({ 
                error: "Chat can only be created for accepted jobs" 
            }, { status: 400 });
        }

        // Check if user has access to this job's chat
        const userRoleValue = userRole;
        const userIdValue = parseInt(userId);
        
        // Admin can always create chat
        if (userRoleValue !== "admin") {
            // Provider can create chat if they accepted the job
            if (userRoleValue === "provider" && job.acceptedById !== userIdValue) {
                return NextResponse.json({ error: "Access denied" }, { status: 403 });
            }
            
            // Visitor can create chat if they created the job
            if (userRoleValue === "visitor" && job.createdById !== userIdValue) {
                return NextResponse.json({ error: "Access denied" }, { status: 403 });
            }
        }

        // Create the chat using the service function
        const chat = await createJobChat(jobId, job.acceptedById);

        return NextResponse.json(chat, { status: 201 });

    } catch (error) {
        console.error("Create chat error:", error);
        return NextResponse.json({ error: "Failed to create chat" }, { status: 500 });
    }
};

// Get chats for a user
export const GET = async (req) => {
    try {
        const userId = req.headers.get("user-id");
        const userRole = req.headers.get("role");

        if (!userId) {
            return NextResponse.json({ error: "User ID is required" }, { status: 401 });
        }

        // Get all chats where user is a participant
        const chats = await prisma.chats.findMany({
            where: {
                participants: {
                    some: {
                        userId: parseInt(userId)
                    }
                }
            },
            include: {
                participants: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                email: true,
                                role: true,
                                profilePicture: true
                            }
                        }
                    }
                },
                job: {
                    select: {
                        id: true,
                        title: true,
                        status: true,
                        category: true,
                        price: true,
                        pickupCity: true,
                        createdBy: {
                            select: {
                                firstName: true,
                                lastName: true
                            }
                        }
                    }
                },
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                    include: {
                        sender: {
                            select: {
                                firstName: true,
                                lastName: true
                            }
                        }
                    }
                },
                _count: {
                    select: {
                        messages: true
                    }
                }
            },
            orderBy: { updatedAt: 'desc' }
        });

        // Add unread message count to each chat
        const chatsWithUnreadCount = await Promise.all(
            chats.map(async (chat) => {
                const unreadCount = await prisma.messages.count({
                    where: {
                        chatId: chat.id,
                        senderId: { not: parseInt(userId) },
                        isRead: false
                    }
                });

                return {
                    ...chat,
                    unreadMessageCount: unreadCount, 
                };
            })
        );

        return NextResponse.json(chatsWithUnreadCount, { status: 200 });

    } catch (error) {
        console.error("Get chats error:", error);
        return NextResponse.json({ error: error.message || "Failed to get chats" }, { status: 500 });
    }
};
