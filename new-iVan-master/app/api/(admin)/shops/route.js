import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getFileUrl } from "@/utils/helper";
import { sendEmail } from "@/lib/sendEmail";

export const dynamic = "force-dynamic";
export const GET = async (req) => {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const type = searchParams.get("type");
    const status = searchParams.get("status");
    const category = searchParams.get("category") || "";
    const cuisine = searchParams.get("cuisine") || "";
    const page = parseInt(searchParams.get("page")) || 1;
    const pageSize = parseInt(searchParams.get("pageSize")) || 20;
    const skip = (page - 1) * pageSize;
    let whereClause = {};

    // Only filter by type if explicitly provided
    if (type) {
      whereClause.type = type;
    }

    if (status) {
      whereClause.status = status;
    }

    if (search) {
      whereClause.OR = [
        { name: { contains: search } },
        { category: { contains: search } },
        { cuisine: { contains: search } },
      ];
    }

    if (category) {
      whereClause.category = category;
    }

    if (cuisine) {
      whereClause.cuisine = cuisine;
    }

    const shops = await prisma.shops.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        image: true,
        type: true,
        status: true,
        category: true,
        cuisine: true,
        rating: true,
        deliveryTime: true,
        minimumOrder: true,
        acceptsReservations: true,
        address1: true,
        city: true,
        postCode: true,
        latitude: true,
        longitude: true,
        createdAt: true,
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        _count: {
          select: {
            products: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: skip,
      take: pageSize,
    });

    // Convert image filenames to full URLs
    const shopsWithFullUrls = shops.map((shop) => ({
      ...shop,
      image: getFileUrl(shop.image),
    }));
    const totalShops = await prisma.shops.count({ where: whereClause });
    return NextResponse.json(
      {
        shops: shopsWithFullUrls,
        pagination: {
          page,
          pageSize,
          total: totalShops,
          totalPages: Math.ceil(totalShops / pageSize),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching shops:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch shops" },
      { status: 500 }
    );
  }
};

export const PATCH = async (req) => {
  try {
    const { shopId, status } = await req.json();

    if (!shopId || !status) {
      return NextResponse.json(
        { error: "Shop ID and status are required" },
        { status: 400 }
      );
    }

    if (!["inactive", "active"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be inactive or active" },
        { status: 400 }
      );
    }

    const existingShop = await prisma.shops.findUnique({
      where: { id: shopId },
      select: {
        id: true,
        name: true,
        type: true,
        status: true,
        createdBy: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!existingShop) {
      return NextResponse.json(
        { error: "Shop not found" },
        { status: 404 }
      );
    }

    const updatedShop = await prisma.shops.update({
      where: { id: shopId },
      data: { status },
      include: {
        createdBy: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        _count: {
          select: {
            products: true,
          },
        },
      },
    });

    if (status === "active" && existingShop.status !== "active" && existingShop.createdBy?.email) {
      const ownerName = `${existingShop.createdBy.firstName || ""} ${existingShop.createdBy.lastName || ""}`.trim() || "User";
      const isRestaurant = existingShop.type === "restaurant";
      const dashboardLink = `${process.env.NEXTAUTH_URL}${isRestaurant ? "/restaurant/dashboard" : "/shop/dashboard"}`;

      sendEmail({
        type: "businessAccountApproved",
        name: ownerName,
        email: existingShop.createdBy.email,
        subject: "Your Swipped account has been approved",
        accountType: isRestaurant ? "Restaurant Owner" : "Shop Owner",
        dashboardLink,
      }).catch((emailError) => {
        console.error("Failed to send shop/restaurant approval email:", emailError);
      });
    }

    return NextResponse.json(
      {
        message: `Shop ${status} successfully`,
        shop: updatedShop,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating shop status:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update shop status" },
      { status: 500 }
    );
  }
};
