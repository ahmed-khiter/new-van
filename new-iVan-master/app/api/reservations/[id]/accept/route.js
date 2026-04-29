import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendEmail } from "@/lib/sendEmail";

// Accept a reservation
export const POST = async (req, { params }) => {
  try {
    const userId = req.headers.get("user-id");
    const role = req.headers.get("role");
    const { id } = params;

    // Check if user is a service provider (has shop-owner or restaurant role)
    const isServiceProvider = role === "restaurant" || role === "shop-owner" || role === "provider";
    
    if (!userId || !isServiceProvider) {
      return NextResponse.json(
        { error: "Unauthorized. Only service providers can accept reservations." },
        { status: 403 }
      );
    }

    // Get the service (restaurant, mot, shisha, spa, beauty, healthcare, events, or entertainment)
    // First try to find the reservation and get the service type
    const reservation = await prisma.reservations.findUnique({
      where: { id },
      include: {
        restaurant: {
          select: {
            id: true,
            type: true,
            name: true,
            createdById: true,
            address1: true,
            city: true,
            phone: true
          }
        },
        customer: {
          select: {
            firstName: true,
            lastName: true,
            email: true
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

    // Verify the service owner
    if (reservation.restaurant.createdById !== Number(userId)) {
      return NextResponse.json(
        { error: "Unauthorized access to reservation" },
        { status: 403 }
      );
    }

    if (reservation.status !== "pending") {
      return NextResponse.json(
        { error: `Reservation is already ${reservation.status}.` },
        { status: 400 }
      );
    }

    // Update reservation status
    const updatedReservation = await prisma.reservations.update({
      where: { id },
      data: {
        status: "accepted",
        acceptedAt: new Date()
      },
      include: {
        restaurant: {
          select: {
            name: true,
            address1: true,
            city: true,
            phone: true
          }
        },
        customer: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    // Send acceptance email to customer
    try {
      const customerName = `${reservation.customer.firstName}${reservation.customer.lastName ? ` ${reservation.customer.lastName}` : ''}`;
      const restaurantAddress = reservation.restaurant.address1 
        ? `${reservation.restaurant.address1}${reservation.restaurant.city ? `, ${reservation.restaurant.city}` : ''}`
        : null;

      await sendEmail({
        type: "reservationAccepted",
        email: reservation.customerEmail,
        subject: `Reservation Confirmed - ${reservation.restaurant.name}`,
        customerName,
        restaurantName: reservation.restaurant.name,
        reservationDate: reservation.reservationDate,
        reservationTime: reservation.reservationTime,
        numberOfGuests: reservation.numberOfGuests,
        reservationId: reservation.id,
        restaurantAddress,
        restaurantPhone: reservation.restaurant.phone
      });
    } catch (emailError) {
      console.error("Failed to send acceptance email:", emailError);
      // Don't fail the update if email fails
    }

    return NextResponse.json({
      success: true,
      reservation: updatedReservation,
      message: "Reservation accepted successfully."
    }, { status: 200 });

  } catch (error) {
    console.error("Error accepting reservation:", error);
    return NextResponse.json(
      { error: error.message || "Failed to accept reservation" },
      { status: 500 }
    );
  }
};

