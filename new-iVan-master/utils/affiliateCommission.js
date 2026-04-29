import prisma from "@/lib/prisma";

const DEFAULT_PLATFORM_COMMISSION_PERCENT = 15;
const DEFAULT_AFFILIATE_SHARE_PERCENT = 10;

export const getAffiliateCommissionConfig = async () => {
  try {
    const settings = await prisma.affiliate_settings.findFirst({
      orderBy: { id: "asc" },
      select: {
        platformCommissionPercentage: true,
        affiliateSharePercentage: true,
      },
    });

    const platformCommissionPercent = Number(settings?.platformCommissionPercentage);
    const affiliateSharePercent = Number(settings?.affiliateSharePercentage);

    return {
      platformCommissionPercent: Number.isFinite(platformCommissionPercent)
        ? platformCommissionPercent
        : DEFAULT_PLATFORM_COMMISSION_PERCENT,
      affiliateSharePercent: Number.isFinite(affiliateSharePercent)
        ? affiliateSharePercent
        : DEFAULT_AFFILIATE_SHARE_PERCENT,
    };
  } catch (error) {
    return {
      platformCommissionPercent: DEFAULT_PLATFORM_COMMISSION_PERCENT,
      affiliateSharePercent: DEFAULT_AFFILIATE_SHARE_PERCENT,
    };
  }
};

export const calculateAffiliateCommission = (
  orderAmount,
  platformCommissionPercent,
  affiliateSharePercent
) => {
  const amount = Number(orderAmount || 0);
  const platformPercent = Number(platformCommissionPercent || 0);
  const sharePercent = Number(affiliateSharePercent || 0);

  if (
    !Number.isFinite(amount) ||
    !Number.isFinite(platformPercent) ||
    !Number.isFinite(sharePercent) ||
    amount <= 0 ||
    platformPercent <= 0 ||
    sharePercent <= 0
  ) {
    return 0;
  }

  const platformCommissionAmount = (amount * platformPercent) / 100;
  return Number(((platformCommissionAmount * sharePercent) / 100).toFixed(2));
};

export const calculateEffectiveAffiliateRate = (platformCommissionPercent, affiliateSharePercent) => {
  const platformPercent = Number(platformCommissionPercent || 0);
  const sharePercent = Number(affiliateSharePercent || 0);
  if (!Number.isFinite(platformPercent) || !Number.isFinite(sharePercent)) {
    return 0;
  }
  return Number(((platformPercent * sharePercent) / 100).toFixed(2));
};
