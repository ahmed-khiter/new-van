import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { v4 as uuid } from "uuid";
import { uploadFileToS3 } from "@/utils/s3Helper";
import { getFileUrl } from "@/utils/helper";
import { createChatNotification } from "@/utils/notificationService";


export const GET = async (req, { params }) => {
    try {
        const { chatId } = params;
        const userId = req.headers.get("user-id");
        const userRole = req.headers.get("role");

        if (!userId) {
            return NextResponse.json({ error: "User ID is required" }, { status: 401 });
        }

        
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

        // Get chat with job to read deliveryOrderId
        const chat = await prisma.chats.findUnique({
            where: { id: chatId },
            select: {
                job: {
                    select: { deliveryOrderId: true }
                }
            }
        });

        const messages = await prisma.messages.findMany({
            where: { chatId },
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
            },
            orderBy: { createdAt: 'asc' }
        });

        // Add full URLs for profile pictures
        const messagesWithUrls = messages.map(message => ({
            ...message,
            sender: {
                ...message.sender,
                profilePictureUrl: getFileUrl(message.sender.profilePicture)
            }
        }));

        const deliveryOrderId = chat?.job?.deliveryOrderId ?? null;

        return NextResponse.json({
            messages: messagesWithUrls,
            deliveryOrderId
        }, { status: 200 });

    } catch (error) {
        console.error("Get messages error:", error);
        return NextResponse.json({ error: "Failed to get messages" }, { status: 500 });
    }
};


export const POST = async (req, { params }) => {
    try {
        const { chatId } = params;
        const userId = req.headers.get("user-id");
        const userRole = req.headers.get("role");

        if (!userId) {
            return NextResponse.json({ error: "User ID is required" }, { status: 401 });
        }

        
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

        
        const formData = await req.formData();
        const content = formData.get("content") || "";
        const messageType = formData.get("messageType") || "text";
        const files = formData.getAll("files");
        
        let metadata = null;
        
        
        if (files && files.length > 0) {
            const uploadedFiles = await handleFileUploads(files, chatId);
            
            if (uploadedFiles.length > 0) {
                
                metadata = {
                    files: uploadedFiles
                };
            }
        }

        
        if (!content.trim() && (!metadata || !metadata.files || metadata.files.length === 0)) {
            return NextResponse.json({ error: "Message content or files are required" }, { status: 400 });
        }

        
        const validMessageTypes = ["text", "image", "file", "system", "location", "job_update"];
        if (!validMessageTypes.includes(messageType)) {
            return NextResponse.json({ error: "Invalid message type" }, { status: 400 });
        }

        
        const message = await prisma.messages.create({
            data: {
                id: uuid(),
                chatId: chatId,
                senderId: parseInt(userId),
                content: content.trim(),
                messageType: messageType,
                metadata: metadata || null
            },
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
        });

        // Add full URL for profile picture
        const messageWithUrl = {
            ...message,
            sender: {
                ...message.sender,
                profilePictureUrl: getFileUrl(message.sender.profilePicture)
            }
        };

        
        await prisma.chats.update({
            where: { id: chatId },
            data: { updatedAt: new Date() }
        });

        // Create notification for other participants (non-blocking)
        try {
            const chat = await prisma.chats.findUnique({
                where: { id: chatId },
                include: {
                    participants: {
                        where: {
                            userId: { not: parseInt(userId) }
                        }
                    },
                    job: {
                        select: {
                            title: true
                        }
                    }
                }
            });

            if (chat && chat.participants.length > 0) {
                // Use "Admin Support" as title for support chats
                const chatTitle = chat.type === "support" ? "Admin Support" : chat.job?.title;
                // Create notification for each participant
                const notificationPromises = chat.participants.map(participant =>
                    createChatNotification(participant.userId, chatId, chatTitle)
                );
                await Promise.all(notificationPromises);
            }
        } catch (error) {
            console.error('Error creating chat notifications:', error);
            // Don't fail message creation if notification creation fails
        }

        return NextResponse.json(messageWithUrl, { status: 201 });

    } catch (error) {
        console.error("Send message error:", error);
        return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
    }
};


async function handleFileUploads(files, chatId) {
    const uploadedFiles = [];
    
    for (const file of files) {
        if (!file || file.size === 0) continue;
        
        
        const allowedTypes = ['image/png', 'image/jpg', 'image/jpeg', 'application/pdf', 'text/plain'];
        if (!allowedTypes.includes(file.type)) {
            throw new Error(`File type ${file.type} is not allowed`);
        }
        
        
        if (file.size > 10 * 1024 * 1024) {
            throw new Error(`File ${file.name} is too large. Maximum size is 10MB`);
        }
        
        try {
            
            const fileName = await uploadFileToS3(file);
            
            if (fileName) {
                uploadedFiles.push({
                    fileName,
                    type: file.type,
                    fileSize: file.size
                });
            }
        } catch (error) {
            console.error(`Error uploading file ${file.name}:`, error);
            throw new Error(`Failed to upload file ${file.name}: ${error.message}`);
        }
    }
    
    return uploadedFiles;
}
