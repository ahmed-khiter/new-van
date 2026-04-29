import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { uploadFileToS3 } from "@/utils/s3Helper";
import { geocodePostcode } from "@/utils/geocode";

export const GET = async (req) => {
  try {
    const userId = req.headers.get("user-id");
    const role = req.headers.get("role");
    if (!userId || (role !== "shop-owner" && role !== "restaurant")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const shopType = role === "restaurant" ? "restaurant" : "shop";
    const shop = await prisma.shops.findFirst({
      where: { 
        createdById: Number(userId),
        type: shopType
      }
    });

    const owner = await prisma.users.findUnique({
      where: { id: Number(userId) },
      select: { id: true, firstName: true, lastName: true, email: true, preferredLocale: true },
    });

    return NextResponse.json({ shop, owner }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch shop" }, { status: 500 });
  }
};

export const PATCH = async (req) => {
  try {
    const userId = req.headers.get("user-id");
    const role = req.headers.get("role");
    if (!userId || (role !== "shop-owner" && role !== "restaurant")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const firstName = formData.get("firstName");
    const lastName = formData.get("lastName");
    const preferredLocale = formData.get("preferredLocale");
    const shopName = formData.get("shopName") || formData.get("restaurantName");
    const address1 = formData.get("shopAddress") || formData.get("restaurantAddress");
    const address2 = formData.get("shopAddress2") || formData.get("restaurantAddress2");
    const city = formData.get("shopCity") || formData.get("restaurantCity");
    const postCode = formData.get("shopPostCode") || formData.get("restaurantPostCode");
    const imageFile = formData.get("image");
    const latStr = formData.get("shopLat") || formData.get("restaurantLat");
    const lngStr = formData.get("shopLng") || formData.get("restaurantLng");
    const shopMetadataStr = formData.get("shop_metadata");
    // Restaurant-specific fields
    const phone = formData.get("phone");
    const country = formData.get("country");
    const category = formData.get("category");
    const cuisine = formData.get("cuisine");
    const deliveryTime = formData.get("deliveryTime");
    const minimumOrder = formData.get("minimumOrder");
    const acceptsReservations = formData.get("acceptsReservations");

    const shopType = role === "restaurant" ? "restaurant" : "shop";
    const existing = await prisma.shops.findFirst({
      where: { 
        createdById: Number(userId),
        type: shopType
      },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Shop not found" }, { status: 404 });
    }

    let imageFileName = undefined; // undefined means do not change
    if (imageFile && imageFile.size > 0) {
      imageFileName = await uploadFileToS3(imageFile);
    }

    // Build updates
    const shopUpdate = {};
    if (shopName !== null && shopName !== undefined) shopUpdate.name = shopName;
    if (imageFileName !== undefined) shopUpdate.image = imageFileName;
    if (address1 !== null && address1 !== undefined) shopUpdate.address1 = address1;
    if (address2 !== null && address2 !== undefined) shopUpdate.address2 = address2;
    if (city !== null && city !== undefined) shopUpdate.city = city;
    if (postCode !== null && postCode !== undefined) shopUpdate.postCode = postCode;
    if (phone !== null && phone !== undefined) shopUpdate.phone = phone;
    if (country !== null && country !== undefined) shopUpdate.country = country;
    if (category !== null && category !== undefined) shopUpdate.category = category;

    // Restaurant-specific fields
    if (role === "restaurant") {
      if (cuisine !== null && cuisine !== undefined) shopUpdate.cuisine = cuisine;
      if (deliveryTime !== null && deliveryTime !== undefined) shopUpdate.deliveryTime = deliveryTime;
      if (minimumOrder !== null && minimumOrder !== undefined) {
        shopUpdate.minimumOrder = minimumOrder.trim() === "" ? null : parseFloat(minimumOrder);
      }
      if (acceptsReservations !== null && acceptsReservations !== undefined) {
        shopUpdate.acceptsReservations = acceptsReservations === 'true' || acceptsReservations === true;
      }
    }

    // If frontend sent coords, use them directly; else geocode as fallback
    if (latStr && lngStr) {
        shopUpdate.latitude = parseFloat(latStr);
        shopUpdate.longitude = parseFloat(lngStr);
    }

    if (shopMetadataStr !== null && shopMetadataStr !== undefined) {
      try {
        const parsedMetadata = JSON.parse(shopMetadataStr);
        shopUpdate.shop_metadata = parsedMetadata;
      } catch (e) {
        console.error("Error parsing shop_metadata:", e);
      }
    }

    // Update in a transaction to keep user/shop consistent
    const result = await prisma.$transaction(async (tx) => {
      if (firstName || lastName || preferredLocale) {
        await tx.users.update({
          where: { id: Number(userId) },
          data: {
            ...(firstName ? { firstName } : {}),
            ...(lastName ? { lastName } : {}),
            ...(preferredLocale ? { preferredLocale } : {}),
          },
        });
      }

      const updatedShop = await tx.shops.update({
        where: { id: existing.id },
        data: shopUpdate,
      });

      const updatedOwner = await tx.users.findUnique({
        where: { id: Number(userId) },
        select: { id: true, firstName: true, lastName: true, email: true, preferredLocale: true },
      });

      return { updatedShop, updatedOwner };
    });

    return NextResponse.json({ shop: result.updatedShop, owner: result.updatedOwner }, { status: 200 });
  } catch (error) {
    console.error("Update shop error", error);
    return NextResponse.json({ error: "Failed to update shop" }, { status: 500 });
  }
};


