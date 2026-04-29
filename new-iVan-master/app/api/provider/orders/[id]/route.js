import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export const GET = async (req, { params }) => {
    try {
        const userId = req.headers.get("user-id");
        const orderId = params.id;

        console.log("Fetching provider order:", { orderId, userId });

        if (!userId) {
            return NextResponse.json(
                { error: "User ID is required" },
                { status: 401 }
            );
        }

        if (!orderId) {
            return NextResponse.json(
                { error: "Order ID is required" },
                { status: 400 }
            );
        }

        const order = await prisma.product_orders.findUnique({
            where: { id: orderId },
            include: {
                cart: {
                    include: {
                        cartItems: {
                            include: {
                                product: {
                                    select: {
                                        id: true,
                                        name: true,
                                        image: true,
                                        price: true
                                    }
                                }
                            }
                        }
                    }
                },
                shop: {
                    select: {
                        id: true,
                        name: true,
                        address1: true,
                        address2: true,
                        city: true,
                        postCode: true,
                        latitude: true,
                        longitude: true,
                        type: true
                    }
                },
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        phone: true
                    }
                },
                deliveryProvider: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        phone: true,
                        profilePicture: true,
                        latitude: true,
                        longitude: true
                    }
                },
                job: {
                    select: {
                        id: true,
                        status: true,
                        pickupLat: true,
                        pickupLng: true,
                        dropOffLat: true,
                        dropOffLng: true,
                        completedAt: true,
                        pickupAddressLine1: true,
                        pickupCity: true,
                        dropOffAddressLine1: true,
                        dropOffCity: true
                    }
                }
            }
        });

        console.log("Order found:", order ? "Yes" : "No");

        if (!order) {
            return NextResponse.json(
                { 
                    error: "Order not found",
                    orderId: orderId,
                    message: "The order with this ID does not exist in the database."
                },
                { status: 404 }
            );
        }

        // Verify the order belongs to the provider (deliveryProviderId matches)
        if (order.deliveryProviderId !== parseInt(userId)) {
            console.log("Provider ID mismatch:", { orderProviderId: order.deliveryProviderId, requestUserId: userId });
            return NextResponse.json(
                { error: "Unauthorized access to this order" },
                { status: 403 }
            );
        }

        return NextResponse.json({
            success: true,
            order: order
        }, { status: 200 });

    } catch (error) {
        console.error("Error fetching provider order:", error);
        return NextResponse.json(
            { error: error.message || "Failed to fetch order" },
            { status: 500 }
        );
    }
};

