import prisma from "@/lib/prisma";
import { getPlanById } from "@/utils/subscriptionService";
import { notifyProvidersAboutJob } from "@/utils/jobService";
import { handleJobPostedAndPaidEmailSending } from "@/utils/jobPostedAndPaidEmailService";
import {
  handleShopOrderPaymentEmailSending,
  handleShopOrderConfirmationRequiredEmailSending,
} from "@/utils/shopOrderPaymentEmailService";
import { NextResponse } from "next/server";
import { syncTheUserUsage } from "../../../../utils/subscriptionService";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
  try {
    const userId = parseInt(req.headers.get("user-id"));
    const customerEmail = req.headers.get("email");
    const payload = await req.json();
    const paymentIntentId =
      payload.paymentIntentId || `apple_pay_${Date.now()}`;
    const amount = payload.amount;
    const jobId = payload.jobId;
    const orderId = payload.orderId;
    const checkoutCartId = payload.cartId;
    const planId = payload.planId;
    const planType = payload.planType;
    if (!userId || !amount) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing required fields: userId and amount",
        },
        { status: 400 }
      );
    }

    // Check if this is a job payment (has jobId in payload)
    if (jobId) {
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
        console.error("Error sending job notifications for paid job:", error);
        // Don't fail the payment processing if email sending fails
      }

      // Send job posted and paid email to customer
      try {
        await handleJobPostedAndPaidEmailSending(
          jobId,
          userId,
          amount,
          paymentIntentId
        );
        console.log(
          `Job posted and paid email sent to customer for job ${jobId}`
        );
      } catch (error) {
        console.error(
          "Error sending job posted and paid email to customer:",
          error
        );
        // Don't fail the payment processing if email sending fails
      }

      // If this is a product purchase (has orderId), update product order status and decrement stock
      if (orderId) {
        // Get the order details
        const order = await prisma.product_orders.findUnique({
          where: { id: orderId },
        });

        if (order) {
          // Update order status
          await prisma.product_orders.update({
            where: { id: orderId },
            data: { status: "paid" },
          });

          // Send shop order payment email to customer (non-blocking)
          try {
            await handleShopOrderPaymentEmailSending(
              orderId,
              userId,
              amount,
              paymentIntentId
            );
            console.log(
              `Shop order payment email sent to customer for order ${orderId}`
            );
          } catch (error) {
            console.error(
              "Error sending shop order payment email to customer:",
              error
            );
            // Don't fail the payment processing if email sending fails
          }

          const checkoutCart = checkoutCartId
            ? await prisma.cart.findUnique({
                where: { id: checkoutCartId },
                include: {
                  cartItems: {
                    include: { product: true },
                  },
                },
              })
            : null;

          const cartItemsForStock =
            checkoutCart?.cartItems ||
            (await prisma.product_orders.findUnique({
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
            }))?.cart?.cartItems ||
            [];

          if (cartItemsForStock.length > 0) {
            // Decrement stock only for items from this payment checkout
            for (const cartItem of cartItemsForStock) {
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

            // Cart is already marked as ordered during checkout
            console.log(
              `Processing payment for cart ${checkoutCartId || "order-cart"} for user ${userId}`
            );

            // Send email to shop owner(s) about order requiring confirmation
            try {
              await handleShopOrderConfirmationRequiredEmailSending(orderId);
              console.log(
                `Shop owner confirmation required email sent for order ${orderId}`
              );
            } catch (error) {
              console.error(
                "Error sending shop owner confirmation required email:",
                error
              );
              // Don't fail the payment processing if email sending fails
            }
          }
        }
      }

      // Retrieve card information from payment intent if it's a valid Stripe payment intent
      let cardBrand = null;
      let lastFourDigit = null;
      if (paymentIntentId && !paymentIntentId.startsWith('apple_pay_')) {
        try {
          const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
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
      }

      // Create transaction record
      const transactionData = {
        transaction_id: paymentIntentId,
        amount,
        customer_profile_id: customerEmail,
        user_id: userId,
        job_id: jobId,
        order_id: orderId || null,
        cardBrand: cardBrand,
        lastFourDigit: lastFourDigit,
      };

      await prisma.transaction.create({
        data: transactionData,
      });

      console.log(
        `Job ${jobId} payment completed and status updated to active${
          orderId ? `, order ${orderId} marked as paid` : ""
        }`
      );
      return NextResponse.json(
        {
          success: true,
          message: `Payment processed successfully for ${
            orderId ? `order ${orderId}` : `job ${jobId}`
          }`,
        },
        { status: 200 }
      );
    }

    // Handle subscription payment
    if (planId) {
      const parsedPlanId = parseInt(planId);

      if (!parsedPlanId || isNaN(parsedPlanId)) {
        console.error("Invalid Plan ID:", planId);
        return NextResponse.json(
          {
            success: false,
            message: "Invalid Plan ID",
          },
          { status: 400 }
        );
      }

      // Get the plan details using subscription service
      const plan = await getPlanById(parsedPlanId);

      if (!plan) {
        console.error("Plan not found:", parsedPlanId);
        return NextResponse.json(
          {
            success: false,
            message: "Plan not found",
          },
          { status: 404 }
        );
      }

      // Calculate end date based on plan
      const endDate = new Date();
      if (planType === "monthly") {
        endDate.setDate(endDate.getDate() + 30);
      } else if (planType === "yearly") {
        endDate.setDate(endDate.getDate() + 365);
      }

      // Retrieve card information from payment intent if it's a valid Stripe payment intent
      let cardBrand = null;
      let lastFourDigit = null;
      if (paymentIntentId && !paymentIntentId.startsWith('apple_pay_')) {
        try {
          const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
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
      }

      // Create transaction record
      await prisma.transaction.create({
        data: {
          transaction_id: paymentIntentId,
          amount,
          customer_profile_id: customerEmail,
          user_id: userId,
          plan_id: parsedPlanId,
          cardBrand: cardBrand,
          lastFourDigit: lastFourDigit,
        },
      });

      // Check if user has an active subscription that's still valid
      const existingSubscription = await prisma.subscriptions.findFirst({
        where: {
          user_id: userId,
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
          console.log(
            `Added ${remainingDays} remaining days to new subscription for user:`,
            userId
          );
        }

        // Mark previous subscription as upgraded
        await prisma.subscriptions.update({
          where: { subscription_id: existingSubscription.subscription_id },
          data: {
            status: "upgraded",
            updated_at: new Date(),
          },
        });
        console.log(
          "Previous subscription marked as upgraded for user:",
          userId
        );
      }

      // Always create new subscription record
      await prisma.subscriptions.create({
        data: {
          user_id: userId,
          plan_id: parsedPlanId,
          start_date: new Date(),
          end_date: finalEndDate,
          amount_charged: amount,
          type:
            plan.name === "Monthly Access"
              ? "monthly"
              : plan.name === "Half-Year Access"
              ? "half-year"
              : "yearly",
          status: "active",
        },
      });
      console.log("New subscription created successfully for user:", userId);

      // sync the user's features based on the new plan
      await syncTheUserUsage({ userId, planId: parsedPlanId });
      console.log("Subscription processed successfully for user:", userId);
      return NextResponse.json(
        {
          success: true,
          message: `Subscription payment processed successfully for user ${userId}`,
        },
        { status: 200 }
      );
    }

    // If neither jobId nor planId is provided
    return NextResponse.json(
      {
        success: false,
        message: "Either jobId or planId must be provided in the payload",
      },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error processing payment:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to process payment",
      },
      { status: 500 }
    );
  }
}
