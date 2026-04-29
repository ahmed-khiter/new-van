import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export const GET = async () => {
  try {
    let settings = await prisma.affiliate_settings.findFirst({
      orderBy: { id: "asc" },
      select: {
        id: true,
        platformCommissionPercentage: true,
        affiliateSharePercentage: true,
        updatedAt: true,
      },
    });

    if (!settings) {
      settings = await prisma.affiliate_settings.create({
        data: {
          platformCommissionPercentage: 15,
          affiliateSharePercentage: 10,
        },
        select: {
          id: true,
          platformCommissionPercentage: true,
          affiliateSharePercentage: true,
          updatedAt: true,
        },
      });
    }

    return NextResponse.json({ settings }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch affiliate settings" },
      { status: 500 }
    );
  }
};

export const PUT = async (req) => {
  try {
    const role = req.headers.get("role");
    if (role !== "admin" && role !== "team-member") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const platformCommissionPercentage = Number(body?.platformCommissionPercentage);
    const affiliateSharePercentage = Number(body?.affiliateSharePercentage);
    if (
      !Number.isFinite(platformCommissionPercentage) ||
      platformCommissionPercentage < 0 ||
      platformCommissionPercentage > 100
    ) {
      return NextResponse.json(
        { error: "Platform commission percentage must be between 0 and 100." },
        { status: 400 }
      );
    }
    if (
      !Number.isFinite(affiliateSharePercentage) ||
      affiliateSharePercentage < 0 ||
      affiliateSharePercentage > 100
    ) {
      return NextResponse.json(
        { error: "Affiliate share percentage must be between 0 and 100." },
        { status: 400 }
      );
    }

    const existing = await prisma.affiliate_settings.findFirst({
      orderBy: { id: "asc" },
      select: { id: true },
    });

    const settings = existing
      ? await prisma.affiliate_settings.update({
          where: { id: existing.id },
          data: { platformCommissionPercentage, affiliateSharePercentage },
          select: {
            id: true,
            platformCommissionPercentage: true,
            affiliateSharePercentage: true,
            updatedAt: true,
          },
        })
      : await prisma.affiliate_settings.create({
          data: { platformCommissionPercentage, affiliateSharePercentage },
          select: {
            id: true,
            platformCommissionPercentage: true,
            affiliateSharePercentage: true,
            updatedAt: true,
          },
        });

    return NextResponse.json(
      { message: "Commission percentage updated successfully.", settings },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Failed to update affiliate settings" },
      { status: 500 }
    );
  }
};
