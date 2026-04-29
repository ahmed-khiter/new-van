import prisma from "@/lib/prisma";

/**
 * Create a notification for a user
 * @param {number} userId - The user ID to notify
 * @param {string} type - Notification type (chat, document_approved, document_rejected, payment, order, system)
 * @param {string} title - Notification title
 * @param {string} message - Optional notification message
 * @param {object} metadata - Optional metadata (chatId, documentId, jobId, etc.)
 * @returns {Promise<object>} Created notification
 */
export async function createNotification(userId, type, title, message = null, metadata = null) {
  try {
    const notification = await prisma.notifications.create({
      data: {
        userId,
        type,
        title,
        message,
        metadata: metadata || null,
        status: "unread"
      }
    });

    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
}

/**
 * Create notification for new chat message
 */
export async function createChatNotification(recipientUserId, chatId, jobTitle = null) {
  const title = jobTitle ? `New message - ${jobTitle}` : "New message";
  return createNotification(
    recipientUserId,
    "chat",
    title,
    null,
    { chatId, jobTitle }
  );
}

/**
 * Create notification for document approval
 */
export async function createDocumentApprovedNotification(userId, documentName) {
  return createNotification(
    userId,
    "document_approved",
    "Document Approved",
    null,
    { documentName }
  );
}

/**
 * Create notification for document rejection
 */
export async function createDocumentRejectedNotification(userId, documentName, reason = null) {
  return createNotification(
    userId,
    "document_rejected",
    "Document Rejected",
    reason,
    { documentName, reason }
  );
}

/**
 * Create notification for payment processed
 */
export async function createPaymentNotification(userId, amount, jobId = null, jobTitle = null) {
  return createNotification(
    userId,
    "payment",
    "Payment Processed",
    null,
    { amount, jobId, jobTitle }
  );
}

