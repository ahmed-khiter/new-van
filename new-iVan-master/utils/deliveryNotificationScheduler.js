import prisma from "@/lib/prisma";
import { sendDeliveryNotificationsWave } from "./deliveryNotificationService";

// Store active notification schedules
const notificationSchedules = new Map();

/**
 * Schedule notification waves for a delivery job
 * @param {string} jobId - The job ID
 * @param {Object} job - Job object with details
 */
export const scheduleNotificationWaves = async (jobId, job) => {
  try {
    // Clear any existing schedule for this job
    if (notificationSchedules.has(jobId)) {
      const existingSchedule = notificationSchedules.get(jobId);
      existingSchedule.timeouts.forEach(timeout => clearTimeout(timeout));
      notificationSchedules.delete(jobId);
    }

    // Check if job is already accepted
    const jobCheck = await prisma.jobs.findUnique({
      where: { id: jobId },
      select: { acceptedById: true, status: true }
    });

    if (jobCheck?.acceptedById || jobCheck?.status !== 'active') {
      console.log(`Job ${jobId} already accepted or not active, skipping wave scheduling`);
      return;
    }

    // Wave 1: Immediate notification to providers within 5 miles
    const wave1Result = await sendDeliveryNotificationsWave(job, 1);
    console.log(`Wave 1 notifications sent for job ${jobId}:`, wave1Result);

    // Schedule Wave 2: If no acceptances in 2 minutes, notify providers within 15 miles
    const wave2Timeout = setTimeout(async () => {
      // Check again if job is still available
      const jobStatus = await prisma.jobs.findUnique({
        where: { id: jobId },
        select: { acceptedById: true, status: true }
      });

      if (!jobStatus?.acceptedById && jobStatus?.status === 'active') {
        const wave2Result = await sendDeliveryNotificationsWave(job, 2);
        console.log(`Wave 2 notifications sent for job ${jobId}:`, wave2Result);

        // Schedule Wave 3: If still no acceptances in additional 3 minutes, notify providers within 50 miles
        const wave3Timeout = setTimeout(async () => {
          // Check again if job is still available
          const jobStatus3 = await prisma.jobs.findUnique({
            where: { id: jobId },
            select: { acceptedById: true, status: true }
          });

          if (!jobStatus3?.acceptedById && jobStatus3?.status === 'active') {
            const wave3Result = await sendDeliveryNotificationsWave(job, 3);
            console.log(`Wave 3 notifications sent for job ${jobId}:`, wave3Result);
          } else {
            console.log(`Job ${jobId} accepted before wave 3, cancelling`);
          }

          // Clean up schedule
          if (notificationSchedules.has(jobId)) {
            notificationSchedules.delete(jobId);
          }
        }, 3 * 60 * 1000); // 3 minutes

        // Store wave 3 timeout
        if (notificationSchedules.has(jobId)) {
          const schedule = notificationSchedules.get(jobId);
          schedule.timeouts.push(wave3Timeout);
        }
      } else {
        console.log(`Job ${jobId} accepted before wave 2, cancelling`);
        // Clean up schedule
        if (notificationSchedules.has(jobId)) {
          notificationSchedules.delete(jobId);
        }
      }
    }, 2 * 60 * 1000); // 2 minutes

    // Store timeouts for cleanup
    notificationSchedules.set(jobId, {
      jobId: jobId,
      timeouts: [wave2Timeout],
      createdAt: new Date()
    });

    console.log(`Notification waves scheduled for job ${jobId}`);
  } catch (error) {
    console.error(`Error scheduling notification waves for job ${jobId}:`, error);
  }
};

/**
 * Cancel scheduled notification waves for a job
 * @param {string} jobId - The job ID
 */
export const cancelNotificationWaves = (jobId) => {
  if (notificationSchedules.has(jobId)) {
    const schedule = notificationSchedules.get(jobId);
    schedule.timeouts.forEach(timeout => clearTimeout(timeout));
    notificationSchedules.delete(jobId);
    console.log(`Cancelled notification waves for job ${jobId}`);
  }
};

/**
 * Get active notification schedules (for monitoring)
 * @returns {Array} Array of active schedules
 */
export const getActiveSchedules = () => {
  return Array.from(notificationSchedules.values());
};

