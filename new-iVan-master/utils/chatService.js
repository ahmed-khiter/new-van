import prisma from "@/lib/prisma";
import { v4 as uuid } from "uuid";

/**
 * Create a chat for a job when it's accepted by a provider
 * @param {string} jobId - The job ID
 * @param {number} providerId - The provider who accepted the job
 * @returns {Promise<Object>} The created chat object
 */
export const createJobChat = async (jobId, providerId) => {
    try {
        // Get job details with creator and accepter info
        const job = await prisma.jobs.findUnique({
            where: { id: jobId },
            include: {
                createdBy: true,
                acceptedBy: true
            }
        });

        if (!job) {
            throw new Error("Job not found");
        }

        // Check if chat already exists
        const existingChat = await prisma.chats.findUnique({
            where: { jobId }
        });

        if (existingChat) {
            throw new Error("Chat already exists for this job");
        }

        // Create the chat
        const chat = await prisma.chats.create({
            data: {
                id: uuid(),
                jobId: jobId
            }
        });

        // Add participants based on job creator
        const participants = [];

        // Always add admin (find first admin user)
        const adminUser = await prisma.users.findFirst({
            where: { role: "admin" }
        });

        if (adminUser) {
            participants.push({
                chatId: chat.id,
                userId: adminUser.id,
                role: "admin"
            });
        }

        // Add provider (acceptedBy)
        participants.push({
            chatId: chat.id,
            userId: providerId,
            role: "provider"
        });

        // Add visitor (createdBy) if job was created by visitor
        if (job.createdById && job.createdBy?.role === "visitor") {
            participants.push({
                chatId: chat.id,
                userId: job.createdById,
                role: "visitor"
            });
        }

        // Create all participants
        await prisma.chat_participants.createMany({
            data: participants
        });

        // Create a system message
        await prisma.messages.create({
            data: {
                id: uuid(),
                chatId: chat.id,
                senderId: adminUser?.id || 1, // System message from admin
                content: "Chat started for this job. You can now communicate about the job details.",
                messageType: "system" ,
                isRead: true
            }
        });

        // Return the created chat with participants
        const chatWithParticipants = await prisma.chats.findUnique({
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
                                role: true
                            }
                        }
                    }
                },
                job: {
                    select: {
                        id: true,
                        title: true,
                        status: true
                    }
                }
            }
        });

        return chatWithParticipants;

    } catch (error) {
        console.error("Error creating job chat:", error);
        throw error;
    }
};

/**
 * Handle chat creation after job acceptance
 * This function is called from the accept job API
 * @param {string} jobId - The job ID
 * @param {number} providerId - The provider who accepted the job
 * @returns {Promise<void>}
 */
export const handleJobAcceptanceChatCreation = async (jobId, providerId) => {
    try {
        await createJobChat(jobId, providerId);
        console.log(`Chat created successfully for job ${jobId}`);
    } catch (error) {
        console.error(`Failed to create chat for job ${jobId}:`, error);
        // Don't throw error - chat creation failure shouldn't fail job acceptance
    }
};

/**
 * Get chat for a specific job
 * @param {string} jobId - The job ID
 * @returns {Promise<Object|null>} The chat object or null if not found
 */
export const getJobChat = async (jobId) => {
    try {
        const chat = await prisma.chats.findUnique({
            where: { jobId },
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
                }
            }
        });

        return chat;
    } catch (error) {
        console.error("Error getting job chat:", error);
        throw error;
    }
};

/**
 * Check if a user has access to a job's chat
 * @param {string} jobId - The job ID
 * @param {number} userId - The user ID
 * @param {string} userRole - The user role
 * @returns {Promise<boolean>} Whether the user has access
 */
export const hasChatAccess = async (jobId, userId, userRole) => {
    try {
        // Admin always has access
        if (userRole === "admin") return true;

        // Get job details
        const job = await prisma.jobs.findUnique({
            where: { id: jobId },
            select: {
                createdById: true,
                acceptedById: true,
                status: true
            }
        });

        if (!job) return false;

        // Job must be in "open" status (accepted by provider)
        if (job.status !== "open") return false;

        // Provider has access if they accepted the job
        if (userRole === "provider" && job.acceptedById === userId) return true;

        // Visitor has access if they created the job
        if (userRole === "visitor" && job.createdById === userId) return true;

        return false;
    } catch (error) {
        console.error("Error checking chat access:", error);
        return false;
    }
};