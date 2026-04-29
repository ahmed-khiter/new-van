import prisma from "@/lib/prisma";
import { createJobPaymentSession } from "@/utils/paymentService";
import { NextResponse } from "next/server";
import { v4 as uuid } from "uuid";

export const POST = async (req) => {
    try {
        const userId = req.headers.get("user-id");
        const userRole = req.headers.get("role");

        if (userRole !== "visitor") {
            return NextResponse.json({ error: "Only visitors can purchase products" }, { status: 403 });
        }

        const data = await req.json();
        const { 
            productId, 
            quantity,
            deliveryAddress, 
            deliveryCity, 
            deliveryPostCode,
            deliveryLat,
            deliveryLng,
            specialInstructions,
            deliveryPrice , 
            calculatedDistance
        } = data;

        // Validate required fields
        if (!productId || !quantity || !deliveryAddress || !deliveryLat || !deliveryLng) {
            return NextResponse.json({ 
                error: "Missing required fields: productId, quantity, deliveryAddress, deliveryLat, deliveryLng" 
            }, { status: 400 });
        }

        // Coordinates come from frontend - no geocoding needed

        // Get product details
        const product = await prisma.products.findUnique({
            where: { id: productId },
            include: {
                shop: {
                    select: {
                        type: true
                    }
                }
            }
        });

        if (!product) {
            return NextResponse.json({ error: "Product not found" }, { status: 404 });
        }

        if (!product.isActive) {
            return NextResponse.json({ error: "Product is not available" }, { status: 400 });
        }

        const isRestaurant = product.shop?.type === "restaurant";
        if (!isRestaurant) {
            if (product.stock <= 0) {
                return NextResponse.json({ error: "Product is out of stock" }, { status: 400 });
            }

            if (product.stock < quantity) {
                return NextResponse.json({ 
                    error: `Insufficient stock. Available: ${product.stock}, Requested: ${quantity}` 
                }, { status: 400 });
            }
        }

        // Calculate prices in backend
        const totalProductPrice = Number(product.price) * parseInt(quantity);
        const totalPrice = totalProductPrice + (deliveryPrice || 0);

        // Create product order
        const orderId = uuid();
        const order = await prisma.product_orders.create({
            data: {
                id: orderId,
                productId: productId,
                userId: parseInt(userId),
                quantity: parseInt(quantity),
                totalProductPrice: totalProductPrice,
                deliveryPrice: deliveryPrice,
                status: "pending",
                deliveryAddress: deliveryAddress,
                deliveryCity: deliveryCity || null,
                deliveryPostCode: deliveryPostCode || null,
                deliveryLat: deliveryLat,
                deliveryLng: deliveryLng,
                notes: `Product purchase: ${product.name}${specialInstructions ? `\n\nSpecial Instructions: ${specialInstructions}` : ''}`
            }
        });

        // Create delivery job with category based on shop type
        const jobId = uuid();
        const jobCategory = isRestaurant ? "restaurant" : "shop";
        
        const job = await prisma.jobs.create({
            data: {
                id: jobId,
                title: `Delivery: ${product.name}`,
                category: jobCategory,
                notes: `Product delivery: ${product.name}`,
                status: "draft", // Will be activated after payment
                price: parseFloat(deliveryPrice),
                distance: calculatedDistance,
                pickupAddressLine1: product.pickupAddress || "",
                pickupCity: product.pickupCity || "",
                pickupPostCode: product.pickupPostCode || "",
                pickupLat: product.pickupLat,
                pickupLng: product.pickupLng,
                dropOffAddressLine1: deliveryAddress,
                dropOffCity: deliveryCity || "",
                dropOffPostCode: deliveryPostCode || "",
                dropOffLat: deliveryLat,
                dropOffLng: deliveryLng,
                pickupDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
                dropOffDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // Day after tomorrow
                isPickupTimeFlexible: true,
                isDropOffTimeFlexible: true,
                vanSize: "Medium", // Default for product delivery
                movingItem: product.name,
                createdById: parseInt(userId),
                deliveryOrderId: orderId
            }
        });

        // Update order with job ID
        await prisma.product_orders.update({
            where: { id: orderId },
            data: { jobId: jobId }
        });

        // Create payment session with combined description and metadata
        try {
            const paymentDescription = `Product: ${product.name} (£${Number(totalProductPrice).toFixed(2)}) + Delivery (£${Number(deliveryPrice).toFixed(2)})`;
            const paymentUrl = await createJobPaymentSession(
                jobId,
                parseFloat(totalPrice),
                paymentDescription,
                userId,
                {
                    orderId: orderId,
                    jobPrice: parseFloat(deliveryPrice),
                    productPrice: parseFloat(totalProductPrice),
                    totalPrice: parseFloat(totalPrice)
                }
            );

            // Payment session ID is now stored in transaction table via webhook

            return NextResponse.json({
                order: order,
                job: job,
                paymentUrl: paymentUrl,
                requiresPayment: true
            }, { status: 201 });

        } catch (paymentError) {
            console.error("Error creating payment session:", paymentError);
            
            // If payment session creation fails, return order without payment URL
            return NextResponse.json({
                order: order,
                job: job,
                error: "Payment session creation failed, but order was created"
            }, { status: 201 });
        }

    } catch (error) {
        console.error('Error creating product purchase:', error);
        return NextResponse.json({ error: "Failed to create product purchase" }, { status: 500 });
    }
};
