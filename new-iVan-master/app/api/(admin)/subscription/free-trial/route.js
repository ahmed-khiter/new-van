import prisma from "@/lib/prisma";
import { getPlanById } from "@/utils/subscriptionService";
import { NextResponse } from "next/server";
import { syncTheUserUsage } from "../../../../../utils/subscriptionService";

export async function POST(req) {
  try {
    const userId = parseInt(req.headers.get("user-id"));
    const payload = await req.json();
    const planId = payload.planId;

    if (!userId || isNaN(userId)) {
      return NextResponse.json(
        { success: false, message: "Invalid user ID" },
        { status: 400 }
      );
    }

    if (!planId) {
      return NextResponse.json(
        { success: false, message: "Plan ID is required" },
        { status: 400 }
      );
    }

    const parsedPlanId = parseInt(planId);
    if (isNaN(parsedPlanId)) {
      return NextResponse.json(
        { success: false, message: "Invalid Plan ID" },
        { status: 400 }
      );
    }

    // Check if plan exists
    const plan = await getPlanById(parsedPlanId);
    if (!plan) {
      return NextResponse.json(
        { success: false, message: "Plan not found" },
        { status: 404 }
      );
    }

    // Check if user has already used a free trial for this plan type
    const existingSubscription = await prisma.subscriptions.findFirst({
      where: {
        user_id: userId,
      },
    });

    if (existingSubscription) {
      return NextResponse.json(
        {
          success: false,
          message: "Free trial available for new users only.",
        },
        { status: 403 }
      );
    }

    // Calculate trial end date
    const startDate = new Date();
    const trialDays = plan.trial_days || 30;
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + trialDays);

    // Create subscription record
    const subscription = await prisma.subscriptions.create({
      data: {
        user_id: userId,
        plan_id: parsedPlanId,
        start_date: startDate,
        end_date: endDate,
        amount_charged: 0.0,
        type: "free_trial",
        status: "active",
      },
    });
    await syncTheUserUsage({ userId, planId: parsedPlanId });

    console.log(
      `Free trial activated for user ${userId} on plan ${parsedPlanId}`
    );

    return NextResponse.json(
      {
        success: true,
        message: `Free trial activated successfully for user ${userId}`,
        data: subscription,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error processing free trial:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to process free trial",
      },
      { status: 500 }
    );
  }
}
