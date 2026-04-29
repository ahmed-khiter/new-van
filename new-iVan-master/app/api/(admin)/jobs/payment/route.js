import { NextResponse } from "next/server";
import Stripe from "stripe";
import prisma from "@/lib/prisma";
import { notifyProvidersAboutJob } from "@/utils/jobService";
import { handleJobPostedAndPaidEmailSending } from "@/utils/jobPostedAndPaidEmailService";

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

    const { jobId, paymentMethodId } = await req.json();
    
    if (!jobId || !paymentMethodId) {
      return NextResponse.json(
        { error: "jobId and paymentMethodId are required." },
        { status: 400 }
      );
    }

    // Get job details
    const job = await prisma.jobs.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      return NextResponse.json(
        { error: "Job not found." },
        { status: 404 }
      );
    }

    if (job.createdById !== parseInt(userId, 10)) {
      return NextResponse.json(
        { error: "Unauthorized access to job" },
        { status: 403 }
      );
    }

    if (job.status !== "draft") {
      return NextResponse.json(
        { error: "Job is not in draft status" },
        { status: 400 }
      );
    }

    if (!job.price || job.price <= 0) {
      return NextResponse.json(
        { error: "Job does not have a valid price" },
        { status: 400 }
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

    // Calculate total amount
    const totalAmount = Number(job.price);

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(totalAmount * 100), // Convert to cents
      currency: "gbp",
      customer: profile.stripeCustomerId,
      payment_method: paymentMethodId,
      confirm: true,
      return_url: `${process.env.NEXTAUTH_URL}/customer/jobs`,
      metadata: {
        userId: String(userId),
        jobId: jobId,
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
      const paymentMethodId = paymentIntent.payment_method;
      if (paymentMethodId) {
        const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
        if (paymentMethod?.card) {
          cardBrand = paymentMethod.card.brand;
          lastFourDigit = paymentMethod.card.last4;
        }
      }
    } catch (error) {
      console.error("Error retrieving payment method details:", error);
      // Continue without card info if retrieval fails
    }

    // Process payment (same logic as webhook)
    // Update job status to active
    const updatedJob = await prisma.jobs.update({
      where: { id: jobId },
      data: { status: "active" },
    });

    // Send notifications to providers about the new active job
    try {
      const notificationResult = await notifyProvidersAboutJob(updatedJob);
      console.log(
        `Job notification result for paid job ${jobId}:`,
        notificationResult
      );
    } catch (error) {
      console.error(
        "Error sending job notifications for paid job:",
        error
      );
    }

    // Send job posted and paid email to customer
    try {
      await handleJobPostedAndPaidEmailSending(
        jobId,
        Number(userId),
        totalAmount,
        paymentIntent.id
      );
      console.log(
        `Job posted and paid email sent to customer for job ${jobId}`
      );
    } catch (error) {
      console.error(
        "Error sending job posted and paid email to customer:",
        error
      );
    }

    // Create transaction record
    await prisma.transaction.create({
      data: {
        transaction_id: paymentIntent.id,
        amount: totalAmount,
        customer_profile_id: profile.stripeCustomerId,
        user_id: Number(userId),
        job_id: jobId,
        cardBrand: cardBrand,
        lastFourDigit: lastFourDigit,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Job payment processed successfully",
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error("Job Payment Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
};

