import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const POST = async (req) => {
  try {
    const { subscriptionId } = await req.json();
    const userId = req.headers.get("user-id");
    
    if (!subscriptionId) {
      return NextResponse.json(
        { error: "Subscription ID is required." },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required." },
        { status: 400 }
      );
    }

    // Verify the subscription belongs to the user and is active
    const subscription = await prisma.subscriptions.findFirst({
      where: {
        subscription_id: parseInt(subscriptionId),
        user_id: parseInt(userId),
        status: "active"
      }
    });

    if (!subscription) {
      return NextResponse.json(
        { error: "Active subscription not found or not authorized." },
        { status: 404 }
      );
    }

    // Mark subscription as cancelled
    await prisma.subscriptions.update({
      where: { subscription_id: parseInt(subscriptionId) },
      data: {
        status: "cancelled",
        updated_at: new Date()
      }
    });

    console.log(`Subscription ${subscriptionId} cancelled for user ${userId}`);

    return NextResponse.json({
      status: 200,
      message: "Subscription cancelled successfully"
    });
  } catch (error) {
    console.error("Cancel Subscription Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
};
