import prisma from "@/lib/prisma";
import { ensurePendingFeedbacksForUser } from "@/utils/reviewService";

/**
 * Creates a pending feedback entry for a completed job
 * @param {string} jobId - The ID of the completed job
 * @param {number} createdById - The ID of the user who created the job
 * @returns {Promise<Object>} The created feedback entry
 */
export async function createPendingJobFeedback(jobId, createdById) {
  try {
    // First, check if the user exists and has visitor role
    const user = await prisma.users.findUnique({
      where: { id: parseInt(createdById) },
      select: { id: true, role: true }
    });

    if (!user) {
      console.log(`User ${createdById} not found`);
      return null;
    }

    if (user.role !== 'visitor') {
      console.log(`User ${createdById} is not a visitor (role: ${user.role}), skipping feedback creation`);
      return null;
    }

    // Check if feedback already exists for this job
    const existingFeedback = await prisma.feedbacks.findFirst({
      where: {
        itemType: 'job',
        itemId: jobId,
        userId: parseInt(createdById)
      }
    });

    if (existingFeedback) {
      console.log(`Feedback already exists for job ${jobId} by user ${createdById}`);
      return existingFeedback;
    }

    // Create pending feedback entry
    const feedback = await prisma.feedbacks.create({
      data: {
        itemType: 'job',
        itemId: jobId,
        userId: parseInt(createdById),
        status: 'pending',
      }
    });

    console.log(`Created pending feedback for job ${jobId} by user ${createdById} (visitor)`);
    return feedback;
  } catch (error) {
    console.error('Error creating pending job feedback:', error);
    throw error;
  }
}

/**
 * Gets pending feedbacks for a user
 * @param {number} userId - The ID of the user
 * @returns {Promise<Array>} Array of pending feedbacks with job details
 */
export async function getPendingFeedbacks(userId) {
  try {
    const parsedUserId = parseInt(userId);
    if (!parsedUserId) return [];

    await ensurePendingFeedbacksForUser(parsedUserId);

    const pendingFeedbacks = await prisma.feedbacks.findMany({
      where: {
        userId: parsedUserId,
        status: "pending",
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Include related entity details for each feedback type
    const feedbacksWithDetails = await Promise.all(
      pendingFeedbacks.map(async (feedback) => {
        if (feedback.itemType === "job") {
          const job = await prisma.jobs.findUnique({
            where: { id: feedback.itemId },
            select: {
              id: true,
              title: true,
              category: true,
              status: true,
              createdAt: true,
              updatedAt: true,
              acceptedById: true,
              acceptedBy: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  profilePicture: true
                }
              }
            }
          });

          return {
            ...feedback,
            jobDetails: job
          };
        }

        if (feedback.itemType === "order") {
          const order = await prisma.product_orders.findUnique({
            where: { id: feedback.orderId || feedback.itemId },
            select: {
              id: true,
              createdAt: true,
              deliveredAt: true,
              deliveryStatus: true,
              status: true,
              totalCartPrice: true,
              shop: {
                select: {
                  id: true,
                  name: true,
                  type: true,
                  image: true,
                },
              },
            },
          });

          return {
            ...feedback,
            orderDetails: order,
          };
        }

        if (feedback.itemType === "reservation") {
          const reservation = await prisma.reservations.findUnique({
            where: { id: feedback.bookingId || feedback.itemId },
            select: {
              id: true,
              reservationDate: true,
              reservationTime: true,
              status: true,
              completedAt: true,
              restaurant: {
                select: {
                  id: true,
                  name: true,
                  type: true,
                  image: true,
                },
              },
            },
          });

          return {
            ...feedback,
            reservationDetails: reservation,
          };
        }

        return feedback;
      })
    );

    return feedbacksWithDetails;
  } catch (error) {
    console.error('Error fetching pending feedbacks:', error);
    throw error;
  }
}

/**
 * Submits feedback (rating and/or text)
 * @param {string} feedbackId - The ID of the feedback entry
 * @param {Object} feedbackData - The feedback data
 * @param {number} feedbackData.rating - Rating from 1-5
 * @param {string} feedbackData.feedback - Text feedback
 * @returns {Promise<Object>} The updated feedback entry
 */
export async function submitFeedback(feedbackId, feedbackData) {
  try {
    const { rating, feedback } = feedbackData;
    const parsedUserId = parseInt(feedbackData.userId);

    const existingFeedback = await prisma.feedbacks.findFirst({
      where: {
        id: feedbackId,
        userId: parsedUserId,
      },
    });

    if (!existingFeedback) {
      throw new Error("Feedback not found or not accessible");
    }

    if (existingFeedback.status !== "pending") {
      throw new Error("Feedback has already been submitted or skipped");
    }

    const updatedFeedback = await prisma.feedbacks.update({
      where: { id: feedbackId },
      data: {
        rating: parseInt(rating) || null,
        feedback: feedback || null,
        status: 'submitted',
        feedbackAt: new Date()
      }
    });

    console.log(`Feedback ${feedbackId} submitted successfully`);
    return updatedFeedback;
  } catch (error) {
    console.error('Error submitting feedback:', error);
    throw error;
  }
}

/**
 * Skips feedback (marks as skipped)
 * @param {string} feedbackId - The ID of the feedback entry
 * @returns {Promise<Object>} The updated feedback entry
 */
export async function skipFeedback(feedbackId, userId) {
  try {
    const parsedUserId = parseInt(userId);
    const existingFeedback = await prisma.feedbacks.findFirst({
      where: {
        id: feedbackId,
        userId: parsedUserId,
      },
    });

    if (!existingFeedback) {
      throw new Error("Feedback not found or not accessible");
    }

    if (existingFeedback.status !== "pending") {
      throw new Error("Feedback has already been submitted or skipped");
    }

    const updatedFeedback = await prisma.feedbacks.update({
      where: { id: feedbackId },
      data: {
        status: 'skipped',
        feedbackAt: new Date()
      }
    });

    console.log(`Feedback ${feedbackId} skipped`);
    return updatedFeedback;
  } catch (error) {
    console.error('Error skipping feedback:', error);
    throw error;
  }
}

/**
 * Gets feedback statistics for a user
 * @param {number} userId - The ID of the user
 * @returns {Promise<Object>} Feedback statistics
 */
export async function getFeedbackStats(userId) {
  try {
    const stats = await prisma.feedbacks.groupBy({
      by: ['status'],
      where: {
        userId: parseInt(userId)
      },
      _count: {
        status: true
      }
    });

    return stats.reduce((acc, stat) => {
      acc[stat.status] = stat._count.status;
      return acc;
    }, {});
  } catch (error) {
    console.error('Error fetching feedback stats:', error);
    throw error;
  }
}

export async function replyToFeedback(feedbackId, userId, reply) {
  const parsedUserId = parseInt(userId);

  const feedback = await prisma.feedbacks.findUnique({
    where: { id: feedbackId },
    select: {
      id: true,
      businessId: true,
      status: true,
    },
  });

  if (!feedback || !feedback.businessId) {
    throw new Error("Feedback not found");
  }

  if (feedback.status !== "submitted") {
    throw new Error("Only submitted feedback can be replied to");
  }

  const ownedBusiness = await prisma.shops.findFirst({
    where: {
      id: feedback.businessId,
      createdById: parsedUserId,
    },
    select: { id: true },
  });

  if (!ownedBusiness) {
    throw new Error("Unauthorized to reply to this feedback");
  }

  return prisma.feedbacks.update({
    where: { id: feedbackId },
    data: {
      businessReply: reply?.trim() || null,
      repliedAt: reply?.trim() ? new Date() : null,
    },
  });
}
