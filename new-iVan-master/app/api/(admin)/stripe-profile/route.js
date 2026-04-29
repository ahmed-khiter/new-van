import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// ------------------- POST -------------------
export async function POST(request) {
  try {
    const { token, name } = await request.json();
    const userId = parseInt(request.headers.get("user-id"));

    if (!userId || !token) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing required parameters",
          data: null,
        },
        { status: 400 }
      );
    }

    const existingCards = await prisma.customer_profile.findMany({
      where: { userId },
    });

    let stripeCustomerId;

    if (existingCards.length === 0) {
      const stripeCustomer = await stripe.customers.create({
        name,
        email: request.headers.get("email"),
      });
      stripeCustomerId = stripeCustomer.id;
    } else {
      stripeCustomerId = existingCards[0].stripeCustomerId;
    }

    const paymentMethod = await stripe.paymentMethods.create({
      type: "card",
      card: { token },
    });

    await stripe.paymentMethods.attach(paymentMethod.id, {
      customer: stripeCustomerId,
    });

    const isDefaultCard = existingCards.length === 0;

    // If this is the first card, set it as default in Stripe
    if (isDefaultCard) {
      await stripe.customers.update(stripeCustomerId, {
        invoice_settings: {
          default_payment_method: paymentMethod.id,
        },
      });
    }
    console.log(paymentMethod , "paymentMethod");
    const profile = await prisma.customer_profile.create({
      data: {
        userId,
        stripeCustomerId,
        paymentMethodId: paymentMethod.id,
        lastFourDigit: paymentMethod.card.last4,
        cardBrand: paymentMethod.card.brand,
        default: isDefaultCard,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "New card added successfully",
        data: profile,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error.message,
        data: null,
      },
      { status: 500 }
    );
  }
}

// ------------------- GET -------------------
export async function GET(request) {
  try {
    const userId = parseInt(request.headers.get("user-id"));

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Missing user ID", data: null },
        { status: 400 }
      );
    }

    const profiles = await prisma.customer_profile.findMany({
      where: { userId },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Profiles fetched successfully",
        data: profiles,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error.message,
        data: null,
      },
      { status: 500 }
    );
  }
}

// ------------------- DELETE -------------------
export async function DELETE(request) {
  try {
    const { paymentMethodId } = await request.json();

    if (!paymentMethodId) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing required parameters",
          data: null,
        },
        { status: 400 }
      );
    }

    const profile = await prisma.customer_profile.findFirst({
      where: { paymentMethodId },
    });

    if (!profile) {
      return NextResponse.json(
        {
          success: false,
          message: "Profile not found",
          data: null,
        },
        { status: 404 }
      );
    }

    await stripe.paymentMethods.detach(paymentMethodId);

    await prisma.customer_profile.delete({
      where: { id: profile.id },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Profile deleted successfully",
        data: profile,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error.message,
        data: null,
      },
      { status: 500 }
    );
  }
}

// ------------------- PUT -------------------
export async function PUT(request) {
  try {
    const { paymentMethodId } = await request.json();
    const userId = parseInt(request.headers.get("user-id"));

    if (!paymentMethodId || !userId) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing required parameters",
          data: null,
        },
        { status: 400 }
      );
    }

    // Set all to false
    await prisma.customer_profile.updateMany({
      where: { userId },
      data: { default: false },
    });

    const profile = await prisma.customer_profile.findFirst({
      where: { paymentMethodId },
    });

    if (!profile) {
      return NextResponse.json(
        {
          success: false,
          message: "Profile not found",
          data: null,
        },
        { status: 404 }
      );
    }

    const updated = await prisma.customer_profile.update({
      where: { id: profile.id },
      data: { default: true },
    });

    // Update Stripe customer to set default payment method
    await stripe.customers.update(profile.stripeCustomerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Payment method set as default successfully",
        data: updated,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error.message,
        data: null,
      },
      { status: 500 }
    );
  }
}
