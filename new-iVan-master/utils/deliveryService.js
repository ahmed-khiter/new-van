import prisma from "@/lib/prisma";
import { calculateDistance, getBoundingBox } from './helper';
import { fetchProvidersWithLocation } from './jobService';

/**
 * Find nearby delivery providers for a specific order location
 * @param {Object} pickupLocation - Pickup location with lat/lng
 * @param {number} radiusMiles - Radius in miles (default: 50)
 * @returns {Promise<Array>} Array of providers sorted by distance (nearest first)
 */
export const findNearbyDeliveryProviders = async (pickupLocation, radiusMiles = 50) => {
  try {
    if (!pickupLocation || !pickupLocation.lat || !pickupLocation.lng) {
      console.warn('Pickup location not provided for finding nearby providers');
      return [];
    }

    // Fetch providers with "Van" category (delivery service)
    // Map restaurant and shop categories to Van for provider matching since providers
    // are approved for "Van" service, not "restaurant" or "shop"
    const providers = await fetchProvidersWithLocation("Van", pickupLocation, radiusMiles);

    if (!providers || providers.length === 0) {
      console.log('No delivery providers found within radius');
      return [];
    }

    // Calculate distance for each provider and sort by distance
    const providersWithDistance = providers
      .map(provider => {
        let distance = null;
        
        if (provider.latitude && provider.longitude) {
          distance = calculateDistance(
            pickupLocation.lat,
            pickupLocation.lng,
            parseFloat(provider.latitude),
            parseFloat(provider.longitude)
          );
        }
        
        return {
          ...provider,
          distance: distance
        };
      })
      .filter(provider => {
        // Filter out providers without distance (invalid location)
        return provider.distance !== null;
      })
      .sort((a, b) => {
        // Sort by distance (nearest first)
        return a.distance - b.distance;
      });

    console.log(`Found ${providersWithDistance.length} nearby delivery providers, sorted by distance`);
    return providersWithDistance;
  } catch (error) {
    console.error('Error finding nearby delivery providers:', error);
    throw error;
  }
};

/**
 * Calculate estimated delivery time based on distance
 * @param {number} distanceMiles - Distance in miles
 * @param {number} averageSpeedMph - Average speed in mph (default: 30)
 * @returns {Object} Estimated time in minutes and hours
 */
export const calculateDeliveryEta = (distanceMiles, averageSpeedMph = 30) => {
  if (!distanceMiles || distanceMiles <= 0) {
    return {
      minutes: 0,
      hours: 0,
      formatted: 'N/A'
    };
  }

  const hours = distanceMiles / averageSpeedMph;
  const minutes = Math.round(hours * 60);

  let formatted = '';
  if (hours < 1) {
    formatted = `${minutes} minutes`;
  } else if (hours < 24) {
    const wholeHours = Math.floor(hours);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes > 0) {
      formatted = `${wholeHours}h ${remainingMinutes}m`;
    } else {
      formatted = `${wholeHours} hour${wholeHours > 1 ? 's' : ''}`;
    }
  } else {
    const days = Math.floor(hours / 24);
    formatted = `${days} day${days > 1 ? 's' : ''}`;
  }

  return {
    minutes: minutes,
    hours: hours,
    formatted: formatted
  };
};

/**
 * Get delivery providers sorted by priority (distance + availability)
 * @param {Object} pickupLocation - Pickup location with lat/lng
 * @param {number} maxRadiusMiles - Maximum radius in miles
 * @param {number} preferredRadiusMiles - Preferred radius for priority (default: 10)
 * @returns {Promise<Object>} Providers grouped by priority
 */
export const getDeliveryProvidersByPriority = async (
  pickupLocation, 
  maxRadiusMiles = 50, 
  preferredRadiusMiles = 10
) => {
  try {
    const allProviders = await findNearbyDeliveryProviders(pickupLocation, maxRadiusMiles);

    const priorityProviders = [];
    const standardProviders = [];

    allProviders.forEach(provider => {
      if (provider.distance <= preferredRadiusMiles) {
        priorityProviders.push(provider);
      } else {
        standardProviders.push(provider);
      }
    });

    return {
      priority: priorityProviders, // Within preferred radius
      standard: standardProviders, // Beyond preferred radius but within max radius
      all: allProviders,
      totalCount: allProviders.length,
      priorityCount: priorityProviders.length
    };
  } catch (error) {
    console.error('Error getting delivery providers by priority:', error);
    throw error;
  }
};

/**
 * Calculate total delivery distance (pickup to dropoff)
 * @param {number} pickupLat - Pickup latitude
 * @param {number} pickupLng - Pickup longitude
 * @param {number} dropOffLat - Dropoff latitude
 * @param {number} dropOffLng - Dropoff longitude
 * @returns {number} Distance in miles
 */
export const calculateTotalDeliveryDistance = (pickupLat, pickupLng, dropOffLat, dropOffLng) => {
  if (!pickupLat || !pickupLng || !dropOffLat || !dropOffLng) {
    return null;
  }

  return calculateDistance(pickupLat, pickupLng, dropOffLat, dropOffLng);
};

/**
 * Get delivery order details with provider distance information
 * @param {string} orderId - Order ID
 * @param {number} providerId - Provider ID (optional, for distance calculation)
 * @returns {Promise<Object>} Order details with distance information
 */
export const getDeliveryOrderWithDistance = async (orderId, providerId = null) => {
  try {
    const order = await prisma.product_orders.findUnique({
      where: { id: orderId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        job: {
          select: {
            id: true,
            pickupLat: true,
            pickupLng: true,
            dropOffLat: true,
            dropOffLng: true,
            status: true
          }
        }
      }
    });

    if (!order) {
      return null;
    }

    const result = {
      ...order,
      distances: {}
    };

    // Calculate total delivery distance (pickup to dropoff)
    if (order.job && order.job.pickupLat && order.job.pickupLng && 
        order.job.dropOffLat && order.job.dropOffLng) {
      result.distances.totalDelivery = calculateTotalDeliveryDistance(
        order.job.pickupLat,
        order.job.pickupLng,
        order.job.dropOffLat,
        order.job.dropOffLng
      );
    }

    // Calculate distance from provider to pickup if provider ID is provided
    if (providerId && order.job && order.job.pickupLat && order.job.pickupLng) {
      const provider = await prisma.users.findUnique({
        where: { id: providerId },
        select: {
          latitude: true,
          longitude: true
        }
      });

      if (provider && provider.latitude && provider.longitude) {
        result.distances.providerToPickup = calculateDistance(
          order.job.pickupLat,
          order.job.pickupLng,
          parseFloat(provider.latitude),
          parseFloat(provider.longitude)
        );
      }
    }

    return result;
  } catch (error) {
    console.error('Error getting delivery order with distance:', error);
    throw error;
  }
};

/**
 * Send delivery notifications with priority (nearest providers first)
 * @param {Object} job - Job object with delivery details
 * @param {number} maxRadiusMiles - Maximum radius for notifications
 * @param {number} priorityRadiusMiles - Priority radius (notify these first)
 * @returns {Promise<Object>} Notification result with provider counts by priority
 */
export const sendDeliveryNotifications = async (
  job, 
  maxRadiusMiles = 50, 
  priorityRadiusMiles = 10
) => {
  try {
    const pickupLocation = { lat: job.pickupLat, lng: job.pickupLng };
    
    if (!pickupLocation.lat || !pickupLocation.lng) {
      return {
        success: false,
        message: 'Job pickup location not available',
        notifiedCount: 0
      };
    }

    const providersByPriority = await getDeliveryProvidersByPriority(
      pickupLocation,
      maxRadiusMiles,
      priorityRadiusMiles
    );

    // Send notifications to priority providers first, then standard providers
    const notificationResults = {
      priority: [],
      standard: [],
      errors: []
    };

    // Notify priority providers first
    for (const provider of providersByPriority.priority) {
      try {
        // This would integrate with your notification system
        // For now, just track the notification
        notificationResults.priority.push({
          providerId: provider.id,
          distance: provider.distance
        });
      } catch (error) {
        notificationResults.errors.push({
          providerId: provider.id,
          error: error.message
        });
      }
    }

    // Then notify standard providers
    for (const provider of providersByPriority.standard) {
      try {
        notificationResults.standard.push({
          providerId: provider.id,
          distance: provider.distance
        });
      } catch (error) {
        notificationResults.errors.push({
          providerId: provider.id,
          error: error.message
        });
      }
    }

    return {
      success: true,
      notifiedCount: notificationResults.priority.length + notificationResults.standard.length,
      priorityCount: notificationResults.priority.length,
      standardCount: notificationResults.standard.length,
      results: notificationResults,
      errors: notificationResults.errors
    };
  } catch (error) {
    console.error('Error sending delivery notifications:', error);
    return {
      success: false,
      notifiedCount: 0,
      error: error.message
    };
  }
};

/**
 * Get delivery statistics for a provider
 * @param {number} providerId - Provider ID
 * @returns {Promise<Object>} Delivery statistics
 */
export const getProviderDeliveryStats = async (providerId) => {
  try {
    const [totalDeliveries, completedDeliveries, inProgressDeliveries, cancelledDeliveries] = await Promise.all([
      // Total deliveries assigned to this provider
      prisma.product_orders.count({
        where: {
          deliveryProviderId: providerId
        }
      }),
      // Completed deliveries
      prisma.product_orders.count({
        where: {
          deliveryProviderId: providerId,
          deliveryStatus: 'delivered'
        }
      }),
      // In progress deliveries
      prisma.product_orders.count({
        where: {
          deliveryProviderId: providerId,
          deliveryStatus: {
            in: ['assigned', 'in-transit']
          }
        }
      }),
      // Cancelled deliveries
      prisma.product_orders.count({
        where: {
          deliveryProviderId: providerId,
          deliveryStatus: 'cancelled'
        }
      })
    ]);

    return {
      total: totalDeliveries,
      completed: completedDeliveries,
      inProgress: inProgressDeliveries,
      cancelled: cancelledDeliveries,
      completionRate: totalDeliveries > 0 
        ? ((completedDeliveries / totalDeliveries) * 100).toFixed(2) 
        : 0
    };
  } catch (error) {
    console.error('Error getting provider delivery stats:', error);
    throw error;
  }
};

