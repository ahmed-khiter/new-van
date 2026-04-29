import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';
export const GET = async (request) => {
  try {
    const userId = request.headers.get("user-id");
    const role = request.headers.get("role");
    if (!userId || (role !== "shop-owner" && role !== "restaurant")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const parsedUserId = Number(userId);
    const shopType = role === "restaurant" ? "restaurant" : "shop";

    // Get shop/restaurant for the user
    const shop = await prisma.shops.findFirst({
      where: { 
        createdById: parsedUserId,
        type: shopType
      },
      select: { id: true }
    });

    const shopId = shop?.id;

    const [totalProducts, totalOrders] = await Promise.all([
      prisma.products.count({ 
        where: { 
          createdById: parsedUserId,
          ...(shopId && { shopId })
        } 
      }),
      prisma.product_orders.count({ 
        where: { 
          ...(shopId && { shopId })
        }
      })
    ]);

    return NextResponse.json(
      { stats: { totalProducts, totalOrders } },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching shop-owner dashboard stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard stats" },
      { status: 500 }
    );
  }
};


