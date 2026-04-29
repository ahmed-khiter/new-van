import { NextResponse } from "next/server";
import Stripe from "stripe";
import prisma from "@/lib/prisma";
import {
  getSubscriptionStatus,
  canSubscribeToPlan,
  getPlanById,
  syncTheUserUsage,
} from "@/utils/subscriptionService";
import { getCurrencyTypeAndUnit } from "@/utils/pricingService";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const POST = async (req) => {
  try {
    const userId = req.headers.get("user-id");
    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required in headers." },
        { status: 400 }
      );
    }

    const { planId, type, paymentMethodId } = await req.json();
    
    if (!planId || !paymentMethodId) {
      return NextResponse.json(
        { error: "planId and paymentMethodId are required." },
        { status: 400 }
      );
    }

    // Get current subscription status
    const { subscription: currentSubscription } = await getSubscriptionStatus(
      Number(userId)
    );

    // Check if user can subscribe to this plan
    const { canSubscribe, reason } = canSubscribeToPlan(
      currentSubscription,
      Number(planId)
    );

    if (!canSubscribe) {
      let errorMessage = "Cannot subscribe to this plan.";
      if (reason === "downgrade_not_allowed") {
        errorMessage =
          "You cannot downgrade your current plan. You can only upgrade to a higher tier.";
      } else if (reason === "same_plan") {
        errorMessage = "You are already subscribed to this plan.";
      }

      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    // Fetch the selected plan from DB
    const plan = await getPlanById(Number(planId));

    if (!plan) {
      return NextResponse.json(
        { error: "Invalid plan selected." },
        { status: 404 }
      );
    }

    // Get customer profile
    const profile = await prisma.customer_profile.findFirst({
      where: { userId: Number(userId), default: true },
    });

    if (!profile || !profile.stripeCustomerId) {
      return NextResponse.json(
        { error: "Payment method not found. Please add a payment method." },
        { status: 400 }
      );
    }

    // Calculate amount
    const userCurrencyToPay = getCurrencyTypeAndUnit(plan.plan_region);
    const { currency, unit } = userCurrencyToPay;
    let amountToCharge = Number(plan.price);
    if (type === "yearly") {
      amountToCharge = amountToCharge * 12;
      amountToCharge = amountToCharge * 0.7; // 30% discount
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amountToCharge * unit),
      currency: currency.toLowerCase(),
      customer: profile.stripeCustomerId,
      payment_method: paymentMethodId,
      confirm: true,
      return_url: `${process.env.NEXTAUTH_URL}/provider/pricing`,
      metadata: {
        userId: String(userId),
        planId: String(planId),
        planType: type || "monthly",
      },
    });

    if (paymentIntent.status !== "succeeded") {
      return NextResponse.json(
        { error: "Payment failed. Please try again." },
        { status: 400 }
      );
    }

    // Process subscription (same logic as webhook)
    const planType = type || "monthly";
    const endDate = new Date();
    if (planType === "monthly") {
      endDate.setDate(endDate.getDate() + 30);
    } else if (planType === "yearly") {
      endDate.setDate(endDate.getDate() + 365);
    }

    // Create transaction record
    await prisma.transaction.create({
      data: {
        transaction_id: paymentIntent.id,
        amount: amountToCharge,
        customer_profile_id: profile.stripeCustomerId,
        user_id: Number(userId),
        plan_id: planId,
      },
    });

    // Check if user has an active subscription that's still valid
    const existingSubscription = await prisma.subscriptions.findFirst({
      where: {
        user_id: Number(userId),
        status: "active",
        end_date: {
          gt: new Date(),
        },
      },
      orderBy: {
        created_at: "desc",
      },
    });

    let finalEndDate = endDate;

    if (existingSubscription) {
      // Calculate remaining days from previous subscription
      const now = new Date();
      const remainingDays = Math.ceil(
        (new Date(existingSubscription.end_date) - now) /
          (1000 * 60 * 60 * 24)
      );
      const isExistPlanIsFree = plan.price === 0;
      
      // Add remaining days to new plan duration
      if (remainingDays > 0 && !isExistPlanIsFree) {
        finalEndDate = new Date();
        if (planType === "monthly") {
          finalEndDate.setDate(finalEndDate.getDate() + 30 + remainingDays);
        } else if (planType === "yearly") {
          finalEndDate.setDate(finalEndDate.getDate() + 365 + remainingDays);
        }
      }

      // Mark previous subscription as upgraded
      await prisma.subscriptions.update({
        where: { subscription_id: existingSubscription.subscription_id },
        data: {
          status: "upgraded",
          updated_at: new Date(),
        },
      });
    }

    // Create new subscription record
    await prisma.subscriptions.create({
      data: {
        user_id: Number(userId),
        plan_id: planId,
        start_date: new Date(),
        end_date: finalEndDate,
        amount_charged: amountToCharge,
        type: planType,
        status: "active",
      },
    });

    // Sync the user's features based on the new plan
    await syncTheUserUsage({ userId: Number(userId), planId });
    const { subscription: newSubscription } = await getSubscriptionStatus(Number(userId));
    return NextResponse.json({
      success: true,
      message: "Subscription activated successfully",
      paymentIntentId: paymentIntent.id,
      subscription: newSubscription,
    });
  } catch (error) {
    console.error("Subscription Payment Intent Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
};

