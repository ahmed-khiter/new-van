import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { v4 as uuid } from "uuid";

// GET or create a support chat between the current user and admin
export const POST = async (req) => {
    try {
        const userId = req.headers.get("user-id");
        const userRole = req.headers.get("role");

        if (!userId) {
            return NextResponse.json({ error: "User ID is required" }, { status: 401 });
        }

        const userIdInt = parseInt(userId);

        // Check if user already has a support chat
        const existingChat = await prisma.chats.findFirst({
            where: {
                type: "support",
                participants: {
                    some: {
                        userId: userIdInt
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
                }
            }
        });

        if (existingChat) {
            return NextResponse.json(existingChat, { status: 200 });
        }

        // Find admin user
        const adminUser = await prisma.users.findFirst({
            where: { role: "admin" }
        });

        if (!adminUser) {
            return NextResponse.json({ error: "No admin user found" }, { status: 500 });
        }

        // Create new support chat
        const chatId = uuid();
        const chat = await prisma.chats.create({
            data: {
                id: chatId,
                type: "support",
            }
        });

        // Add participants: the user and admin
        const participants = [
            {
                chatId: chat.id,
                userId: adminUser.id,
                role: "admin"
            },
            {
                chatId: chat.id,
                userId: userIdInt,
                role: userRole || "visitor"
            }
        ];

        await prisma.chat_participants.createMany({
            data: participants
        });

        // Create a welcome system message
        await prisma.messages.create({
            data: {
                id: uuid(),
                chatId: chat.id,
                senderId: adminUser.id,
                content: "Welcome to support chat. How can we help you?",
                messageType: "system",
                isRead: false
            }
        });

        // Return the created chat with participants
        const chatWithDetails = await prisma.chats.findUnique({
            where: { id: chat.id },
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
                }
            }
        });

        return NextResponse.json(chatWithDetails, { status: 201 });

    } catch (error) {
        console.error("Support chat error:", error);
        return NextResponse.json({ error: "Failed to create support chat" }, { status: 500 });
    }
};
