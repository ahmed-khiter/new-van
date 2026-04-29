import prisma from "@/lib/prisma";

/**
 * Calculate job price based on service category and job details
 * @param {string} category - The service category (Van, Recovery, Cleaning, etc.)
 * @param {Object} jobData - Job data containing relevant fields for pricing
 * @param {number} jobData.distance - Distance in miles (for distance-based services)
 * @param {number} jobData.howManyRooms - Number of rooms (for cleaning)
 * @param {number} jobData.howManyItems - Number of items (for removals)
 * @param {string} jobData.vanSize - Van size (for van services)
 * @param {boolean} jobData.isTwoMenRequired - Whether two men are required
 * @param {boolean} jobData.isHelpLoading - Whether customer helps with loading
 * @returns {Promise<number>} - Calculated price
 */
export async function calculateJobPrice(category, jobData = {}) {
  try {
    // Hardcoded fallback prices matching schema.sql seed data
    // Used when the service is not found in the database
    const FALLBACK_PRICES = {
      'Van':                 { price: 50.00, base_price: 25.00 },
      'Recovery':            { price: 80.00, base_price: 40.00 },
      'Click & Collect':     { price: 30.00, base_price: 15.00 },
      'Cleaning':            { price: 40.00, base_price: 20.00 },
      'Removals':            { price: 70.00, base_price: 35.00 },
      'Locksmith':           { price: 60.00, base_price: 30.00 },
      'Car Key Replacement': { price: 100.00, base_price: 50.00 },
      'Luggage Storage':     { price: 5.00,  base_price: 0.00 },
      'Dry Cleaning Pick-Up':{ price: 10.00, base_price: 0.00 },
    };

    // Get service pricing from database
    const service = await prisma.services.findFirst({
      where: {
        name: {
          contains: getServiceNameForDB(category),
        },
        isActive: true
      }
    });

    let basePrice;
    let minimalCallOutPrice;
    let serviceId = null;

    if (service) {
      basePrice = parseFloat(service.price);
      minimalCallOutPrice = parseFloat(service.base_price) || 0;
      serviceId = service.id;
    } else {
      // Use fallback prices when service is not in the database
      const fallback = FALLBACK_PRICES[category];
      if (fallback) {
        console.warn(`Service not found for category: ${category}, using fallback prices (price: ${fallback.price}, base: ${fallback.base_price})`);
        basePrice = fallback.price;
        minimalCallOutPrice = fallback.base_price;
      } else {
        console.warn(`Service not found for category: ${category}, no fallback available`);
        return null;
      }
    }

    // Calculate price based on service category
    let calculatedPrice;
    switch (category) {
      case 'Van':
        calculatedPrice = await calculateVanPrice(basePrice, jobData, serviceId);
        break;
      
      case 'Recovery':
        calculatedPrice = calculateRecoveryPrice(basePrice, jobData);
        break;
      
      case 'Click & Collect':
        calculatedPrice = calculateClickCollectPrice(basePrice, jobData);
        break;
      
      case 'Cleaning':
        calculatedPrice = calculateCleaningPrice(basePrice, jobData);
        break;
      
      case 'Removals':
        calculatedPrice = calculateRemovalsPrice(basePrice, jobData);
        break;
      
      case 'Locksmith':
        calculatedPrice = calculateLocksmithPrice(basePrice, jobData);
        break;
      
      case 'Car Key Replacement':
        calculatedPrice = calculateCarKeyPrice(basePrice, jobData);
        break;
      
      case 'Luggage Storage':
      case 'Dry Cleaning Pick-Up':
        calculatedPrice = basePrice; // Fixed price from database
        break;

      default:
        calculatedPrice = basePrice;
    }
    
    // For Van, restaurant, and shop services, call out charge is already included in vehicle-specific pricing
    // For other services, add minimal call out price to the calculated price
    if ((category === 'Van' || category === 'restaurant' || category === 'shop') && jobData.vanSize) {
      return calculatedPrice; // Vehicle-specific pricing already includes call out charge
    }
    return calculatedPrice + minimalCallOutPrice;
  } catch (error) {
    console.error('Error calculating job price:', error);
    return null; // Return null so the caller can use a fallback price
  }
}

/**
 * Calculate Van service price
 * If vanSize is provided, use vehicle-specific pricing (per mile + call out charge)
 * Otherwise, use default service pricing
 */
async function calculateVanPrice(basePrice, jobData, serviceId) {
  // If vehicle type is specified, use vehicle-specific pricing
  if (jobData.vanSize) {
    try {
      const vehicleType = await prisma.vehicle_types.findFirst({
        where: {
          name: jobData.vanSize,
          serviceId: serviceId,
          isActive: true
        }
      });

      if (vehicleType) {
        const pricePerMile = parseFloat(vehicleType.pricePerMile);
        const callOutCharge = parseFloat(vehicleType.callOutCharge);
        const distance = jobData.distance || 0;
        
        // Calculate: (distance * price per mile) + call out charge
        return (distance * pricePerMile) + callOutCharge;
      }
    } catch (error) {
      console.error('Error fetching vehicle type pricing:', error);
      // Fall through to default pricing
    }
  }

  // Default pricing: distance * base price
  if (jobData.distance && jobData.distance > 0) {
    return jobData.distance * basePrice;
  }
  return basePrice; // Fallback to base price if no distance
}

/**
 * Calculate Recovery service price
 * Distance * service price from database
 */
function calculateRecoveryPrice(basePrice, jobData) {
  if (jobData.distance && jobData.distance > 0) {
    return jobData.distance * basePrice;
  }
  return basePrice; // Fallback to base price if no distance
}

/**
 * Calculate Click & Collect service price
 * Distance * service price from database
 */
function calculateClickCollectPrice(basePrice, jobData) {
  if (jobData.distance && jobData.distance > 0) {
    return jobData.distance * basePrice;
  }
  return basePrice; // Fallback to base price if no distance
}

/**
 * Calculate Cleaning service price
 * Rooms * service price from database
 */
function calculateCleaningPrice(basePrice, jobData) {
  if (jobData.howManyRooms) {
    const rooms = parseInt(jobData.howManyRooms);
    return rooms * basePrice;
  }
  return basePrice; // Fallback to base price if no rooms
}

/**
 * Calculate Removals service price
 * Items * service price from database
 */
function calculateRemovalsPrice(basePrice, jobData) {
  if (jobData.howManyItems) {
    const items = parseInt(jobData.howManyItems);
    return items * basePrice;
  }
  return basePrice; // Fallback to base price if no items
}

/**
 * Calculate Locksmith service price
 * Fixed service price from database
 */
function calculateLocksmithPrice(basePrice, jobData) {
  return basePrice; // Fixed price service
}

/**
 * Calculate Car Key Replacement service price
 * Fixed service price from database
 */
function calculateCarKeyPrice(basePrice, jobData) {
  return basePrice; // Fixed price service
}

/**
 * Map category names to database service names
 */
function getServiceNameForDB(category) {
  const categoryMap = {
    'Van': 'Courier',
    'Recovery': 'Breakdown Assistance',
    'Click & Collect': 'Click & Collect Delivery',
    'Cleaning': 'Professional Cleaning',
    'Removals': 'Rubbish removals',
    'Locksmith': 'Locksmith',
    'Car Key Replacement': 'Mobile car key replacement',
    'Luggage Storage': 'Luggage Storage',
    'Dry Cleaning Pick-Up': 'Dry Cleaning'
  };
  
  return categoryMap[category] || category;
}

/**
 * Get all active services from database
 */
export async function getActiveServices() {
  try {
    const services = await prisma.services.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    });
    
    return services;
  } catch (error) {
    console.error('Error fetching active services:', error);
    return [];
  }
}

/**
 * Update service pricing in database
 */
export async function updateServicePricing(serviceId, newPrice) {
  try {
    const updatedService = await prisma.services.update({
      where: { id: serviceId },
      data: { price: newPrice }
    });
    
    return updatedService;
  } catch (error) {
    console.error('Error updating service pricing:', error);
    throw error;
  }
}

/**
 * Get detailed price breakdown for display on checkout
 * @param {string} category - The service category
 * @param {Object} jobData - Job data
 * @returns {Promise<Object>} - Price breakdown with line items
 */
export async function getPriceBreakdown(category, jobData = {}) {
  try {
    // Same fallback prices as in calculateJobPrice
    const FALLBACK_PRICES = {
      'Van':                 { price: 50.00, base_price: 25.00 },
      'Recovery':            { price: 80.00, base_price: 40.00 },
      'Click & Collect':     { price: 30.00, base_price: 15.00 },
      'Cleaning':            { price: 40.00, base_price: 20.00 },
      'Removals':            { price: 70.00, base_price: 35.00 },
      'Locksmith':           { price: 60.00, base_price: 30.00 },
      'Car Key Replacement': { price: 100.00, base_price: 50.00 },
      'Luggage Storage':     { price: 5.00,  base_price: 0.00 },
      'Dry Cleaning Pick-Up':{ price: 10.00, base_price: 0.00 },
    };

    const service = await prisma.services.findFirst({
      where: {
        name: {
          contains: getServiceNameForDB(category),
        },
        isActive: true
      }
    });

    let basePrice;
    let minimalCallOutPrice;

    if (service) {
      basePrice = parseFloat(service.price);
      minimalCallOutPrice = parseFloat(service.base_price) || 0;
    } else {
      const fallback = FALLBACK_PRICES[category];
      if (fallback) {
        basePrice = fallback.price;
        minimalCallOutPrice = fallback.base_price;
      } else {
        return { lineItems: [], total: 0 };
      }
    }
    const lineItems = [];
    let total = 0;

    switch (category) {
      case 'Van':
        if (jobData.vanSize) {
          // Vehicle-specific pricing
          try {
            const vehicleType = await prisma.vehicle_types.findFirst({
              where: {
                name: jobData.vanSize,
                serviceId: service.id,
                isActive: true
              }
            });

            if (vehicleType) {
              const pricePerMile = parseFloat(vehicleType.pricePerMile);
              const callOutCharge = parseFloat(vehicleType.callOutCharge);
              const distance = jobData.distance || 0;
              
              // Get vehicle label
              const { courierVehicleTypes } = await import('@/utils/helper');
              const vehicleLabel = courierVehicleTypes.find(vt => vt.value === jobData.vanSize)?.label || jobData.vanSize;

              if (distance > 0) {
                const distanceCost = distance * pricePerMile;
                lineItems.push({
                  name: `Distance (${distance} miles) × £${pricePerMile.toFixed(2)}/mile`,
                  amount: distanceCost,
                  description: `Vehicle: ${vehicleLabel}`
                });
                total += distanceCost;
              }

              if (callOutCharge > 0) {
                lineItems.push({
                  name: `Call Out Charge`,
                  amount: callOutCharge,
                  description: `Vehicle: ${vehicleLabel}`
                });
                total += callOutCharge;
              }
            }
          } catch (error) {
            console.error('Error fetching vehicle type:', error);
          }
        } else {
          // Default pricing
          const distance = jobData.distance || 0;
          if (distance > 0) {
            const distanceCost = distance * basePrice;
            lineItems.push({
              name: `Distance (${distance} miles) × £${basePrice.toFixed(2)}/mile`,
              amount: distanceCost,
            });
            total += distanceCost;
          }
          if (minimalCallOutPrice > 0) {
            lineItems.push({
              name: `Minimal Call Out Charge`,
              amount: minimalCallOutPrice,
            });
            total += minimalCallOutPrice;
          }
        }
        break;

      case 'Recovery':
      case 'Click & Collect': {
        const distanceForService = jobData.distance || 0;
        if (distanceForService > 0) {
          const distanceCost = distanceForService * basePrice;
          lineItems.push({
            name: `Distance (${distanceForService} miles) × £${basePrice.toFixed(2)}/mile`,
            amount: distanceCost,
          });
          total += distanceCost;
        }
        if (minimalCallOutPrice > 0) {
          lineItems.push({
            name: `Minimal Call Out Charge`,
            amount: minimalCallOutPrice,
          });
          total += minimalCallOutPrice;
        }
        break;
      }

      case 'Cleaning': {
        const rooms = jobData.howManyRooms ? parseInt(jobData.howManyRooms) : 0;
        if (rooms > 0) {
          const roomsCost = rooms * basePrice;
          lineItems.push({
            name: `Rooms (${rooms}) × £${basePrice.toFixed(2)}/room`,
            amount: roomsCost,
          });
          total += roomsCost;
        }
        if (minimalCallOutPrice > 0) {
          lineItems.push({
            name: `Minimal Call Out Charge`,
            amount: minimalCallOutPrice,
          });
          total += minimalCallOutPrice;
        }
        break;
      }

      case 'Removals': {
        const items = jobData.howManyItems ? parseInt(jobData.howManyItems) : 0;
        if (items > 0) {
          const itemsCost = items * basePrice;
          lineItems.push({
            name: `Items (${items}) × £${basePrice.toFixed(2)}/item`,
            amount: itemsCost,
          });
          total += itemsCost;
        }
        if (minimalCallOutPrice > 0) {
          lineItems.push({
            name: `Minimal Call Out Charge`,
            amount: minimalCallOutPrice,
          });
          total += minimalCallOutPrice;
        }
        break;
      }

      case 'Locksmith':
      case 'Car Key Replacement':
        lineItems.push({
          name: category,
          amount: basePrice,
        });
        if (minimalCallOutPrice > 0) {
          lineItems.push({
            name: `Minimal Call Out Charge`,
            amount: minimalCallOutPrice,
          });
        }
        total = basePrice + minimalCallOutPrice;
        break;

      default:
        lineItems.push({
          name: category,
          amount: basePrice,
        });
        total = basePrice;
    }

    return { lineItems, total };
  } catch (error) {
    console.error('Error getting price breakdown:', error);
    return { lineItems: [], total: 0 };
  }
}


export const getCurrencyTypeAndUnit = (currencyType) => {
  switch (currencyType) {
    case 'USD': // US Dollar
      return {currency : "USD", unit: 100}; // 1 USD = 100 cents
    case 'GB': // British Pound
      return {currency : "GBP", unit: 100}; // 1 GBP = 100 pence
    case 'SA': // Saudi Riyal (SAR)
      return {currency : "SAR", unit: 100}; // 1 SAR = 100 halalas
    default:
      return {currency : "GBP", unit: 100}; // safe fallback
  }
};
