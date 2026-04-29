import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Get a single reservation
export const GET = async (req, { params }) => {
  try {
    const userId = req.headers.get("user-id");
    const role = req.headers.get("role");
    const { id } = params;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required in headers." },
        { status: 400 }
      );
    }

    const reservation = await prisma.reservations.findUnique({
      where: { id },
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
            image: true,
            address1: true,
            address2: true,
            city: true,
            postCode: true,
            phone: true,
            cuisine: true,
            rating: true
          }
        },
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true
          }
        }
      }
    });

    if (!reservation) {
      return NextResponse.json(
        { error: "Reservation not found." },
        { status: 404 }
      );
    }

    // Check authorization
    if (role === "restaurant") {
      const restaurant = await prisma.shops.findFirst({
        where: {
          createdById: Number(userId),
          type: "restaurant"
        }
      });

      if (!restaurant || reservation.restaurantId !== restaurant.id) {
        return NextResponse.json(
          { error: "Unauthorized access to reservation" },
          { status: 403 }
        );
      }
    } else if (reservation.customerId !== Number(userId)) {
      return NextResponse.json(
        { error: "Unauthorized access to reservation" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      reservation
    }, { status: 200 });

  } catch (error) {
    console.error("Error fetching reservation:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch reservation" },
      { status: 500 }
    );
  }
};

