import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import Stripe from "stripe";
import { sendEmail } from "@/lib/sendEmail";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Cancel a reservation (customer cancels)
export const POST = async (req, { params }) => {
  try {
    const userId = req.headers.get("user-id");
    const role = req.headers.get("role");
    const { id } = params;

    if (!userId || role !== "visitor") {
      return NextResponse.json(
        { error: "Unauthorized. Only customers can cancel their reservations." },
        { status: 403 }
      );
    }

    const reservation = await prisma.reservations.findUnique({
      where: { id },
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
            createdById: true,
            address1: true,
            address2: true,
            city: true,
            postCode: true,
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

    // Verify customer owns this reservation
    if (reservation.customerId !== Number(userId)) {
      return NextResponse.json(
        { error: "Unauthorized. You can only cancel your own reservations." },
        { status: 403 }
      );
    }

    // Check if reservation can be cancelled
    if (reservation.status === "cancelled") {
      return NextResponse.json(
        { error: "Reservation is already cancelled." },
        { status: 400 }
      );
    }

    if (reservation.status === "completed") {
      return NextResponse.json(
        { error: "Cannot cancel a completed reservation." },
        { status: 400 }
      );
    }

    // Get restaurant owner details for email
    const restaurantOwner = await prisma.users.findUnique({
      where: { id: reservation.restaurant.createdById },
      select: {
        firstName: true,
        lastName: true,
        email: true
      }
    });

    // Refund the deposit if payment was made
    let refundId = null;
    if (reservation.depositPaid && reservation.paymentIntentId && !reservation.depositRefunded) {
      try {
        const paymentIntent = await stripe.paymentIntents.retrieve(reservation.paymentIntentId);
        
        if (paymentIntent.status === "succeeded" && paymentIntent.latest_charge) {
          const refund = await stripe.refunds.create({
            charge: paymentIntent.latest_charge,
            amount: Math.round(Number(reservation.depositAmount) * 100),
            reason: "requested_by_customer",
            metadata: {
              reservationId: reservation.id,
              reason: "customer_cancelled"
            }
          });

          refundId = refund.id;
        }
      } catch (refundError) {
        console.error("Error processing refund:", refundError);
        // Continue with cancellation even if refund fails
      }
    }

    // Update reservation status
    const updatedReservation = await prisma.reservations.update({
      where: { id },
      data: {
        status: "cancelled",
        cancelledAt: new Date(),
        depositRefunded: refundId ? true : false,
        refundId: refundId || null
      }
    });

    // Prepare restaurant address
    const restaurantAddress = [
      reservation.restaurant.address1,
      reservation.restaurant.address2,
      reservation.restaurant.city,
      reservation.restaurant.postCode
    ].filter(Boolean).join(", ");

    // Send cancellation email to customer
    try {
      const customerName = `${reservation.customer.firstName}${reservation.customer.lastName ? ` ${reservation.customer.lastName}` : ''}`;
      
      await sendEmail({
        type: "reservationCancelledCustomer",
        email: reservation.customerEmail,
        subject: `Reservation Cancelled - ${reservation.restaurant.name}`,
        customerName,
        restaurantName: reservation.restaurant.name,
        reservationDate: reservation.reservationDate,
        reservationTime: reservation.reservationTime,
        numberOfGuests: reservation.numberOfGuests,
        reservationId: reservation.id,
        depositAmount: reservation.depositAmount,
        refundId: refundId
      });
    } catch (emailError) {
      console.error("Failed to send cancellation email to customer:", emailError);
    }

    // Send cancellation email to restaurant
    if (restaurantOwner) {
      try {
        const restaurantOwnerName = `${restaurantOwner.firstName}${restaurantOwner.lastName ? ` ${restaurantOwner.lastName}` : ''}`;
        const customerName = `${reservation.customer.firstName}${reservation.customer.lastName ? ` ${reservation.customer.lastName}` : ''}`;
        
        await sendEmail({
          type: "reservationCancelledRestaurant",
          email: restaurantOwner.email,
          subject: `Reservation Cancelled - ${customerName}`,
          restaurantOwnerName,
          customerName,
          restaurantName: reservation.restaurant.name,
          reservationDate: reservation.reservationDate,
          reservationTime: reservation.reservationTime,
          numberOfGuests: reservation.numberOfGuests,
          reservationId: reservation.id
        });
      } catch (emailError) {
        console.error("Failed to send cancellation email to restaurant:", emailError);
      }
    }

    return NextResponse.json({
      success: true,
      reservation: updatedReservation,
      refundId,
      message: "Reservation cancelled successfully."
    }, { status: 200 });

  } catch (error) {
    console.error("Error cancelling reservation:", error);
    return NextResponse.json(
      { error: error.message || "Failed to cancel reservation" },
      { status: 500 }
    );
  }
};

