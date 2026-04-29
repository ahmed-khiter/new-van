import { getSocket } from '@/lib/socket';
import { calculateDistance } from './helper';
import { findNearbyDeliveryProviders } from './deliveryService';

/**
 * Send real-time delivery job notification to a specific provider via Socket.IO
 * @param {number} providerId - The provider ID to notify
 * @param {Object} jobData - Job data to send
 * @returns {Promise<boolean>} - Success status
 */
export const notifyProviderAboutDeliveryJob = async (providerId, jobData) => {
  try {
    let io;
    try {
      io = getSocket();
    } catch (error) {
      console.warn('Socket.io not initialized, skipping real-time notification:', error.message);
      return false;
    }
    
    // Emit to the provider's room
    io.to(`provider-${providerId}`).emit('delivery-job-available', {
      jobId: jobData.id,
      title: jobData.title,
      category: jobData.category,
      price: jobData.price,
      pickupAddress: jobData.pickupAddressLine1,
      pickupCity: jobData.pickupCity,
      dropOffAddress: jobData.dropOffAddressLine1,
      dropOffCity: jobData.dropOffCity,
      pickupLat: jobData.pickupLat,
      pickupLng: jobData.pickupLng,
      dropOffLat: jobData.dropOffLat,
      dropOffLng: jobData.dropOffLng,
      distance: jobData.distance, // Distance from provider to pickup location
      orderId: jobData.deliveryOrderId,
      createdAt: jobData.createdAt,
      timestamp: new Date().toISOString()
    });

    console.log(`Real-time notification sent to provider ${providerId} for job ${jobData.id}`);
    return true;
  } catch (error) {
    console.error(`Failed to send real-time notification to provider ${providerId}:`, error);
    return false;
  }
};

/**
 * Send delivery notifications with priority waves
 * Wave 1: Providers within 5 miles (immediate)
 * Wave 2: Providers within 15 miles (if no acceptances in 2 minutes)
 * Wave 3: Providers within 50 miles (if still no acceptances)
 * @param {Object} job - Job object with delivery details
 * @param {number} waveNumber - Which wave to send (1, 2, or 3)
 * @returns {Promise<Object>} Notification result with provider counts
 */
export const sendDeliveryNotificationsWave = async (job, waveNumber = 1) => {
  try {
    const pickupLocation = { lat: job.pickupLat, lng: job.pickupLng };
    
    if (!pickupLocation.lat || !pickupLocation.lng) {
      return {
        success: false,
        message: 'Job pickup location not available',
        notifiedCount: 0
      };
    }

    // Define wave radii
    const waveRadii = {
      1: 5,   // First wave: 5 miles
      2: 15,  // Second wave: 15 miles
      3: 50   // Third wave: 50 miles
    };

    const radius = waveRadii[waveNumber] || 50;

    // Find providers within this wave's radius
    const providers = await findNearbyDeliveryProviders(pickupLocation, radius);

    if (!providers || providers.length === 0) {
      return {
        success: true,
        notifiedCount: 0,
        waveNumber: waveNumber,
        message: `No providers found within ${radius} miles`
      };
    }

    // Send notifications to all providers in this wave
    const notificationResults = {
      notified: [],
      errors: []
    };

    for (const provider of providers) {
      try {
        const jobData = {
          id: job.id,
          title: job.title,
          category: job.category || "Van",
          price: job.price,
          pickupAddressLine1: job.pickupAddressLine1,
          pickupCity: job.pickupCity,
          dropOffAddressLine1: job.dropOffAddressLine1,
          dropOffCity: job.dropOffCity,
          pickupLat: job.pickupLat,
          pickupLng: job.pickupLng,
          dropOffLat: job.dropOffLat,
          dropOffLng: job.dropOffLng,
          distance: provider.distance,
          deliveryOrderId: job.deliveryOrderId,
          createdAt: job.createdAt,
          wave: waveNumber
        };

        const success = await notifyProviderAboutDeliveryJob(provider.id, jobData);
        
        if (success) {
          notificationResults.notified.push({
            providerId: provider.id,
            distance: provider.distance
          });
        }
      } catch (error) {
        notificationResults.errors.push({
          providerId: provider.id,
          error: error.message
        });
      }
    }

    return {
      success: true,
      notifiedCount: notificationResults.notified.length,
      waveNumber: waveNumber,
      radius: radius,
      results: notificationResults
    };
  } catch (error) {
    console.error(`Error sending delivery notifications wave ${waveNumber}:`, error);
    return {
      success: false,
      notifiedCount: 0,
      waveNumber: waveNumber,
      error: error.message
    };
  }
};

/**
 * Send delivery job notifications to multiple nearby providers
 * @param {Array} providers - Array of provider objects with id, latitude, longitude
 * @param {Object} job - Job object with location data
 * @returns {Promise<Object>} - Result with notified count and errors
 */
export const notifyNearbyProvidersAboutDeliveryJob = async (providers, job) => {
  try {
    let io;
    try {
      io = getSocket();
    } catch (error) {
      console.warn('Socket.io not initialized, skipping real-time notifications:', error.message);
      return {
        success: true,
        notifiedCount: 0,
        totalProviders: providers.length,
        results: [],
        errors: ['Socket.io not initialized']
      };
    }
    const results = [];
    
    // Calculate distance for each provider and send notification
    for (const provider of providers) {
      try {
        let distance = null;
        
        // Calculate distance if both provider and job have location data
        if (provider.latitude && provider.longitude && job.pickupLat && job.pickupLng) {
          distance = calculateDistance(
            job.pickupLat,
            job.pickupLng,
            parseFloat(provider.latitude),
            parseFloat(provider.longitude)
          );
        }

        // Prepare job data with distance
        const jobData = {
          id: job.id,
          title: job.title,
          category: job.category,
          price: job.price,
          pickupAddressLine1: job.pickupAddressLine1,
          pickupCity: job.pickupCity,
          dropOffAddressLine1: job.dropOffAddressLine1,
          dropOffCity: job.dropOffCity,
          pickupLat: job.pickupLat,
          pickupLng: job.pickupLng,
          dropOffLat: job.dropOffLat,
          dropOffLng: job.dropOffLng,
          distance: distance,
          deliveryOrderId: job.deliveryOrderId,
          createdAt: job.createdAt
        };

        const success = await notifyProviderAboutDeliveryJob(provider.id, jobData);
        
        results.push({
          providerId: provider.id,
          success: success,
          distance: distance
        });
      } catch (error) {
        console.error(`Error notifying provider ${provider.id}:`, error);
        results.push({
          providerId: provider.id,
          success: false,
          error: error.message
        });
      }
    }

    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    return {
      success: true,
      notifiedCount: successful.length,
      totalProviders: providers.length,
      results: results,
      errors: failed.map(r => ({
        providerId: r.providerId,
        error: r.error || 'Unknown error'
      }))
    };
  } catch (error) {
    console.error('Error in notifyNearbyProvidersAboutDeliveryJob:', error);
    return {
      success: false,
      notifiedCount: 0,
      errors: [error.message]
    };
  }
};

/**
 * Notify all nearby providers that a job has been accepted (remove from their queues)
 * @param {string} jobId - The job ID that was accepted
 * @param {number} acceptedProviderId - The provider who accepted the job
 * @param {Array} providerIds - Array of provider IDs who were notified about this job
 * @returns {Promise<Object>} - Result with notification status
 */
export const notifyJobAccepted = async (jobId, acceptedProviderId, providerIds = []) => {
  try {
    let io;
    try {
      io = getSocket();
    } catch (error) {
      console.warn('Socket.io not initialized, skipping job acceptance notification:', error.message);
      return { success: false, notifiedCount: 0, error: 'Socket.io not initialized' };
    }
    let notifiedCount = 0;

    // Notify all providers who were potentially interested in this job
    // This removes the job from their available jobs list
    for (const providerId of providerIds) {
      if (providerId !== acceptedProviderId) {
        try {
          io.to(`provider-${providerId}`).emit('job-accepted', {
            jobId: jobId,
            acceptedBy: acceptedProviderId,
            timestamp: new Date().toISOString()
          });
          notifiedCount++;
        } catch (error) {
          console.error(`Failed to notify provider ${providerId} about job acceptance:`, error);
        }
      }
    }

    console.log(`Notified ${notifiedCount} providers that job ${jobId} was accepted by provider ${acceptedProviderId}`);
    
    return {
      success: true,
      notifiedCount: notifiedCount
    };
  } catch (error) {
    console.error('Error in notifyJobAccepted:', error);
    return {
      success: false,
      notifiedCount: 0,
      error: error.message
    };
  }
};

/**
 * Broadcast job acceptance to all providers in a radius (fallback method)
 * This is useful when we don't have a list of specific provider IDs
 * @param {string} jobId - The job ID that was accepted
 * @param {number} acceptedProviderId - The provider who accepted the job
 * @returns {Promise<Object>} - Result with notification status
 */
export const broadcastJobAccepted = async (jobId, acceptedProviderId) => {
  try {
    let io;
    try {
      io = getSocket();
    } catch (error) {
      console.warn('Socket.io not initialized, skipping job acceptance broadcast:', error.message);
      return { success: false, error: 'Socket.io not initialized' };
    }
    
    // Broadcast to all connected sockets (will be filtered on client side)
    io.emit('job-accepted', {
      jobId: jobId,
      acceptedBy: acceptedProviderId,
      timestamp: new Date().toISOString()
    });

    console.log(`Broadcasted job acceptance: job ${jobId} accepted by provider ${acceptedProviderId}`);
    
    return {
      success: true,
      broadcasted: true
    };
  } catch (error) {
    console.error('Error broadcasting job acceptance:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Track job decline for analytics
 * @param {string} jobId - The job ID that was declined
 * @param {number} providerId - The provider who declined the job
 * @param {string} reason - Optional reason for declining
 * @returns {Promise<boolean>} - Success status
 */
export const trackJobDecline = async (jobId, providerId, reason = null) => {
  try {
    // This can be logged to database for analytics
    // For now, just log it
    console.log(`Job decline tracked: Provider ${providerId} declined job ${jobId}${reason ? ` - Reason: ${reason}` : ''}`);
    
    // Future: Store in database for analytics
    // await prisma.job_declines.create({
    //   data: {
    //     jobId,
    //     providerId,
    //     reason
    //   }
    // });
    
    return true;
  } catch (error) {
    console.error('Error tracking job decline:', error);
    return false;
  }
};

/**
 * Send real-time order status update to specific users
 * @param {string} orderId - The order ID
 * @param {string} status - The new delivery status
 * @param {Array} userIds - Array of user IDs to notify (customer, shop owner, provider)
 * @returns {Promise<boolean>} - Success status
 */
export const notifyOrderStatusUpdate = async (orderId, status, userIds = []) => {
  try {
    let io;
    try {
      io = getSocket();
    } catch (error) {
      console.warn('Socket.io not initialized, skipping status update notification:', error.message);
      return false;
    }

    // Notify each user in their room
    userIds.forEach(userId => {
      if (userId) {
        io.to(`user-${userId}`).emit('order-status-updated', {
          orderId: orderId,
          status: status,
          timestamp: new Date().toISOString()
        });
      }
    });

    console.log(`Order status update notified to ${userIds.length} users for order ${orderId}`);
    return true;
  } catch (error) {
    console.error('Error sending order status update notification:', error);
    return false;
  }
};

/**
 * Notify that delivery has started
 * @param {string} orderId - The order ID
 * @param {number} providerId - The provider ID
 * @param {Array} userIds - Array of user IDs to notify
 * @returns {Promise<boolean>} - Success status
 */
export const notifyDeliveryStarted = async (orderId, providerId, userIds = []) => {
  try {
    let io;
    try {
      io = getSocket();
    } catch (error) {
      console.warn('Socket.io not initialized, skipping delivery started notification:', error.message);
      return false;
    }

    userIds.forEach(userId => {
      if (userId) {
        io.to(`user-${userId}`).emit('delivery-started', {
          orderId: orderId,
          providerId: providerId,
          timestamp: new Date().toISOString()
        });
      }
    });

    console.log(`Delivery started notification sent for order ${orderId}`);
    return true;
  } catch (error) {
    console.error('Error sending delivery started notification:', error);
    return false;
  }
};

/**
 * Notify that delivery has been completed
 * @param {string} orderId - The order ID
 * @param {number} providerId - The provider ID
 * @param {Array} userIds - Array of user IDs to notify
 * @returns {Promise<boolean>} - Success status
 */
export const notifyDeliveryCompleted = async (orderId, providerId, userIds = []) => {
  try {
    let io;
    try {
      io = getSocket();
    } catch (error) {
      console.warn('Socket.io not initialized, skipping delivery completed notification:', error.message);
      return false;
    }

    userIds.forEach(userId => {
      if (userId) {
        io.to(`user-${userId}`).emit('delivery-completed', {
          orderId: orderId,
          providerId: providerId,
          timestamp: new Date().toISOString()
        });
      }
    });

    console.log(`Delivery completed notification sent for order ${orderId}`);
    return true;
  } catch (error) {
    console.error('Error sending delivery completed notification:', error);
    return false;
  }
};

