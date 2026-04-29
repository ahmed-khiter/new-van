import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const GET = async () => {
  try {
    const plans = await prisma.plans.findMany({
      orderBy: {
        price: 'asc'
      }
    });

    return NextResponse.json({
      status: 200,
      plans
    });
  } catch (error) {
    console.error("Fetch Plans Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
};
