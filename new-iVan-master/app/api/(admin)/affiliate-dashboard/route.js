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

    const scopedAffiliateId = isAffiliate ? userId : null;
    const baseWhere = scopedAffiliateId ? { affiliateId: scopedAffiliateId } : { affiliateId: { not: null } };

    const [businessesCount, ordersCount, earnedAgg, pendingAgg, paidAgg, recentHistory] = await Promise.all([
      prisma.shops.count({ where: baseWhere }),
      prisma.product_orders.count({ where: baseWhere }),
      prisma.product_orders.aggregate({
        _sum: { affiliateCommissionAmount: true },
        where: {
          ...baseWhere,
          affiliateCommissionStatus: { in: ["pending", "paid"] },
        },
      }),
      prisma.product_orders.aggregate({
        _sum: { affiliateCommissionAmount: true },
        where: { ...baseWhere, affiliateCommissionStatus: "pending" },
      }),
      prisma.product_orders.aggregate({
        _sum: { affiliateCommissionAmount: true },
        where: { ...baseWhere, affiliateCommissionStatus: "paid" },
      }),
      prisma.product_orders.findMany({
        where: {
          ...baseWhere,
          affiliateCommissionAmount: { not: null },
        },
        select: {
          id: true,
          totalCartPrice: true,
          affiliateCommissionAmount: true,
          affiliateCommissionRate: true,
          affiliateCommissionStatus: true,
          affiliateCommissionPaidAt: true,
          createdAt: true,
          shop: { select: { id: true, name: true, type: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
    ]);

    return NextResponse.json(
      {
        summary: {
          totalBusinessesOnboarded: businessesCount,
          totalOrdersGenerated: ordersCount,
          totalCommissionEarned: Number(earnedAgg._sum.affiliateCommissionAmount || 0),
          totalCommissionPending: Number(pendingAgg._sum.affiliateCommissionAmount || 0),
          totalCommissionPaid: Number(paidAgg._sum.affiliateCommissionAmount || 0),
        },
        commissionHistory: recentHistory,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch affiliate dashboard stats" },
      { status: 500 }
    );
  }
};
