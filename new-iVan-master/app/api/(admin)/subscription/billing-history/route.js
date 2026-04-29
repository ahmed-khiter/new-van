import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
export const dynamic = 'force-dynamic';

export const GET = async (req) => {
  try {
    // Get user ID from middleware
    const userId = parseInt(req.headers.get("user-id"));
    if (!userId) {
      return NextResponse.json({ error: "User ID is required in headers." }, { status: 400 });
    }

    // Fetch all transactions for the user
    const transactions = await prisma.transaction.findMany({
      where: {
        user_id: userId,
      },
      include: {
        plans: true,
      },
      orderBy: {
        date: 'desc'
      }
    });

    // Simple format - just return transaction data
    const billingHistory = transactions.map(transaction => ({
      transaction_id: transaction.transaction_id,
      date: transaction.date,
      plan_name: transaction.plans?.name || 'N/A',
      amount: transaction.amount,
      customer_profile_id: transaction.customer_profile_id
    }));

    return NextResponse.json({
      status: 200,
      billingHistory: billingHistory
    });

  } catch (error) {
    console.error("Error fetching billing history:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
};
