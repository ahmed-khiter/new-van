import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";

export const GET = async (req) => {
  try {
    const { searchParams } = new URL(req.url);
    const statusParams = searchParams.get("status") || "pending";
    const typeParam = searchParams.get("type");
    const role = req.headers.get("role");
    const userId = parseInt(req.headers.get("user-id"));
    const page = parseInt(searchParams.get("page")) || 1;
    const pageSize = parseInt(searchParams.get("pageSize")) || 20;
    const skip = (page - 1) * pageSize;

    const isProvider = role === "provider";
    const isShopOwner = role === "shop-owner";
    const isAffiliate = role === "affiliate";
    const isAdmin = role === "admin" || role === "team-member";
    console.log("Payout API called with:", { statusParams, role, userId, page, pageSize });
    // initialize arrays
    let providerPayouts = [];
    let shopOwnerPayouts = [];
    let affiliatePayouts = [];

    // ========== PROVIDER PAYOUTS ==========
    const includeJobPayouts = !typeParam || typeParam === "job";
    const includeOrderPayouts = !typeParam || typeParam === "order";

    if ((isAdmin || isProvider) && includeJobPayouts) {
      providerPayouts = await prisma.jobs.findMany({
        where: {
          providerPaymentStatus: statusParams,
          ...(isProvider ? { acceptedById: userId } : {}),
        },
        select: {
          id: true,
          title: true,
          price: true,
          completedAt: true,
          acceptedBy: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { completedAt: "desc" },
      });

      // normalize provider payouts
      providerPayouts = providerPayouts.map((p) => ({
        id: p.id,
        title: p.title,
        price: p.price,
        completedAt: p.completedAt,
        payTo: `${p.acceptedBy?.firstName || ""} ${
          p.acceptedBy?.lastName || ""
        }`.trim(),
        type: "job",
      }));
    }
    
    // ========== SHOP OWNER PAYOUTS ==========
    if ((isAdmin || isShopOwner) && includeOrderPayouts) {
      shopOwnerPayouts = await prisma.product_orders.findMany({
        where: {
          shopOwnerPaymentStatus: statusParams,
          ...(isShopOwner
            ? {
                shop: {
                  createdById: userId,
                },
              }
            : {}),
        },
        select: {
          id: true,
          totalCartPrice: true,
          job: {
            select: {
              title: true,
              category: true,
              completedAt: true,
            },
          },
          shop: {
            select: {
              createdBy: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
        orderBy: { id: "desc" },
      });

      // normalize shop owner payouts
      shopOwnerPayouts = shopOwnerPayouts.map((p) => ({
        id: p.id,
        title: p.job?.title || "N/A",
        price: Number(p.totalCartPrice),
        completedAt: p.job?.completedAt,
        payTo: `${p.shop?.createdBy?.firstName || ""} ${
          p.shop?.createdBy?.lastName || ""
        }`.trim(),
        type: "order",
      }));
    }

    // ========== AFFILIATE PAYOUTS ==========
    const includeAffiliatePayouts = !typeParam || typeParam === "affiliate";
    if ((isAdmin || isAffiliate) && includeAffiliatePayouts) {
      affiliatePayouts = await prisma.product_orders.findMany({
        where: {
          affiliateCommissionStatus: statusParams,
          affiliateId: isAffiliate ? userId : undefined,
        },
        select: {
          id: true,
          affiliateCommissionAmount: true,
          affiliateCommissionPaidAt: true,
          createdAt: true,
          affiliate: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
          shop: {
            select: {
              name: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      affiliatePayouts = affiliatePayouts.map((p) => ({
        id: p.id,
        title: p.shop?.name ? `Commission from ${p.shop.name}` : "Affiliate Commission",
        price: Number(p.affiliateCommissionAmount || 0),
        completedAt: p.affiliateCommissionPaidAt || p.createdAt,
        payTo: `${p.affiliate?.firstName || ""} ${p.affiliate?.lastName || ""}`.trim(),
        type: "affiliate",
      }));
    }

    // ========== MERGE + SORT + PAGINATE ==========
    let allPayouts = [...providerPayouts, ...shopOwnerPayouts, ...affiliatePayouts];

    // sort newest first (by completedAt or fallback to id)
    allPayouts.sort(
      (a, b) => new Date(b.completedAt || 0) - new Date(a.completedAt || 0)
    );

    // pagination
    const paginated = allPayouts.slice(skip, skip + pageSize);

    let pendingJobPayoutTotal = { _sum: { price: 0 } };
    let completedJobPayoutTotal = { _sum: { price: 0 } };
    if (isAdmin || isProvider) {
      // ========== TOTAL SUMS ==========
      pendingJobPayoutTotal = await prisma.jobs.aggregate({
        _sum: { price: true },
        where: {
          providerPaymentStatus: "pending",
          ...(isProvider ? { acceptedById: userId } : {}),
        },
      });

      completedJobPayoutTotal = await prisma.jobs.aggregate({
        _sum: { price: true },
        where: {
          providerPaymentStatus: "paid",
          ...(isProvider ? { acceptedById: userId } : {}),
        },
      });
    }
    let pendingOrderPayoutTotal = { _sum: { totalCartPrice: 0 } };
    let completedOrderPayoutTotal = { _sum: { totalCartPrice: 0 } };
    let pendingAffiliatePayoutTotal = { _sum: { affiliateCommissionAmount: 0 } };
    let completedAffiliatePayoutTotal = { _sum: { affiliateCommissionAmount: 0 } };

    if (isAdmin || isShopOwner) {
      pendingOrderPayoutTotal = await prisma.product_orders.aggregate({
        _sum: { totalCartPrice: true },
        where: {
          shopOwnerPaymentStatus: "pending",
          ...(isShopOwner
            ? {
                shop: {
                  createdById: userId,
                },
              }
            : {}),
        },
      });

      completedOrderPayoutTotal = await prisma.product_orders.aggregate({
        _sum: { totalCartPrice: true },
        where: {
          shopOwnerPaymentStatus: "paid",
          ...(isShopOwner
            ? {
                shop: {
                  createdById: userId,
                },
              }
            : {}),
        },
      });
    }
    if (isAdmin || isAffiliate) {
      pendingAffiliatePayoutTotal = await prisma.product_orders.aggregate({
        _sum: { affiliateCommissionAmount: true },
        where: {
          affiliateCommissionStatus: "pending",
          affiliateId: isAffiliate ? userId : undefined,
        },
      });

      completedAffiliatePayoutTotal = await prisma.product_orders.aggregate({
        _sum: { affiliateCommissionAmount: true },
        where: {
          affiliateCommissionStatus: "paid",
          affiliateId: isAffiliate ? userId : undefined,
        },
      });
    }

    // Helper function to safely format totals
    const safeNum = (v) => (v && !isNaN(v) ? parseFloat(v) : 0);

    const pendingTotalPayout =
      safeNum(pendingJobPayoutTotal._sum.price) +
      safeNum(pendingOrderPayoutTotal._sum.totalCartPrice) +
      safeNum(pendingAffiliatePayoutTotal._sum.affiliateCommissionAmount);
    const completedTotalPayout =
      safeNum(completedJobPayoutTotal._sum.price) +
      safeNum(completedOrderPayoutTotal._sum.totalCartPrice) +
      safeNum(completedAffiliatePayoutTotal._sum.affiliateCommissionAmount);

    // ========== RESPONSE ==========
    return NextResponse.json(
      {
        pagination: {
          page,
          pageSize,
          total: allPayouts.length,
          totalPages: Math.ceil(allPayouts.length / pageSize),
        },
        payouts: paginated,
        pendingTotalPayout: pendingTotalPayout.toFixed(2),
        completedTotalPayout: completedTotalPayout.toFixed(2),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Payout API Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch payouts" },
      { status: 500 }
    );
  }
};
