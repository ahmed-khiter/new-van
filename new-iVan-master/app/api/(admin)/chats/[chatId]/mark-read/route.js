import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// Mark messages as read when user opens chat modal
export const POST = async (req, { params }) => {
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

        // Mark all messages as read for this user (only messages from other users)
        await prisma.messages.updateMany({
            where: {
                chatId: chatId,
                senderId: { not: parseInt(userId) }, // Don't mark own messages as read
                isRead: false
            },
            data: {
                isRead: true
            }
        });

        // Update last read time for the user
        await prisma.chat_participants.update({
            where: {
                chatId_userId: {
                    chatId: chatId,
                    userId: parseInt(userId)
                }
            },
            data: {
                lastReadAt: new Date()
            }
        });

        return NextResponse.json({ success: true }, { status: 200 });

    } catch (error) {
        console.error("Mark messages as read error:", error);
        return NextResponse.json({ error: "Failed to mark messages as read" }, { status: 500 });
    }
};
