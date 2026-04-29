import { sendEmail } from "@/lib/sendEmail";
import prisma from "@/lib/prisma";

/**
 * Send provider payment email to service provider
 * @param {string} jobId - The job ID
 * @param {number} providerId - The provider who completed the job
 * @param {number} paymentAmount - The amount paid
 * @param {string} paymentMethod - The payment method used
 * @returns {Promise<Object>} - Email sending result
 */
export const sendProviderPaymentEmail = async (jobId, providerId, paymentAmount, paymentMethod = "Bank Transfer") => {
  try {
    // Get job details
    const job = await prisma.jobs.findUnique({
      where: { id: jobId },
      select: {
        id: true,
        title: true,
        category: true,
        price: true,
        completedAt: true
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

    // Prepare email data
    const emailData = {
      type: "providerPayment",
      email: provider.email,
      subject: `Payment Processed: ${job.title}`,
      providerName: `${provider.firstName}${provider.lastName ? ` ${provider.lastName}` : ''}`,
      job: {
        id: job.id,
        title: job.title,
        category: job.category,
        price: job.price,
        completedAt: job.completedAt
      },
      paymentAmount: paymentAmount,
      paymentDate: new Date().toLocaleDateString(),
      paymentMethod: paymentMethod
    };

    // Send the email
    const result = await sendEmail(emailData);
    
    console.log(`Provider payment email sent successfully to ${provider.email} for job ${jobId}`);
    return {
      success: true,
      message: "Provider payment email sent successfully",
      emailInfo: result
    };

  } catch (error) {
    console.error(`Failed to send provider payment email for job ${jobId}:`, error);
    return {
      success: false,
      message: `Failed to send provider payment email: ${error.message}`,
      error: error
    };
  }
};

/**
 * Handle provider payment email sending (non-blocking)
 * This function is called when a job is marked as paid
 * @param {string} jobId - The job ID
 * @param {number} providerId - The provider who completed the job
 * @param {number} paymentAmount - The amount paid
 * @param {string} paymentMethod - The payment method used
 * @returns {Promise<void>}
 */
export const handleProviderPaymentEmailSending = async (jobId, providerId, paymentAmount, paymentMethod = "Bank Transfer") => {
  try {
    console.log(`Starting provider payment email process for job ${jobId}, provider ${providerId}, amount ${paymentAmount}`);
    
    // Check if required environment variables are set
    if (!process.env.MAILTRAP_HOST || !process.env.MAILTRAP_PORT || !process.env.MAILTRAP_USER || !process.env.MAILTRAP_PASS) {
      console.error("Missing email configuration environment variables");
      return;
    }
    
    if (!process.env.NEXT_PUBLIC_FROM_EMAIL) {
      console.error("Missing NEXT_PUBLIC_FROM_EMAIL environment variable");
      return;
    }
    
    await sendProviderPaymentEmail(jobId, providerId, paymentAmount, paymentMethod);
    console.log(`Provider payment email handled successfully for job ${jobId}`);
  } catch (error) {
    console.error(`Failed to handle provider payment email for job ${jobId}:`, error);
    // Don't throw error - email sending failure shouldn't fail payment processing
  }
};
