import { NextResponse } from "next/server";
import Stripe from "stripe";
import prisma from "@/lib/prisma";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function GET(req) {
  try {
    const userId = parseInt(req.headers.get("user-id"));

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Missing user-id header" },
        { status: 400 }
      );
    }

    // Check existing connect account in database
    const existing = await prisma.stripe_connect.findFirst({
      where: { userId },
    });

    if (!existing) {
      return NextResponse.json(
        {
          success: true,
          hasAccount: false,
          accountStatus: null,
        },
        { status: 200 }
      );
    }

    // Fetch account status from Stripe
    try {
      const account = await stripe.accounts.retrieve(existing.accountId);
      const accountStatus = account.details_submitted ? "active" : "pending";

      // Update account status in database
      await prisma.stripe_connect.update({
        where: { id: existing.id },
        data: { accountStatus },
      });

      return NextResponse.json(
        {
          success: true,
          hasAccount: true,
          accountStatus,
          accountId: existing.accountId,
        },
        { status: 200 }
      );
    } catch (stripeError) {
      console.error("Error fetching Stripe account:", stripeError);
      return NextResponse.json(
        {
          success: true,
          hasAccount: true,
          accountStatus: existing.accountStatus || "unknown",
          accountId: existing.accountId,
        },
        { status: 200 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const userId = parseInt(req.headers.get("user-id"));
    const email = req.headers.get("email");

    if (!userId || !email) {
      return NextResponse.json(
        { success: false, message: "Missing user-id or email header" },
        { status: 400 }
      );
    }

    // 1. Check existing connect account in database
    let existing = await prisma.stripe_connect.findFirst({
      where: { userId },
    });
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    const isAffiliate = user?.role === "affiliate";
    const returnPath = isAffiliate ? "/wallet" : "/provider/settings?payments=true";

    let accountId;

    // 2. Create Stripe Express account if not exists
    if (!existing) {
      const account = await stripe.accounts.create({
        type: "express",
        email,
        capabilities: {
          transfers: { requested: true },
        },
      });

      accountId = account.id;

      await prisma.stripe_connect.create({
        data: { 
          userId, 
          accountId,
          accountStatus: account.details_submitted ? "active" : "pending",
        },
      });
    } else {
      accountId = existing.accountId;
    }

    // 3. Update account status if account already exists
    if (existing) {
      try {
        const account = await stripe.accounts.retrieve(accountId);
        const accountStatus = account.details_submitted ? "active" : "pending";
        await prisma.stripe_connect.update({
          where: { id: existing.id },
          data: { accountStatus },
        });
      } catch (error) {
        console.error("Error updating account status:", error);
      }
    }

    // 4. Create onboarding link
    const link = await stripe.accountLinks.create({
      account: accountId,
      type: existing && existing.accountStatus === "active" ? "account_update" : "account_onboarding",
      refresh_url: `${process.env.NEXTAUTH_URL}${returnPath}`,
      return_url: `${process.env.NEXTAUTH_URL}${returnPath}`,
    });

    return NextResponse.json(
      {
        success: true,
        accountId,
        onboardingUrl: link.url,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
