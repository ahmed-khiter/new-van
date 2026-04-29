import { NextResponse } from "next/server";
import Stripe from "stripe";
import prisma from "@/lib/prisma";
import { notifyProvidersAboutJob } from "@/utils/jobService";
import { handleJobPostedAndPaidEmailSending } from "@/utils/jobPostedAndPaidEmailService";
import { handleShopOrderPaymentEmailSending } from "@/utils/shopOrderPaymentEmailService";

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

    const { orderId, jobId, paymentMethodId } = await req.json();
    
    if (!orderId || !jobId || !paymentMethodId) {
      return NextResponse.json(
        { error: "orderId, jobId, and paymentMethodId are required." },
        { status: 400 }
      );
    }

    // Get order details
    const order = await prisma.product_orders.findUnique({
      where: { id: orderId },
      include: {
        cart: {
          include: {
            cartItems: {
              include: { product: true },
            },
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Order not found." },
        { status: 404 }
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
    const totalAmount = Number(order.totalCartPrice) + Number(order.deliveryPrice || 0);

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
        orderId: orderId,
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
    await prisma.jobs.update({
      where: { id: jobId },
      data: { status: "active" },
    });

    // Send notifications to providers about the new active job
    try {
      const notificationResult = await notifyProvidersAboutJob(job);
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

    // Update order status and deliveryStatus to ready_to_dispatch
    await prisma.product_orders.update({
      where: { id: orderId },
      data: {
        status: "paid",
        deliveryStatus: "ready_to_dispatch",
      },
    });

    // Send shop order payment email to customer
    try {
      await handleShopOrderPaymentEmailSending(
        orderId,
        Number(userId),
        totalAmount,
        paymentIntent.id
      );
      console.log(
        `Shop order payment email sent to customer for order ${orderId}`
      );
    } catch (error) {
      console.error(
        "Error sending shop order payment email to customer:",
        error
      );
    }

    // Decrement stock for all cart items
    if (order.cart?.cartItems) {
      for (const cartItem of order.cart.cartItems) {
        await prisma.products.update({
          where: { id: cartItem.productId },
          data: {
            stock: {
              decrement: cartItem.quantity,
            },
          },
        });
        console.log(
          `Stock decremented for product ${cartItem.product.name}: ${cartItem.quantity} units`
        );
      }
    }

    // Create transaction record
    await prisma.transaction.create({
      data: {
        transaction_id: paymentIntent.id,
        amount: totalAmount,
        customer_profile_id: profile.stripeCustomerId,
        user_id: Number(userId),
        job_id: jobId,
        order_id: orderId,
        cardBrand: cardBrand,
        lastFourDigit: lastFourDigit,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Order payment processed successfully",
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error("Order Payment Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
};

