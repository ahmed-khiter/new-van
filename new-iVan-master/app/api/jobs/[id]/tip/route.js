import { NextResponse } from "next/server";
import Stripe from "stripe";
import prisma from "@/lib/prisma";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const POST = async (req, { params }) => {
  try {
    const { id } = params;
    const userId = req.headers.get("user-id");
    const { tipAmount } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required in headers." },
        { status: 400 }
      );
    }

    if (!tipAmount || tipAmount <= 0) {
      return NextResponse.json(
        { error: "Valid tip amount is required." },
        { status: 400 }
      );
    }

    // Get job details
    const job = await prisma.jobs.findUnique({
      where: { id },
    });

    if (!job) {
      return NextResponse.json(
        { error: "Job not found." },
        { status: 404 }
      );
    }

    // Verify the job belongs to the user
    if (job.createdById !== parseInt(userId, 10)) {
      return NextResponse.json(
        { error: "Unauthorized access to job" },
        { status: 403 }
      );
    }

    // Get customer profile with default payment method
    const profile = await prisma.customer_profile.findFirst({
      where: { userId: Number(userId), default: true },
    });

    if (!profile || !profile.stripeCustomerId) {
      return NextResponse.json(
        { error: "Payment method not found. Please add a payment method." },
        { status: 400 }
      );
    }

    if (!profile.paymentMethodId) {
      return NextResponse.json(
        { error: "No payment method available. Please add a payment method." },
        { status: 400 }
      );
    }

    // Create payment intent for tip
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(tipAmount * 100), // Convert to cents
      currency: "gbp",
      customer: profile.stripeCustomerId,
      payment_method: profile.paymentMethodId,
      confirm: true,
      return_url: `${process.env.NEXTAUTH_URL}/customer/jobs/${id}/track`,
      metadata: {
        userId: String(userId),
        jobId: id,
        type: "tip",
      },
    });

    if (paymentIntent.status !== "succeeded") {
      return NextResponse.json(
        { error: "Payment failed. Please try again." },
        { status: 400 }
      );
    }

    // Retrieve card information from payment method
    let cardBrand = null;
    let lastFourDigit = null;
    try {
      const paymentMethod = await stripe.paymentMethods.retrieve(profile.paymentMethodId);
      if (paymentMethod?.card) {
        cardBrand = paymentMethod.card.brand;
        lastFourDigit = paymentMethod.card.last4;
      }
    } catch (error) {
      console.error("Error retrieving payment method details:", error);
      // Continue without card info if retrieval fails
    }

    // Update job with tip amount
    const updatedJob = await prisma.jobs.update({
      where: { id },
      data: { tip: tipAmount },
    });

    // Create transaction record for tip
    await prisma.transaction.create({
      data: {
        transaction_id: paymentIntent.id,
        amount: tipAmount,
        customer_profile_id: profile.stripeCustomerId,
        user_id: Number(userId),
        job_id: id,
        type: "tip",
        cardBrand: cardBrand,
        lastFourDigit: lastFourDigit,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Tip payment processed successfully",
      paymentIntentId: paymentIntent.id,
      tip: tipAmount,
    });
  } catch (error) {
    console.error("Tip Payment Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
};

