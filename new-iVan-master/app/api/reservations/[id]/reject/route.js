import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import Stripe from "stripe";
import { sendEmail } from "@/lib/sendEmail";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Reject a reservation and refund deposit
export const POST = async (req, { params }) => {
  try {
    const userId = req.headers.get("user-id");
    const role = req.headers.get("role");
    const { id } = params;

    // Check if user is a service provider (has shop-owner or restaurant role)
    const isServiceProvider = role === "restaurant" || role === "shop-owner" || role === "provider";
    
    if (!userId || !isServiceProvider) {
      return NextResponse.json(
        { error: "Unauthorized. Only service providers can reject reservations." },
        { status: 403 }
      );
    }

    // Get the reservation and verify ownership
    const reservation = await prisma.reservations.findUnique({
      where: { id },
      include: {
        restaurant: {
          select: {
            id: true,
            createdById: true,
            name: true
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

    // Refund the deposit if payment was made
    let refundId = null;
    if (reservation.depositPaid && reservation.paymentIntentId && !reservation.depositRefunded) {
      try {
        // Retrieve the payment intent to get the charge ID
        const paymentIntent = await stripe.paymentIntents.retrieve(reservation.paymentIntentId);
        
        if (paymentIntent.status === "succeeded" && paymentIntent.latest_charge) {
          // Create refund
          const refund = await stripe.refunds.create({
            charge: paymentIntent.latest_charge,
            amount: Math.round(Number(reservation.depositAmount) * 100), // Convert to pence
            reason: "requested_by_customer",
            metadata: {
              reservationId: reservation.id,
              reason: "restaurant_rejected"
            }
          });

          refundId = refund.id;
        }
      } catch (refundError) {
        console.error("Error processing refund:", refundError);
        // Continue with rejection even if refund fails - can be handled manually
      }
    }

    // Update reservation status
    const updatedReservation = await prisma.reservations.update({
      where: { id },
      data: {
        status: "rejected",
        rejectedAt: new Date(),
        depositRefunded: refundId ? true : false,
        refundId: refundId || null
      },
      include: {
        restaurant: {
          select: {
            name: true
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

    // Send rejection email to customer
    try {
      const customerName = `${reservation.customer.firstName}${reservation.customer.lastName ? ` ${reservation.customer.lastName}` : ''}`;
      
      await sendEmail({
        type: "reservationRejected",
        email: reservation.customerEmail,
        subject: `Reservation Update - ${reservation.restaurant.name}`,
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
      console.error("Failed to send rejection email:", emailError);
      // Don't fail the update if email fails
    }

    return NextResponse.json({
      success: true,
      reservation: updatedReservation,
      refundId,
      message: "Reservation rejected and deposit refunded (if applicable)."
    }, { status: 200 });

  } catch (error) {
    console.error("Error rejecting reservation:", error);
    return NextResponse.json(
      { error: error.message || "Failed to reject reservation" },
      { status: 500 }
    );
  }
};

