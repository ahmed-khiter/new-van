import { PrismaClient } from '@prisma/client';
import { sendEmail } from '../lib/sendEmail';
import { calculateDistance, getBoundingBox, getUserFullName } from './helper';

const prisma = new PrismaClient();


/**
 * Fetches active providers with location data, optionally filtered by job location and category
 * @param {string} jobCategory - Job category to filter by approved services
 * @param {Object} jobLocation - Job location with lat/lng for bounding box filtering
 * @param {number} radiusMiles - Radius in miles for bounding box (default: 50miles)
 * @param {string} vehicleType - Optional vehicle type to filter providers (e.g., "bike", "car", "small_van")
 * @returns {Promise<Array>} Array of providers with location data
 */
export const fetchProvidersWithLocation = async (jobCategory = null, jobLocation = null, radiusMiles = 50, vehicleType = null) => {
  try {
    let vehicleTypeId = null;
    if (vehicleType) {
      vehicleTypeId = await getVehicleTypeId(vehicleType);
      if (!vehicleTypeId) {
        console.warn(`Vehicle type "${vehicleType}" not found. No providers will be returned.`);
        return [];
      }
    }

    // Build base where clause
    const whereClause = {
      role: 'provider',
      status: 'active',
      latitude: { not: null },
      longitude: { not: null },
      isActive: true,
      isFirstTime: false,
      settings: {
        not: null
      },
      ...(vehicleTypeId ? {
        providerVehicles: {
          some: {
            vehicleTypeId: vehicleTypeId
          }
        }
      } : {})
    };

    // Add bounding box filter if job location is provided
    if (jobLocation && jobLocation.lat && jobLocation.lng) {
      const boundingBox = getBoundingBox(
        parseFloat(jobLocation.lat), 
        parseFloat(jobLocation.lng), 
        radiusMiles
      );
      
      whereClause.latitude = {
        gte: boundingBox.minLat,
        lte: boundingBox.maxLat
      };
      
      whereClause.longitude = {
        gte: boundingBox.minLng,
        lte: boundingBox.maxLng
      };
      
      console.log(`Applying bounding box filter: lat ${boundingBox.minLat} to ${boundingBox.maxLat}, lng ${boundingBox.minLng} to ${boundingBox.maxLng}`);
    }

    const providers = await prisma.users.findMany({
      where: whereClause,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        latitude: true,
        longitude: true,
        settings: true
      }
    });

    // If jobCategory is provided, filter by approved services
    let matchingProviders = providers;

    if (jobCategory) {
      matchingProviders = [];
      
      for (const provider of providers) {
        try {
          const settings = provider.settings || {};
          const services = settings.services || [];
          
          // Check if provider has the matching service approved
          const hasMatchingService = services.some(
            service => service.name === jobCategory && service.status === "Approved"
          );
          
          if (hasMatchingService) {
            matchingProviders.push(provider);
          }
        } catch (err) {
          console.error(`Failed to parse settings for provider ${provider.id}:`, err);
        }
      }
      
      console.log(`Found ${matchingProviders.length} providers with approved ${jobCategory} service within ${radiusMiles}miles bounding box`);
    }

    console.log(`Found ${matchingProviders.length} active providers with location data within ${radiusMiles}miles bounding box${vehicleType ? ` for vehicle type ${vehicleType}` : ''}`);
    return matchingProviders;
  } catch (error) {
    console.error('Error fetching providers with location:', error);
    throw error;
  }
};

/**
 * Filters providers within a specified radius (in miles) of a job location
 * @param {Array} providers - Array of providers with location data
 * @param {number} jobLat - Job latitude
 * @param {number} jobLng - Job longitude
 * @param {number} radiusMiles - Radius in miles (default: 50)
 * @returns {Array} Array of providers within the specified radius
 */
export const filterProvidersByRadius = (providers, jobLat, jobLng, radiusMiles = 50) => {
  if (!providers || !Array.isArray(providers)) {
    console.warn('No providers provided for radius filtering');
    return [];
  }

  if (!jobLat || !jobLng) {
    console.warn('Job location coordinates not provided');
    return [];
  }

  const providersInRadius = providers.filter(provider => {
    if (!provider.latitude || !provider.longitude) {
      return false;
    }

    const distance = calculateDistance(
      jobLat,
      jobLng,
      parseFloat(provider.latitude),
      parseFloat(provider.longitude)
    );

    return distance <= radiusMiles;
  });

  console.log(`Found ${providersInRadius.length} providers within ${radiusMiles} miles of job location`);
  return providersInRadius;
};


/**
 * Sends job notification emails to providers within radius
 * @param {Object} job - Job object with details
 * @param {string} vehicleType - Optional vehicle type to filter providers (e.g., "bike", "car", "small_van")
 * @returns {Promise<Object>} Result object with success count and errors
 */
export const notifyProvidersAboutJob = async (job, vehicleType = null) => {
  try {
    const effectiveVehicleType = vehicleType || job?.vanSize || null;
    console.log(`Starting job notification process for job: ${job.id}${effectiveVehicleType ? ` with vehicle type: ${effectiveVehicleType}` : ''}`);
    
    
    // Fetch providers with location data and matching approved service within bounding box
    const jobLocation = { lat: job.pickupLat, lng: job.pickupLng };
    const allProviders = await fetchProvidersWithLocation(job.category, jobLocation, 50, effectiveVehicleType);
    
    if (!allProviders || allProviders.length === 0) {
      console.log('No providers with matching approved service and location data found');
      return {
        success: true,
        notifiedCount: 0,
        errors: []
      };
    }

    // Calculate distance for each provider and sort by distance (nearest first)
    const providersWithDistance = allProviders
      .map(provider => {
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
        
        return {
          ...provider,
          distance: distance
        };
      })
      .sort((a, b) => {
        // Sort by distance (nearest first)
        // Providers without distance go to the end
        if (a.distance === null && b.distance === null) return 0;
        if (a.distance === null) return 1;
        if (b.distance === null) return -1;
        return a.distance - b.distance;
      });

    console.log(`Calculated distances for ${providersWithDistance.length} providers, sorted by proximity`);

    // Send emails to all providers in radius (in priority order - nearest first)
    const emailPromises = providersWithDistance.map(async (provider) => {
      try {
        // Include distance in job data for email template
        const jobWithDistance = {
          ...job,
          distance: provider.distance,
          providerDistance: provider.distance // Distance from this provider
        };

        await sendEmail({
          type: "newJobNotification",
          name: getUserFullName(provider.firstName, provider.lastName),
          email: provider.email,
          subject: `New ${job.category} Job Available - ${job.title}${provider.distance ? ` (${provider.distance.toFixed(1)} miles away)` : ''}`,
          job: jobWithDistance
        });
        
        console.log(`Job notification sent to provider: ${provider.email}${provider.distance ? ` (${provider.distance.toFixed(1)} miles away)` : ''}`);
        return { 
          success: true, 
          providerId: provider.id, 
          email: provider.email,
          distance: provider.distance
        };
      } catch (error) {
        console.error(`Failed to send email to provider ${provider.email}:`, error);
        return { 
          success: false, 
          providerId: provider.id, 
          email: provider.email, 
          distance: provider.distance,
          error: error.message 
        };
      }
    });

    // Wait for all emails to be sent
    const results = await Promise.all(emailPromises);
    
    // Count successes and errors
    const successful = results.filter(result => result.success);
    const failed = results.filter(result => !result.success);
    
    console.log(`Job notification process completed. Success: ${successful.length}, Failed: ${failed.length}`);
    
    return {
      success: true,
      notifiedCount: successful.length,
      totalProviders: providersWithDistance.length,
      providersByDistance: successful.map(result => ({
        providerId: result.providerId,
        email: result.email,
        distance: result.distance
      })),
      errors: failed.map(result => ({
        providerId: result.providerId,
        email: result.email,
        distance: result.distance,
        error: result.error
      }))
    };
    
  } catch (error) {
    console.error('Error in notifyProvidersAboutJob:', error);
    return {
      success: false,
      notifiedCount: 0,
      errors: [error.message]
    };
  }
};

export const getVehicleTypeId = async (vehicleType) => {
  try {
    if (!vehicleType) return null;

    const vehicleTypeRecord = await prisma.vehicle_types.findFirst({
      where: { name: vehicleType }
    });

    return vehicleTypeRecord?.id || null;
  } catch (error) {
    console.error('Error getting vehicle type ID:', error);
    throw error;
  }
};