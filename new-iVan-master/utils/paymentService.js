import Stripe from "stripe";
import prisma from "@/lib/prisma";
import { getPriceBreakdown } from "@/utils/pricingService";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * Creates a Stripe checkout session for job/product payment
 * @param {number} jobId - The job ID
 * @param {number} amount - The payment amount
 * @param {string} title - The job title or payment description
 * @param {number|string} userId - The user ID
 * @param {object} additionalMetadata - Additional metadata (no arrays/objects!)
 * @param {Array} orderItems - Structured cart items for checkout line_items
 * @returns {Promise<string>} - The checkout session URL
 */
export const createJobPaymentSession = async (
  jobId,
  amount,
  title,
  userId,
  additionalMetadata = {},
  orderItems = []
) => {
  try {
    const line_items = [];

    if (orderItems.length > 0) {
      // Add each cart item as a separate line item
      orderItems.forEach((item) => {
        line_items.push({
          price_data: {
            currency: "gbp",
            unit_amount: Math.round(Number(item.price) * 100),
            product_data: {
              name: `${item.name} x${item.quantity} items`,
              images: item.image ? [item.image] : [],
            },
          },
          quantity: Number(item.quantity) || 1, 
        });
      });
      // Add delivery/shipping line item if applicable
      if (additionalMetadata.deliveryPrice) {
        line_items.push({
          price_data: {
            currency: "gbp",
            unit_amount: Math.round(Number(additionalMetadata.deliveryPrice) * 100),
            product_data: { name: "Delivery / Shipping" },
          },
          quantity: 1,
        });
      }
    } else {
      // Default job-only payment - try to get detailed breakdown
      const job = await prisma.jobs.findUnique({
        where: { id: jobId },
        select: {
          category: true,
          distance: true,
          vanSize: true,
          howManyRooms: true,
          howManyItems: true,
        }
      });

      if (job && additionalMetadata.priceBreakdown !== false) {
        // Get detailed price breakdown
        const breakdown = await getPriceBreakdown(job.category, {
          distance: job.distance,
          vanSize: job.vanSize,
          howManyRooms: job.howManyRooms,
          howManyItems: job.howManyItems,
        });

        if (breakdown.lineItems.length > 0) {
          // Add each line item separately for detailed breakdown
          breakdown.lineItems.forEach((item) => {
            line_items.push({
              price_data: {
                currency: "gbp",
                unit_amount: Math.round(item.amount * 100),
                product_data: {
                  name: item.name,
                  description: item.description || `${job.category} Service`,
                },
              },
              quantity: 1,
            });
          });
        } else {
          // Fallback to single item if breakdown failed
          line_items.push({
            price_data: {
              currency: "gbp",
              unit_amount: Math.round(Number(amount) * 100),
              product_data: {
                name: additionalMetadata.orderId
                  ? "Product Payment"
                  : "Job Delivery Payment",
                description: title,
              },
            },
            quantity: 1,
          });
        }
      } else {
        // Default single item payment
        line_items.push({
          price_data: {
            currency: "gbp",
            unit_amount: Math.round(Number(amount) * 100),
            product_data: {
              name: additionalMetadata.orderId
                ? "Product Payment"
                : "Job Delivery Payment",
              description: title,
            },
          },
          quantity: 1,
        });
      }
    }

    // Metadata must be flat (no arrays/objects)
    const { orderItems: _omit, ...flatMetadata } = additionalMetadata;

    const sessionConfig = {
      mode: "payment",
      payment_method_types: ["card"],
      line_items,
      success_url: `${process.env.NEXTAUTH_URL}/customer/jobs?payment=success&jobId=${jobId}`,
      cancel_url: `${process.env.NEXTAUTH_URL}/customer/jobs?payment=cancelled&jobId=${jobId}`,
      metadata: {
        userId: String(userId),
        jobId: String(jobId),
        ...flatMetadata,
      },
      invoice_creation: { enabled: true },
      payment_intent_data: { description: title },
    };

    // Attach customer email if job creator exists
    const jobToPay = await prisma.jobs.findUnique({
      where: { id: jobId },
      select: { createdBy: { select: { email: true } } },
    });

    if (jobToPay?.createdBy?.email) {
      sessionConfig.customer_email = jobToPay.createdBy.email;
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);
    return session.url;
  } catch (error) {
    console.error("Error creating job payment session:", error);
    throw new Error(error.message || "Failed to create payment session");
  }
};
