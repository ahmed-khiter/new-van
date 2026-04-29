import { sendEmail } from "@/lib/sendEmail";
import prisma from "@/lib/prisma";

/**
 * Calculate penalty fee for job cancellation
 * @param {number} jobPrice - The original job price
 * @param {string} category - The job category
 * @returns {number} - The penalty fee amount
 */
const calculatePenaltyFee = (jobPrice, category) => {
  // Base penalty fee calculation
  // 10% of job price or minimum £5, maximum £50
  const basePenalty = Math.max(5, Math.min(50, jobPrice * 0.1));
  
  // Category-specific adjustments
  switch (category) {
    case 'Van':
    case 'Recovery':
      // Higher penalty for urgent services
      return Math.min(75, basePenalty * 1.2);
    case 'Cleaning':
    case 'Removals':
      // Standard penalty
      return basePenalty;
    case 'Locksmith':
    case 'Car Key Replacement':
      // Higher penalty for emergency services
      return Math.min(100, basePenalty * 1.5);
    default:
      return basePenalty;
  }
};

/**
 * Send job cancellation email to customer
 * @param {string} jobId - The job ID
 * @param {number} customerId - The customer who created the job
 * @param {number} providerId - The provider who canceled the job
 * @param {string} cancellationReason - Optional reason for cancellation
 * @param {string} replacementJobId - The ID of the replacement job
 * @returns {Promise<Object>} - Email sending result
 */
export const sendJobCancellationEmail = async (jobId, customerId, providerId, cancellationReason = null, replacementJobId = null) => {
  try {
    // Get job details
    const job = await prisma.jobs.findUnique({
      where: { id: jobId },
      select: {
        id: true,
        title: true,
        category: true,
        price: true,
        pickupAddressLine1: true,
        pickupCity: true,
        dropOffAddressLine1: true,
        dropOffCity: true
      }
    });

    if (!job) {
      throw new Error(`Job with ID ${jobId} not found`);
    }

    // Get customer details
    const customer = await prisma.users.findUnique({
      where: { id: customerId },
      select: {
        firstName: true,
        lastName: true,
        email: true
      }
    });

    if (!customer) {
      throw new Error(`Customer with ID ${customerId} not found`);
    }

    // Get provider details
    const provider = await prisma.users.findUnique({
      where: { id: providerId },
      select: {
        firstName: true,
        lastName: true
      }
    });

    if (!provider) {
      throw new Error(`Provider with ID ${providerId} not found`);
    }

    // Calculate penalty fee
    const penaltyFee = calculatePenaltyFee(job.price || 0, job.category);

    // Prepare email data
    const emailData = {
      type: "jobCancellation",
      email: customer.email,
      subject: `Job Cancelled: ${job.title}`,
      customerName: `${customer.firstName}${customer.lastName ? ` ${customer.lastName}` : ''}`,
      providerName: `${provider.firstName}${provider.lastName ? ` ${provider.lastName}` : ''}`,
      job: {
        id: job.id,
        title: job.title,
        category: job.category,
        price: job.price,
        pickupAddressLine1: job.pickupAddressLine1,
        pickupCity: job.pickupCity,
        dropOffAddressLine1: job.dropOffAddressLine1,
        dropOffCity: job.dropOffCity
      },
      penaltyFee: penaltyFee,
      cancellationReason: cancellationReason,
      replacementJobId: replacementJobId
    };

    // Send the email
    const result = await sendEmail(emailData);
    
    console.log(`Job cancellation email sent successfully to ${customer.email} for job ${jobId}`);
    return {
      success: true,
      message: "Job cancellation email sent successfully",
      emailInfo: result,
      penaltyFee: penaltyFee
    };

  } catch (error) {
    console.error(`Failed to send job cancellation email for job ${jobId}:`, error);
    return {
      success: false,
      message: `Failed to send job cancellation email: ${error.message}`,
      error: error
    };
  }
};

/**
 * Handle job cancellation email sending (non-blocking)
 * This function is called when a job is canceled by a provider
 * @param {string} jobId - The job ID
 * @param {number} customerId - The customer who created the job
 * @param {number} providerId - The provider who canceled the job
 * @param {string} cancellationReason - Optional reason for cancellation
 * @param {string} replacementJobId - The ID of the replacement job
 * @returns {Promise<void>}
 */
export const handleJobCancellationEmailSending = async (jobId, customerId, providerId, cancellationReason = null, replacementJobId = null) => {
  try {
    console.log(`Starting job cancellation email process for job ${jobId}, customer ${customerId}, provider ${providerId}`);
    
    // Check if required environment variables are set
    if (!process.env.MAILTRAP_HOST || !process.env.MAILTRAP_PORT || !process.env.MAILTRAP_USER || !process.env.MAILTRAP_PASS) {
      console.error("Missing email configuration environment variables");
      return;
    }
    
    if (!process.env.NEXT_PUBLIC_FROM_EMAIL) {
      console.error("Missing NEXT_PUBLIC_FROM_EMAIL environment variable");
      return;
    }
    
    await sendJobCancellationEmail(jobId, customerId, providerId, cancellationReason, replacementJobId);
    console.log(`Job cancellation email handled successfully for job ${jobId}`);
  } catch (error) {
    console.error(`Failed to handle job cancellation email for job ${jobId}:`, error);
    // Don't throw error - email sending failure shouldn't fail job cancellation
  }
};
