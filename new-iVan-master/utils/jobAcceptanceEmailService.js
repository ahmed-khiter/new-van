import { sendEmail } from "@/lib/sendEmail";
import prisma from "@/lib/prisma";

/**
 * Send job acceptance email to service provider
 * @param {string} jobId - The job ID
 * @param {number} providerId - The provider who accepted the job
 * @returns {Promise<Object>} - Email sending result
 */
export const sendJobAcceptanceEmail = async (jobId, providerId) => {
  try {
    // Get job details with customer information
    const job = await prisma.jobs.findUnique({
      where: { id: jobId },
      include: {
        createdBy: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    if (!job) {
      throw new Error(`Job with ID ${jobId} not found`);
    }

    // Get provider details
    const provider = await prisma.users.findUnique({
      where: { id: providerId },
      select: {
        firstName: true,
        lastName: true,
        email: true
      }
    });

    if (!provider) {
      throw new Error(`Provider with ID ${providerId} not found`);
    }

    // Handle case where job creator might be null
    const customerName = job.createdBy 
      ? `${job.createdBy.firstName}${job.createdBy.lastName ? ` ${job.createdBy.lastName}` : ''}`
      : 'Customer';

    // Prepare email data
    const emailData = {
      type: "jobAcceptance",
      email: provider.email,
      subject: `Job Accepted: ${job.title}`,
      providerName: `${provider.firstName}${provider.lastName ? ` ${provider.lastName}` : ''}`,
      customerName: customerName,
      job: {
        id: job.id,
        title: job.title,
        category: job.category,
        price: job.price,
        notes: job.notes,
        pickupAddressLine1: job.pickupAddressLine1,
        pickupCity: job.pickupCity,
        dropOffAddressLine1: job.dropOffAddressLine1,
        dropOffCity: job.dropOffCity
      }
    };

    // Send the email
    const result = await sendEmail(emailData);
    
    console.log(`Job acceptance email sent successfully to ${provider.email} for job ${jobId}`);
    return {
      success: true,
      message: "Job acceptance email sent successfully",
      emailInfo: result
    };

  } catch (error) {
    console.error(`Failed to send job acceptance email for job ${jobId}:`, error);
    // Log more detailed error information for debugging
    if (error.message.includes('Cannot read properties of null')) {
      console.error(`Job ${jobId} has missing creator information. This might be a data integrity issue.`);
    }
    return {
      success: false,
      message: `Failed to send job acceptance email: ${error.message}`,
      error: error
    };
  }
};

/**
 * Handle job acceptance email sending (non-blocking)
 * This function is called from the accept job API
 * @param {string} jobId - The job ID
 * @param {number} providerId - The provider who accepted the job
 * @returns {Promise<void>}
 */
export const handleJobAcceptanceEmailSending = async (jobId, providerId) => {
  try {
    await sendJobAcceptanceEmail(jobId, providerId);
    console.log(`Job acceptance email handled successfully for job ${jobId}`);
  } catch (error) {
    console.error(`Failed to handle job acceptance email for job ${jobId}:`, error);
    // Don't throw error - email sending failure shouldn't fail job acceptance
  }
};
