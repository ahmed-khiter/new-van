import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export const GET = async (req, { params }) => {
    try {
        const userId = req.headers.get("user-id");
        const orderId = params.id;

        console.log("Fetching order:", { orderId, userId });

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
                                        price: true,
                                        variants: true
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
                        profilePicture: true
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
                        completedAt: true
                    }
                }
            }
        });

        console.log("Order found:", order ? "Yes" : "No");

        if (!order) {
            // Check if this order ID is referenced in the jobs table
            const jobWithOrder = await prisma.jobs.findFirst({
                where: {
                    deliveryOrderId: orderId
                },
                select: {
                    id: true,
                    deliveryOrderId: true
                }
            });
            console.log("Job with this deliveryOrderId:", jobWithOrder);
            
            return NextResponse.json(
                { 
                    error: "Order not found",
                    orderId: orderId,
                    message: "The order with this ID does not exist in the database.",
                    debug: {
                        jobExists: !!jobWithOrder,
                        jobId: jobWithOrder?.id
                    }
                },
                { status: 404 }
            );
        }

        // Verify the order belongs to the user
        if (order.userId !== parseInt(userId)) {
            console.log("User ID mismatch:", { orderUserId: order.userId, requestUserId: userId });
            return NextResponse.json(
                { error: "Unauthorized access to this order" },
                { status: 403 }
            );
        }

        // Get transaction for this order to include card information
        const transaction = await prisma.transaction.findFirst({
            where: { order_id: orderId },
            select: {
                cardBrand: true,
                lastFourDigit: true
            },
            orderBy: { date: 'desc' }
        });

        // Add transaction data to order
        const orderWithTransaction = {
            ...order,
            transaction: transaction || null
        };

        return NextResponse.json({
            success: true,
            order: orderWithTransaction
        }, { status: 200 });

    } catch (error) {
        console.error("Error fetching order:", error);
        return NextResponse.json(
            { error: error.message || "Failed to fetch order" },
            { status: 500 }
        );
    }
};

