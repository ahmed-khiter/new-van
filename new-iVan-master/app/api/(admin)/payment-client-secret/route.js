import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
  try {
    const userId = req.headers.get("user-id");
    const body = await req.json();
    const { amount, currency = "usd", jobId, orderId, planId, planType } = body;

    if (!amount) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          message: "Amount is required",
        },
        { status: 400 }
      );
    }
    const metadata = {
      userId: Number(userId),
    };

    if (planId) metadata.planId = planId;
    if (planType) metadata.planType = planType;
    if (jobId) metadata.jobId = jobId;
    if (orderId) metadata.orderId = orderId;

     const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      metadata,
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          clientSecret: paymentIntent.client_secret,
        },
        message: "PaymentIntent created successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        data: null,
        message: error.message || "Something went wrong",
      },
      { status: 500 }
    );
  }
}
