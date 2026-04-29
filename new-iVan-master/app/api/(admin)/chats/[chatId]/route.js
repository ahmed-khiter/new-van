import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getJobChat } from "@/utils/chatService";

// Get a specific chat
export const GET = async (req, { params }) => {
    try {
        const { chatId } = params;
        const userId = req.headers.get("user-id");
        const userRole = req.headers.get("role");

        if (!userId) {
            return NextResponse.json({ error: "User ID is required" }, { status: 401 });
        }

        // Check if user is a participant in this chat
        const participant = await prisma.chat_participants.findUnique({
            where: {
                chatId_userId: {
                    chatId: chatId,
                    userId: parseInt(userId)
                }
            }
        });

        if (!participant) {
            return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }

        // Get the chat with all details
        const chat = await prisma.chats.findUnique({
            where: { id: chatId },
            include: {
                participants: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                email: true,
                                role: true
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
                        pickupAddressLine1: true,
                        dropOffAddressLine1: true,
                        pickupDate: true,
                        dropOffDate: true,
                        notes: true,
                        createdBy: {
                            select: {
                                firstName: true,
                                lastName: true,
                                email: true
                            }
                        },
                        acceptedBy: {
                            select: {
                                firstName: true,
                                lastName: true,
                                email: true
                            }
                        }
                    }
                },
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 50, // Get last 50 messages
                    include: {
                        sender: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                role: true,
                                profilePicture: true
                            }
                        }
                    }
                },
                _count: {
                    select: {
                        messages: true
                    }
                }
            }
        });

        if (!chat) {
            return NextResponse.json({ error: "Chat not found" }, { status: 404 });
        }

        // Reverse messages to show oldest first
        chat.messages.reverse();

        return NextResponse.json(chat, { status: 200 });

    } catch (error) {
        console.error("Get chat error:", error);
        return NextResponse.json({ error: "Failed to get chat" }, { status: 500 });
    }
};
