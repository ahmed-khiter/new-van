import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

const resolveShopWhereClause = (userId, role) => ({
  createdById: userId,
  ...(role === "restaurant" ? { type: "restaurant" } : { type: { not: "restaurant" } })
});

const hasValidOpeningHours = (shopMetadata) => {
  const openingHours = shopMetadata?.openingHours;
  if (!Array.isArray(openingHours) || openingHours.length === 0) return false;

  return openingHours.some((entry) => {
    if (!entry || typeof entry !== "object") return false;
    const open = typeof entry.open === "string" ? entry.open.trim() : "";
    const close = typeof entry.close === "string" ? entry.close.trim() : "";
    return Boolean(open && close);
  });
};

const buildStepStatus = ({ shop, hasStripeAccount, productCount }) => {
  const businessInfo = Boolean(
    shop?.name?.trim() &&
      shop?.address1?.trim() &&
      shop?.phone?.trim() &&
      shop?.image?.trim()
  );

  return {
    businessInfo,
    paymentDetails: Boolean(hasStripeAccount),
    openingHours: hasValidOpeningHours(shop?.shop_metadata),
    firstProduct: productCount > 0
  };
};

const mergeChecklistMetadata = (existingMetadata, latestSteps) => {
  const safeExisting = existingMetadata && typeof existingMetadata === "object" ? existingMetadata : {};
  const existingChecklist =
    safeExisting.activationChecklist && typeof safeExisting.activationChecklist === "object"
      ? safeExisting.activationChecklist
      : {};
  const existingSteps =
    existingChecklist.steps && typeof existingChecklist.steps === "object"
      ? existingChecklist.steps
      : {};

  const mergedSteps = { ...existingSteps };
  const now = new Date().toISOString();

  Object.entries(latestSteps).forEach(([key, isCompleted]) => {
    const previous = existingSteps[key] || {};
    const previouslyCompleted = Boolean(previous.completed);
    const completedAt =
      isCompleted && !previouslyCompleted ? now : previous.completedAt || (isCompleted ? now : null);

    mergedSteps[key] = {
      completed: Boolean(isCompleted),
      completedAt,
      updatedAt: now
    };
  });

  const completedCount = Object.values(mergedSteps).filter((step) => step?.completed).length;

  return {
    ...safeExisting,
    activationChecklist: {
      steps: mergedSteps,
      completedCount,
      totalCount: Object.keys(latestSteps).length,
      updatedAt: now
    }
  };
};

export const GET = async (request) => {
  try {
    const userIdHeader = request.headers.get("user-id");
    const role = request.headers.get("role");

    if (!userIdHeader || (role !== "shop-owner" && role !== "restaurant")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = Number(userIdHeader);
    const shop = await prisma.shops.findFirst({
      where: resolveShopWhereClause(userId, role),
      select: {
        id: true,
        name: true,
        image: true,
        phone: true,
        address1: true,
        shop_metadata: true
      }
    });

    if (!shop) {
      return NextResponse.json({ error: "Shop not found" }, { status: 404 });
    }

    const [stripeAccount, productCount] = await Promise.all([
      prisma.stripe_connect.findFirst({
        where: { userId },
        select: { id: true }
      }),
      prisma.products.count({
        where: { shopId: shop.id }
      })
    ]);

    const latestStepStatus = buildStepStatus({
      shop,
      hasStripeAccount: Boolean(stripeAccount),
      productCount
    });

    const mergedShopMetadata = mergeChecklistMetadata(shop.shop_metadata, latestStepStatus);

    await prisma.shops.update({
      where: { id: shop.id },
      data: { shop_metadata: mergedShopMetadata }
    });

    return NextResponse.json(
      {
        success: true,
        steps: latestStepStatus,
        checklist: mergedShopMetadata.activationChecklist
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error tracking activation progress:", error);
    return NextResponse.json(
      { error: "Failed to track activation progress" },
      { status: 500 }
    );
  }
};
