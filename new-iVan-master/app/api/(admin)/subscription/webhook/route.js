// app/api/stripe-webhook/route.js
import prisma from "@/lib/prisma";
import { getPlanById } from "@/utils/subscriptionService";
import { notifyProvidersAboutJob } from "@/utils/jobService";
import { handleJobPostedAndPaidEmailSending } from "@/utils/jobPostedAndPaidEmailService";
import { handleShopOrderPaymentEmailSending } from "@/utils/shopOrderPaymentEmailService";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { syncTheUserUsage } from "../../../../../utils/subscriptionService";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req) {
  // Get the raw body as a buffer
  const rawBody = await req.text();

  // Use headers() to read the signature
  const headerList = headers();
  const stripeSignature = headerList.get("stripe-signature");

  if (!stripeSignature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      stripeSignature,
      endpointSecret
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  //  Handle the event
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    const userId = parseInt(session.metadata.userId);
    const paymentIntentId = session.payment_intent;
    const amount = session.amount_total / 100;

    try {
      // Check if this is a job payment (has jobId in metadata)
      const jobId = session.metadata.jobId;
      const orderId = session.metadata.orderId;

      if (jobId) {
        // Update job status to active
        const updatedJob = await prisma.jobs.update({
          where: { id: jobId },
          data: { status: "active" },
        });

        if (!orderId) {
          // Send notifications to providers about the new active job if there is no orderId
          try {
            const notificationResult = await notifyProvidersAboutJob(
              updatedJob
            );
            console.log(
              `Job notification result for paid job ${jobId}:`,
              notificationResult
            );
          } catch (error) {
            console.error(
              "Error sending job notifications for paid job:",
              error
            );
            // Don't fail the payment processing if email sending fails
          }
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
          const checkoutCartId = session.metadata?.checkoutCartId;
          // Get the order details
          const order = await prisma.product_orders.findUnique({
            where: { id: orderId },
          });

          if (order) {
            // Update order status and deliveryStatus to ready_to_dispatch
            await prisma.product_orders.update({
              where: { id: orderId },
              data: {
                status: "paid",
                deliveryStatus: "ready_to_dispatch",
              },
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
              // Decrement stock for the items that were part of this checkout payment
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
            }
          }
        }

        // Retrieve card information from payment intent
        let cardBrand = null;
        let lastFourDigit = null;
        if (paymentIntentId) {
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
          customer_profile_id:
            session.customer_details?.email || "stripe_customer",
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
        return NextResponse.json({
          success: true,
          type: orderId ? "product_purchase" : "job_payment",
        });
      }

      // Handle subscription payment (existing logic)
      const planId = parseInt(session.metadata.planId);
      const planType = session.metadata.planType;
      if (!planId) {
        console.error("Plan ID not found in payment metadata");
        return NextResponse.json(
          { error: "Plan ID not found" },
          { status: 400 }
        );
      }

      // Get the plan details using subscription service
      const plan = await getPlanById(planId);

      if (!plan) {
        console.error("Plan not found:", planId);
        return NextResponse.json({ error: "Plan not found" }, { status: 404 });
      }

      // Calculate end date based on plan type
      const endDate = new Date();
      if (planType === "monthly") {
        endDate.setDate(endDate.getDate() + 30);
      } else if (planType === "yearly") {
        endDate.setDate(endDate.getDate() + 365);
      }

      // Retrieve card information from payment intent
      let cardBrand = null;
      let lastFourDigit = null;
      if (paymentIntentId) {
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
          customer_profile_id:
            session.customer_details?.email || "stripe_customer",
          user_id: userId,
          plan_id: planId,
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
          plan_id: planId,
          start_date: new Date(),
          end_date: finalEndDate,
          amount_charged: amount,
          type: planType,
          status: "active",
        },
      });
      // sync the user's features based on the new plan
      await syncTheUserUsage({ userId, planId });
      console.log("Subscription processed successfully for user:", userId);
    } catch (err) {
      console.error("Error saving transaction from webhook:", err);
    }
  }

  return NextResponse.json({ received: true });
}
