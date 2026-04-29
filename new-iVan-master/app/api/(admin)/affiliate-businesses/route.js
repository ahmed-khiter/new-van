import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export const GET = async (req) => {
  try {
    const role = req.headers.get("role");
    const userId = Number(req.headers.get("user-id"));
    const isAffiliate = role === "affiliate";
    const isAdmin = role === "admin" || role === "team-member";

    if (!isAffiliate && !isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const where = isAffiliate ? { affiliateId: userId } : { affiliateId: { not: null } };

    const businesses = await prisma.shops.findMany({
      where,
      select: {
        id: true,
        name: true,
        type: true,
        status: true,
        createdAt: true,
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        affiliate: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const businessIds = businesses.map((business) => business.id);
    const orderStats = businessIds.length
      ? await prisma.product_orders.groupBy({
          by: ["shopId"],
          where: {
            shopId: {
              in: businessIds,
            },
          },
          _count: {
            _all: true,
          },
          _sum: {
            affiliateCommissionAmount: true,
          },
        })
      : [];

    const orderStatsByShopId = new Map(
      orderStats.map((stat) => [stat.shopId, stat])
    );

    const normalized = businesses.map((business) => ({
      id: business.id,
      name: business.name,
      type: business.type,
      status: business.status,
      createdAt: business.createdAt,
      ownerName: `${business.createdBy?.firstName || ""} ${business.createdBy?.lastName || ""}`.trim(),
      ownerEmail: business.createdBy?.email || null,
      affiliateName: `${business.affiliate?.firstName || ""} ${business.affiliate?.lastName || ""}`.trim(),
      affiliateEmail: business.affiliate?.email || null,
      totalOrders: Number(orderStatsByShopId.get(business.id)?._count?._all || 0),
      totalCommission: Number(orderStatsByShopId.get(business.id)?._sum?.affiliateCommissionAmount || 0),
    }));

    return NextResponse.json({ businesses: normalized }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch affiliate businesses" },
      { status: 500 }
    );
  }
};
