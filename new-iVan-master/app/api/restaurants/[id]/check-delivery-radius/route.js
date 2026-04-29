import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { calculateDistance } from "@/utils/helper";

export const POST = async (req, { params }) => {
  try {
    const { id } = params;
    const { lat, lng } = await req.json();

    if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
      return NextResponse.json(
        { error: "Valid latitude and longitude are required" },
        { status: 400 }
      );
    }

    const restaurant = await prisma.shops.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        type: true,
        latitude: true,
        longitude: true,
        shop_metadata: true,
      },
    });

    if (!restaurant) {
      return NextResponse.json(
        { error: "Restaurant not found" },
        { status: 404 }
      );
    }

    if (restaurant.type !== "restaurant") {
      return NextResponse.json(
        { error: "This shop is not a restaurant" },
        { status: 400 }
      );
    }

    if (!restaurant.latitude || !restaurant.longitude) {
      return NextResponse.json(
        { error: "Restaurant location not available" },
        { status: 400 }
      );
    }

    const deliveryRadius =
      restaurant.shop_metadata?.deliveryRadius || 10;

    const distance = calculateDistance(
      parseFloat(lat),
      parseFloat(lng),
      parseFloat(restaurant.latitude),
      parseFloat(restaurant.longitude)
    );

    if (distance === null) {
      return NextResponse.json(
        { error: "Failed to calculate distance" },
        { status: 500 }
      );
    }

    const withinRadius = distance <= deliveryRadius;

    return NextResponse.json({
      withinRadius,
      distance: parseFloat(distance.toFixed(2)),
      deliveryRadius,
      message: withinRadius
        ? "Delivery is available to this location"
        : `This restaurant is not in your delivery radius. The restaurant is ${distance.toFixed(1)} miles away, but delivery is only available within ${deliveryRadius} miles.`,
    });
  } catch (error) {
    console.error("Error checking delivery radius:", error);
    return NextResponse.json(
      { error: "Failed to check delivery radius" },
      { status: 500 }
    );
  }
};

