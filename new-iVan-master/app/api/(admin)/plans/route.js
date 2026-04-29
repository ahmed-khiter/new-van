import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserRegionByCoordinates } from "../../../../utils/helper";

export async function GET(req) {
  const userId = req.headers.get("user-id");
  try {
    const user = await prisma.users.findUnique({
      where: { id: Number(userId) },
      select: { latitude: true, longitude: true },
    });
    const userRegion = getUserRegionByCoordinates(user.latitude, user.longitude);
    const plans = await prisma.plans.findMany({
      where: {
        plan_region: userRegion,
      },
      orderBy: { plan_id: "asc" },
    });
    const formateWithParseFloat = plans.map((plan) => ({
      ...plan,
      price: parseFloat(plan.price),
      currency: userRegion === 'GB' ? 'GBP' : userRegion === 'SA' ? 'SAR' : 'GBP',
    }));
    return NextResponse.json({
      success: true,
      message: `Plans fetched successfully for region: ${userRegion}`,
      data: formateWithParseFloat,
    });
  } catch (error) {
    console.error("Error fetching plans:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch plans",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
