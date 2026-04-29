import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendEmail } from "@/lib/sendEmail";

// Create a new reservation
export const POST = async (req) => {
  try {
    const userId = req.headers.get("user-id");
    const role = req.headers.get("role");
    
    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required in headers." },
        { status: 400 }
      );
    }

    const {
      restaurantId,
      numberOfGuests,
      reservationDate,
      reservationTime,
      customerName,
      customerPhone,
      customerEmail,
      notes,
      selectedService,
      servicePrice,
      serviceDuration
    } = await req.json();

    // Validation
    if (!restaurantId || !numberOfGuests || !reservationDate || !reservationTime || 
        !customerName || !customerPhone || !customerEmail) {
      return NextResponse.json(
        { error: "All required fields must be provided." },
        { status: 400 }
      );
    }

    // Verify service/restaurant exists and accepts reservations
    const restaurant = await prisma.shops.findUnique({
      where: { id: restaurantId },
      include: { createdBy: { select: { email: true, firstName: true, lastName: true } } }
    });

    if (!restaurant) {
      return NextResponse.json(
        { error: "Service not found." },
        { status: 404 }
      );
    }

    // Support all service types that accept reservations: restaurant, mot, shisha, spa, beauty, healthcare, events, entertainment
    const validServiceTypes = ["restaurant", "mot", "shisha", "spa", "beauty", "healthcare", "events", "entertainment"];
    if (!validServiceTypes.includes(restaurant.type)) {
      return NextResponse.json(
        { error: "This service type does not support reservations." },
        { status: 400 }
      );
    }

    if (!restaurant.acceptsReservations) {
      return NextResponse.json(
        { error: "This service does not accept reservations." },
        { status: 400 }
      );
    }

    // Build notes with service information if provided
    let reservationNotes = notes || "";
    if (selectedService || servicePrice || serviceDuration) {
      const serviceInfo = {
        service: selectedService || null,
        price: servicePrice || null,
        duration: serviceDuration || null
      };
      const serviceInfoText = `\n\nService Details:\n- Service: ${serviceInfo.service || 'N/A'}\n- Price: ${serviceInfo.price ? `£${serviceInfo.price}` : 'N/A'}\n- Duration: ${serviceInfo.duration || 'N/A'}`;
      reservationNotes = reservationNotes ? reservationNotes + serviceInfoText : serviceInfoText.trim();
    }

    // Calculate deposit amount based on service price if available
    const depositAmount = servicePrice ? parseFloat((servicePrice * 0.1).toFixed(2)) : 0.00; // 10% deposit or 0

    // Create reservation
    const reservation = await prisma.reservations.create({
      data: {
        restaurantId,
        customerId: Number(userId),
        numberOfGuests,
        reservationDate: new Date(reservationDate),
        reservationTime,
        customerName,
        customerPhone,
        customerEmail,
        depositAmount: depositAmount,
        depositPaid: false,
        paymentIntentId: null,
        notes: reservationNotes || null,
        status: "pending"
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

    // Send confirmation email to customer
    try {
      await sendEmail({
        type: "reservationConfirmation",
        email: customerEmail,
        subject: `Reservation Confirmation - ${restaurant.name}`,
        customerName,
        restaurantName: restaurant.name,
        reservationDate: reservation.reservationDate,
        reservationTime,
        numberOfGuests,
        reservationId: reservation.id
      });
    } catch (emailError) {
      console.error("Failed to send confirmation email:", emailError);
      // Don't fail the reservation if email fails
    }

    return NextResponse.json({
      success: true,
      reservation,
      message: "Reservation created successfully. Please check your email for confirmation."
    }, { status: 201 });

  } catch (error) {
    console.error("Error creating reservation:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create reservation" },
      { status: 500 }
    );
  }
};

// Get reservations (for customer or restaurant)
export const GET = async (req) => {
  try {
    const userId = req.headers.get("user-id");
    const role = req.headers.get("role");
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const type = searchParams.get("type"); // "customer" or "restaurant"

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required in headers." },
        { status: 400 }
      );
    }

    let whereClause = {};

    // Support all service types that accept reservations: restaurant, mot, shisha, spa, beauty, healthcare, events, entertainment
    const serviceTypes = ["restaurant", "mot", "shisha", "spa", "beauty", "healthcare", "events", "entertainment"];
    
    if (type && serviceTypes.includes(type)) {
      // Get service's shop (restaurant, mot, shisha, spa, beauty, healthcare, events, or entertainment)
      const service = await prisma.shops.findFirst({
        where: {
          createdById: Number(userId),
          type: type
        }
      });

      if (!service) {
        return NextResponse.json(
          { error: `${type.charAt(0).toUpperCase() + type.slice(1)} not found.` },
          { status: 404 }
        );
      }

      whereClause.restaurantId = service.id; // Note: still using restaurantId field for now
    } else if (type === "restaurant" || role === "restaurant") {
      // Legacy support for restaurant
      const restaurant = await prisma.shops.findFirst({
        where: {
          createdById: Number(userId),
          type: "restaurant"
        }
      });

      if (!restaurant) {
        return NextResponse.json(
          { error: "Restaurant not found." },
          { status: 404 }
        );
      }

      whereClause.restaurantId = restaurant.id;
    } else {
      // Customer's reservations
      whereClause.customerId = Number(userId);
    }

    if (status) {
      whereClause.status = status;
    }

    const reservations = await prisma.reservations.findMany({
      where: whereClause,
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
            country: true,
            phone: true,
            type: true
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
      },
      orderBy: {
        reservationDate: "desc"
      }
    });

    // Calculate stats based on all reservations (not filtered by status)
    let statsWhereClause = {};
    
    if (type && serviceTypes.includes(type)) {
      // Get service's shop
      const service = await prisma.shops.findFirst({
        where: {
          createdById: Number(userId),
          type: type
        }
      });

      if (service) {
        statsWhereClause.restaurantId = service.id;
      }
    } else if (type === "restaurant" || role === "restaurant") {
      // Legacy support for restaurant
      const restaurant = await prisma.shops.findFirst({
        where: {
          createdById: Number(userId),
          type: "restaurant"
        }
      });

      if (restaurant) {
        statsWhereClause.restaurantId = restaurant.id;
      }
    } else {
      // Customer's reservations
      statsWhereClause.customerId = Number(userId);
    }

    const allReservations = await prisma.reservations.findMany({
      where: statsWhereClause,
      select: {
        status: true
      }
    });

    const stats = {
      totalReservations: allReservations.length,
      pendingReservations: allReservations.filter(r => r.status === "pending").length,
      acceptedReservations: allReservations.filter(r => r.status === "accepted").length,
      rejectedReservations: allReservations.filter(r => r.status === "rejected").length,
      completedReservations: allReservations.filter(r => r.status === "completed").length,
      cancelledReservations: allReservations.filter(r => r.status === "cancelled").length
    };

    return NextResponse.json({
      success: true,
      reservations,
      stats
    }, { status: 200 });

  } catch (error) {
    console.error("Error fetching reservations:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch reservations" },
      { status: 500 }
    );
  }
};

