import prisma from "@/lib/prisma";

/**
 * Check if a subscription is active and valid (not expired)
 * @param {Object} subscription - Subscription object
 * @returns {boolean} - True if subscription is active and not expired
 */
export const isSubscriptionActive = (subscription) => {
  if (!subscription) return false;
  
  const now = new Date();
  const endDate = new Date(subscription.end_date);
  
  // Active subscription or cancelled but still valid (within end date)
  return (subscription.status === "active" || subscription.status === "cancelled") && endDate > now;
};



/**
 * Get subscription status with proper validation
 * @param {string} userId - User ID
 * @returns {Object} - Subscription object with updated status if needed
 */
export const getSubscriptionStatus = async (userId) => {
  try {
    // First, get the most recent subscription regardless of status
    const subscription = await prisma.subscriptions.findFirst({
      where: {
        user_id: userId,
      },
      include: {
        plans: true
      },
      orderBy: {
        created_at: "desc"
      }
    });

    if (!subscription) {
      return { subscription: null };
    }

    // Check if subscription is expired and update status if needed
    if (subscription.status === "active") {
      const now = new Date();
      const endDate = new Date(subscription.end_date);
      
      if (endDate <= now) {
        await prisma.subscriptions.update({
          where: { subscription_id : subscription.subscription_id },
          data: { status: "expired" }
        });
        
        subscription.status = "expired";
      }
    }

    return { subscription };
  } catch (error) {
    console.error("Error fetching subscription status:", error);
    throw error;
  }
};

/**
 * Check if user should be encouraged to upgrade
 * @param {Object} subscription - Current subscription object (can be null)
 * @returns {boolean} - True if upgrade should be encouraged
 */
export const shouldEncourageUpgrade = async (subscription) => {
  try {
    // If no subscription, encourage upgrade
    if (!subscription) {
      return true;
    }

    // Get all plans ordered by price (ascending)
    const allPlans = await prisma.plans.findMany({
      orderBy: {
        price: 'asc'
      }
    });

    if (!allPlans || allPlans.length === 0) {
      return false;
    }

    // Get current plan ID
    const currentPlanId = subscription.plan_id;

    // Check if there's a higher tier plan available (higher plan_id)
    const hasHigherTier = allPlans.some(plan => plan.plan_id > currentPlanId);

    return hasHigherTier;
  } catch (error) {
    console.error("Error checking upgrade encouragement:", error);
    return false;
  }
};

/**
 * Check if user can subscribe to a specific plan
 * @param {Object} currentSubscription - Current subscription object
 * @param {number} newPlanId - New plan ID to subscribe to
 * @returns {Object} - { canSubscribe: boolean, reason: string }
 */
export const canSubscribeToPlan = (currentSubscription, newPlanId) => {
  // If no current subscription, can subscribe to any plan
  if (!currentSubscription) {
    return { canSubscribe: true, reason: null };
  }

  // If subscription is expired, can subscribe to any plan
  if (currentSubscription.status === "expired") {
    return { canSubscribe: true, reason: null };
  }

  // If subscription is cancelled but still valid (within end date), can subscribe to any plan
  if (currentSubscription.status === "cancelled" && isSubscriptionActive(currentSubscription)) {
    return { canSubscribe: true, reason: null };
  }

  // If subscription is active, check for upgrade/downgrade rules
  if (currentSubscription.status === "active") {
    // Check if it's actually still valid (not expired)
    if (isSubscriptionActive(currentSubscription)) {
      const currentPlanId = currentSubscription.plan_id;
      
      // Allow upgrade (higher plan ID) but not downgrade
      if (newPlanId > currentPlanId) {
        return { canSubscribe: true, reason: "upgrade" };
      } else if (newPlanId < currentPlanId) {
        return { canSubscribe: false, reason: "downgrade_not_allowed" };
      } else {
        return { canSubscribe: false, reason: "same_plan" };
    }
    } else {
      // Subscription is marked as active but is actually expired
      return { canSubscribe: true, reason: null };
    }
  }

  return { canSubscribe: true, reason: null };
};

/**
 * Validate subscription for job acceptance
 * @param {string} userId - User ID
 * @returns {Object} - { valid: boolean, subscription: Object, error: string }
 */
export const validateSubscriptionForJob = async (userId) => {
  try {
    const { subscription } = await getSubscriptionStatus(userId);
    
    if (!subscription) {
      return {
        valid: false,
        subscription: null,
        error: "Please subscribe to a plan to accept jobs."
      };
    }

    // Cancelled subscriptions cannot accept jobs regardless of remaining time
    if (subscription.status === "cancelled") {
      return {
        valid: false,
        subscription,
        error: "Your subscription has been cancelled. Please renew your subscription to accept jobs.",
        reason: "subscription_cancelled"
      };
    }

    if (!isSubscriptionActive(subscription)) {
      return {
        valid: false,
        subscription,
        error: subscription.status === "expired" 
          ? "Your subscription has expired. Please renew to continue accepting jobs."
          : "Your subscription is not active. Please contact support."
      };
    }

    return {
      valid: true,
      subscription,
      error: null
    };
  } catch (error) {
    console.error("Error validating subscription for job:", error);
    return {
      valid: false,
      subscription: null,
      error: "Error validating subscription. Please try again."
    };
  }
};

/**
 * Get plan details by ID
 * @param {number} planId - Plan ID
 * @returns {Object} - Plan object
 */
export const getPlanById = async (planId) => {
  try {
    const plan = await prisma.plans.findUnique({
      where: { plan_id: planId }
    });
    return plan;
  } catch (error) {
    console.error("Error fetching plan:", error);
    throw error;
  }
};


/** * is User limit reached for the plan
 * @param {number} userId - Plan ID
 * @returns {Object} - Plan limits object
 */// Check if user can use a feature
export const checkFeatureUsage = async ({ userId, featureName }) => {
  try {
    const { subscription } = await getSubscriptionStatus(userId);

    if (!subscription) {
      return { valid: false, error: "You need an active subscription to use this feature. Please subscribe to continue.",
      };
    }

    const userUsage = await prisma.user_usage.findFirst({
      where: {
        userId: parseInt(userId),
        featureName: featureName,
      },
    });

    const usedValue = userUsage ? userUsage.usedValue : 0;
    const limitValue = userUsage ? userUsage.limitValue : 0;
    const remaining = limitValue - usedValue;

    if (remaining <= 0) {
      return {
        valid: false,
        remaining: 0,
        error: `You’ve reached the maximum limit for "${featureName}". Upgrade your plan to get more usage.`,
      };
    }

    return { valid: true, remaining, error: null };
  } catch (error) {
    console.error("Error in checkFeatureUsage:", error);
    return {
      valid: false,
      remaining: 0,
      error: "Something went wrong while checking your feature usage. Please try again later.",
    };
  }
};

// Increment the usedValue for a feature (up to limitValue)
export const incrementFeatureUsage = async ({ userId, featureName, incrementBy = 1 }) => {
  try {
    const usage = await prisma.user_usage.findFirst({
      where: {
        userId: parseInt(userId),
        featureName: featureName,
      },
    });

    if (!usage) {
      throw new Error(`Usage record not found for feature "${featureName}"`);
    }

    const newUsedValue = Math.min(usage.usedValue + incrementBy, usage.limitValue);

    await prisma.user_usage.update({
      where: { id: usage.id },
      data: { usedValue: newUsedValue },
    });

    return {
      success: true,
      usedValue: newUsedValue,
      remaining: usage.limitValue - newUsedValue,
    };
  } catch (error) {
    console.error("Error incrementing feature usage:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Check if user has an active subscription (for shop/restaurant owners)
 * @param {number} userId - User ID
 * @returns {boolean} - True if user has active subscription
 */
export const hasActiveSubscription = async (userId) => {
  try {
    const { subscription } = await getSubscriptionStatus(userId);
    return isSubscriptionActive(subscription);
  } catch (error) {
    console.error("Error checking active subscription:", error);
    return false;
  }
};

export const syncTheUserUsage = async ({ userId, planId }) => {
  try {
    //  Get all plan features for this plan
    const planFeatures = await prisma.plan_features.findMany({
      where: { planId: planId },
    });

    if (!planFeatures || planFeatures.length === 0) {
      throw new Error("No features found for this plan");
    }

    const results = [];

    //  Loop through each feature
    for (const feature of planFeatures) {
      const { featureName, limitValue: newPlanLimit } = feature;

      //  Check if user already has usage record
      const usage = await prisma.user_usage.findFirst({
        where: { userId: parseInt(userId), featureName },
      });

      if (!usage) {
        // Feature not present, create new usage
        const created = await prisma.user_usage.create({
          data: {
            userId: parseInt(userId),
            featureName,
            limitValue: newPlanLimit,
            usedValue: 0,
          },
        });
        results.push({ featureName, action: "created", limitValue: newPlanLimit });
      } else {
        // Feature exists, update usage (upgrade scenario)
        const usedValue = usage.usedValue || 0;
        const oldLimit = usage.limitValue || 0;
        const remaining = Math.max(oldLimit - usedValue, 0);

        const newLimitValue = newPlanLimit + remaining;

        await prisma.user_usage.update({
          where: { id: usage.id },
          data: {
            limitValue: newLimitValue,
            usedValue: 0, // reset used value on upgrade
          },
        });
        results.push({ featureName, action: "updated", oldLimit, remaining, newLimitValue });
      }
    }

    return {
      success: true,
      message: "User plan features synced successfully",
      details: results,
    };
  } catch (error) {
    console.error("Error syncing user plan features:", error);
    return { success: false, error: error.message };
  }
};

