import { sendEmail } from "@/lib/sendEmail";
import prisma from "@/lib/prisma";

/**
 * Send job posted and paid email to customer
 * @param {string} jobId - The job ID
 * @param {number} customerId - The customer who created the job
 * @param {number} paymentAmount - The amount paid
 * @param {string} transactionId - The payment transaction ID
 * @returns {Promise<Object>} - Email sending result
 */
export const sendJobPostedAndPaidEmail = async (jobId, customerId, paymentAmount, transactionId) => {
  try {
    // Get job details
    const job = await prisma.jobs.findUnique({
      where: { id: jobId },
      select: {
        id: true,
        title: true,
        category: true,
        price: true,
        notes: true,
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

    // Prepare email data
    const emailData = {
      type: "jobPostedAndPaid",
      email: customer.email,
      subject: `Job Posted & Payment Confirmed: ${job.title}`,
      customerName: `${customer.firstName}${customer.lastName ? ` ${customer.lastName}` : ''}`,
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
      },
      paymentAmount: paymentAmount,
      transactionId: transactionId
    };

    // Send the email
    const result = await sendEmail(emailData);
    
    console.log(`Job posted and paid email sent successfully to ${customer.email} for job ${jobId}`);
    return {
      success: true,
      message: "Job posted and paid email sent successfully",
      emailInfo: result
    };

  } catch (error) {
    console.error(`Failed to send job posted and paid email for job ${jobId}:`, error);
    return {
      success: false,
      message: `Failed to send job posted and paid email: ${error.message}`,
      error: error
    };
  }
};

/**
 * Handle job posted and paid email sending (non-blocking)
 * This function is called from the Stripe webhook
 * @param {string} jobId - The job ID
 * @param {number} customerId - The customer who created the job
 * @param {number} paymentAmount - The amount paid
 * @param {string} transactionId - The payment transaction ID
 * @returns {Promise<void>}
 */
export const handleJobPostedAndPaidEmailSending = async (jobId, customerId, paymentAmount, transactionId) => {
  try {
    await sendJobPostedAndPaidEmail(jobId, customerId, paymentAmount, transactionId);
    console.log(`Job posted and paid email handled successfully for job ${jobId}`);
  } catch (error) {
    console.error(`Failed to handle job posted and paid email for job ${jobId}:`, error);
    // Don't throw error - email sending failure shouldn't fail payment processing
  }
};
