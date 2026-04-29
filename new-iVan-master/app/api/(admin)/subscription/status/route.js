import { NextResponse } from "next/server";
import { getSubscriptionStatus, shouldEncourageUpgrade } from "@/utils/subscriptionService";
export const dynamic = 'force-dynamic';
export const GET = async (req) => {
  try {
    const userId = req.headers.get("user-id");
    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required in headers." },
        { status: 400 }
      );
    }

    // Use the subscription service to get status with proper validation
    const { subscription } = await getSubscriptionStatus(Number(userId));

    // Check if upgrade should be encouraged
    const isEncourage = await shouldEncourageUpgrade(subscription);

    return NextResponse.json({
      status: 200,
      subscription,
      isEncourage
    });
  } catch (error) {
    console.error("Fetch Subscription Status Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
};
