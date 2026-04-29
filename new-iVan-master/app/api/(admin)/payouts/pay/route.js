import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import Stripe from "stripe";
import { v4 as uuid } from "uuid";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const dynamic = "force-dynamic";

export const POST = async (req) => {
  try {
    const { id, type, price } = await req.json();
    const role = req.headers.get("role");
    const isAdmin = role === "admin" || role === "team-member";
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (!id || !type) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    let entity = null;
    let recipientUserId = null;
    let payoutAlreadyProcessed = false;
    let sourceAmount = 0;
    let modelKey = null; // 'jobs' or 'product_orders'
    let statusField = null; // field to mark as paid
    let transactionType = "transfer";

    if (type === "job") {
      entity = await prisma.jobs.findUnique({
        where: { id },
        select: {
          id: true,
          price: true,
          providerPaymentStatus: true,
          acceptedById: true,
        },
      });

      if (!entity) {
        return NextResponse.json({ error: "Job not found" }, { status: 404 });
      }

      if (!entity.acceptedById) {
        return NextResponse.json({ error: "No provider linked to this job" }, { status: 400 });
      }

      recipientUserId = entity.acceptedById;
      payoutAlreadyProcessed = entity.providerPaymentStatus === "paid";
      sourceAmount = typeof entity.price === "number" ? entity.price : entity.price ? Number(entity.price) : 0;
      modelKey = "jobs";
      statusField = "providerPaymentStatus";
    } else if (type === "order") {
      // treat anything else as product order
      entity = await prisma.product_orders.findUnique({
        where: { id },
        select: {
          id: true,
          totalCartPrice: true,
          shopOwnerPaymentStatus: true,
          shop: {
            select: {
              createdById: true,
            },
          },
        },
      });

      if (!entity) {
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
      }

      if (!entity.shop?.createdById) {
        return NextResponse.json({ error: "No shop owner linked to this order" }, { status: 400 });
      }

      recipientUserId = entity.shop.createdById;
      payoutAlreadyProcessed = entity.shopOwnerPaymentStatus === "paid";
      sourceAmount = entity.totalCartPrice ? Number(entity.totalCartPrice) : 0;
      modelKey = "product_orders";
      statusField = "shopOwnerPaymentStatus";
    } else if (type === "affiliate") {
      entity = await prisma.product_orders.findUnique({
        where: { id },
        select: {
          id: true,
          affiliateId: true,
          affiliateCommissionAmount: true,
          affiliateCommissionStatus: true,
        },
      });

      if (!entity) {
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
      }

      if (!entity.affiliateId) {
        return NextResponse.json({ error: "No affiliate linked to this order" }, { status: 400 });
      }

      recipientUserId = entity.affiliateId;
      payoutAlreadyProcessed = entity.affiliateCommissionStatus === "paid";
      sourceAmount = entity.affiliateCommissionAmount ? Number(entity.affiliateCommissionAmount) : 0;
      modelKey = "product_orders";
      statusField = "affiliateCommissionStatus";
      transactionType = "affiliate_transfer";
    } else {
      return NextResponse.json({ error: "Unsupported payout type" }, { status: 400 });
    }

    if (payoutAlreadyProcessed) {
      return NextResponse.json({ error: "Payout already processed" }, { status: 400 });
    }

    const amountNumber =
      typeof price === "number"
        ? price
        : price
        ? Number(price)
        : sourceAmount
        ? Number(sourceAmount)
        : 0;

    if (!amountNumber || Number.isNaN(amountNumber) || amountNumber <= 0) {
      return NextResponse.json({ error: "Invalid payout amount" }, { status: 400 });
    }

    // Get Stripe Connect account for the recipient
    const stripeConnectAccount = await prisma.stripe_connect.findFirst({
      where: { userId: recipientUserId },
    });

    if (!stripeConnectAccount) {
      return NextResponse.json({ 
        error: "No bank account set up for this user. Please ask them to add a bank account for payouts." 
      }, { status: 400 });
    }

    if (stripeConnectAccount.accountStatus !== "active") {
      return NextResponse.json({ 
        error: "Bank account is not fully set up. Please complete the bank account setup first." 
      }, { status: 400 });
    }

    // Get recipient user details for transaction
    const recipientUser = await prisma.users.findUnique({
      where: { id: recipientUserId },
      select: { email: true },
    });

    // Generate unique transaction ID
    const transactionId = `payout_${uuid()}`;
    let stripeTransferId = null;

    // Create Stripe transfer to connected account
    try {
      const transfer = await stripe.transfers.create({
        amount: Math.round(amountNumber * 100), // Convert to cents
        currency: "USD",
        destination: stripeConnectAccount.accountId,
        metadata: {
          job_id: type === "job" ? entity.id : undefined,
            order_id: type === "order" || type === "affiliate" ? entity.id : undefined,
          user_id: recipientUserId.toString(),
          payout_type: type,
        },
      });
console.log(transfer);
      stripeTransferId = transfer.id;
    } catch (error) {
      console.error("Stripe transfer error:", error);
      return NextResponse.json(
        { error: `Failed to process Stripe transfer: ${error.message}` },
        { status: 500 }
      );
    }

    const amountDecimal = new Prisma.Decimal(amountNumber);

    // Create transaction record and update entity status in a single transaction
    await prisma.$transaction([
      // Create transaction record with type "transfer"
      prisma.transaction.create({
        data: {
          transaction_id: stripeTransferId,
          user_id: recipientUserId,
          amount: amountDecimal,
          customer_profile_id: recipientUser?.email || stripeConnectAccount.accountId,
          type: transactionType, // Payout/transfer type
          job_id: type === "job" ? entity.id : null,
          order_id: type === "order" || type === "affiliate" ? entity.id : null,
          plan_id: null,
        },
      }),
      // Update job/order payment status
      prisma[modelKey].update({
        where: { id: entity.id },
        data: {
          [statusField]: "paid",
          ...(type === "affiliate" ? { affiliateCommissionPaidAt: new Date() } : {}),
        },
      }),
    ]);

    return NextResponse.json({ 
      success: true,
      transactionId: stripeTransferId,
      transferId: stripeTransferId,
    }, { status: 200 });
  } catch (error) {
    console.error("Payout pay API Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process payout" },
      { status: 500 }
    );
  }
};

