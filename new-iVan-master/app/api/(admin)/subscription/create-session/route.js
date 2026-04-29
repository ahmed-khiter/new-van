import { NextResponse } from "next/server";
import Stripe from "stripe";
import {
  getSubscriptionStatus,
  canSubscribeToPlan,
  getPlanById,
} from "@/utils/subscriptionService";
import prisma from "@/lib/prisma";
import { getCurrencyTypeAndUnit } from "../../../../../utils/pricingService";

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

    const { planId, type } = await req.json();
    if (!planId) {
      return NextResponse.json(
        { error: "planId is required." },
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

    // Fetch user email for customer_email
    const user = await prisma.users.findUnique({
      where: { id: Number(userId) },
      select: { email: true },
    });

    if (!user || !user.email) {
      return NextResponse.json(
        { error: "User email not found." },
        { status: 400 }
      );
    }
    const userCurrencyToPay = getCurrencyTypeAndUnit(plan.plan_region);
    const { currency, unit } = userCurrencyToPay;
    let amountToCharge = Number(plan.price);
    if (type === "yearly") {
        // Calculate yearly total from monthly price
        amountToCharge = amountToCharge * 12; // 12 months
        // Apply 30% discount
        amountToCharge = amountToCharge * 0.7;
    }
    const profile = await prisma.customer_profile.findFirst({
      where: { userId: Number(userId), default: true },
    });
    const sessionOptions = {  
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: currency,
            unit_amount: Math.round(amountToCharge * unit),
            product_data: {
              name: plan.name,
              description: plan.description || `${plan.name} subscription`,
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXTAUTH_URL}/checkout-verify?planId=${planId}&success=true`,
      cancel_url: `${process.env.NEXTAUTH_URL}/checkout-verify?planId=${planId}&cancel=true`,
      metadata: {
        userId: String(userId),
        planId: String(planId),
        planType: type || "monthly",
      },
    };
    if (profile?.stripeCustomerId) {
      // Prefill saved card
      sessionOptions.customer = profile.stripeCustomerId;
      sessionOptions.payment_intent_data = {
        setup_future_usage: "off_session",
      };
    } else {
      sessionOptions.customer_email = user.email;
      sessionOptions.billing_address_collection = "required";
    }
    console.log(sessionOptions , "sessionOptions");
    // Stripe Checkout session
    const session = await stripe.checkout.sessions.create(sessionOptions);

    return NextResponse.json({
      status: 200,
      url: session.url,
    });
  } catch (error) {
    console.error("Create Checkout Session Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
};
