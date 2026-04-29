import prisma from "@/lib/prisma";
import { createJobPaymentSession } from "@/utils/paymentService";
import { NextResponse } from "next/server";
import { v4 as uuid } from "uuid";
import { getFileUrl } from "@/utils/helper";
import {
    calculateAffiliateCommission,
    calculateEffectiveAffiliateRate,
    getAffiliateCommissionConfig,
} from "@/utils/affiliateCommission";

export const POST = async (req) => {
    try {
        const userId = req.headers.get("user-id");
        const userRole = req.headers.get("role");

        if (userRole !== "visitor") {
            return NextResponse.json({ error: "Only visitors can checkout" }, { status: 403 });
        }

        const data = await req.json();
        const { 
            deliveryAddress, 
            deliveryCity, 
            deliveryPostCode,
            deliveryLat,
            deliveryLng,
            specialInstructions,
            deliveryPrice, 
            vanSize,
            calculatedDistance,
            addToOrder,
            sourceOrderId
        } = data;

        if (!deliveryAddress || !deliveryLat || !deliveryLng) {
            return NextResponse.json({ 
                error: "Missing required fields: deliveryAddress, deliveryLat, deliveryLng" 
            }, { status: 400 });
        }

        const cart = await prisma.cart.findFirst({
            where: { 
                userId: parseInt(userId),
                status: "active"
            },
            include: {
                cartItems: {
                    include: {
                        product: {
                            include: {
                                shop: true
                            }
                        },
                    }
                }
            }
        });

        if (!cart || cart.cartItems.length === 0) {
            return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
        }

        const cartItems = cart.cartItems;

        for (const item of cartItems) {
            if (item.product) {
                if (!item.product.isActive) {
                    return NextResponse.json({ 
                        error: `Product "${item.product.name}" is not available` 
                    }, { status: 400 });
                }

                const isRestaurant = item.product.shop?.type === "restaurant";
                let availableStock = item.product.stock;
                const sv = item.metadata?.selectedVariant;
                if (sv && item.product.variants?.items) {
                    const vi = item.product.variants.items.find(i => i.value === sv);
                    if (vi) availableStock = vi.stock;
                }
                if (!isRestaurant && availableStock < item.quantity) {
                    const variantLabel = sv ? ` (${sv})` : '';
                    return NextResponse.json({ 
                        error: `Insufficient stock for "${item.product.name}${variantLabel}". Available: ${availableStock}, Requested: ${item.quantity}` 
                    }, { status: 400 });
                }
            } else {
                return NextResponse.json({ 
                    error: "Invalid cart item found" 
                }, { status: 400 });
            }
        }

        const totalCartPrice = cartItems.reduce((sum, item) => {
            let price = item.product?.price;
            const sv = item.metadata?.selectedVariant;
            if (sv && item.product?.variants?.items) {
                const vi = item.product.variants.items.find(i => i.value === sv);
                if (vi) price = vi.salePrice ?? vi.price;
            }
            if (price) {
                return sum + (Number(price) * item.quantity);
            }
            return sum;
        }, 0);

        const isAddToOrderFlow = Boolean(addToOrder && sourceOrderId);
        const effectiveDeliveryPrice = isAddToOrderFlow ? 0 : (Number(deliveryPrice) || 0);
        const totalPrice = totalCartPrice + effectiveDeliveryPrice;
        
        console.log("Cart checkout debug:", {
            cartItems: cartItems.map(item => {
                const itemData = item.product;
                const price = itemData?.price;
                return {
                    name: itemData?.name,
                    price: price,
                    quantity: item.quantity,
                    subtotal: price ? Number(price) * item.quantity : 0
                };
            }),
            totalCartPrice,
            deliveryPrice: effectiveDeliveryPrice,
            totalPrice
        });

        if (isNaN(totalPrice) || totalPrice <= 0) {
            return NextResponse.json({ 
                error: "Invalid total price calculation" 
            }, { status: 400 });
        }
        
        const firstItem = cartItems[0];
        const shopId = firstItem?.product?.shopId || null;
        const firstItemData = firstItem?.product;
        const isProductOrder = !!firstItem?.product;
        
        let pickupAddress, pickupCity, pickupPostCode, pickupLat, pickupLng;
        if (isProductOrder) {
            pickupAddress = firstItem.product.pickupAddress || "Product Pickup Location";
            pickupCity = firstItem.product.pickupCity || "Pickup City";
            pickupPostCode = firstItem.product.pickupPostCode || "Pickup Postcode";
            pickupLat = firstItem.product.pickupLat || 0;
            pickupLng = firstItem.product.pickupLng || 0;
        } else {
            pickupAddress = "Pickup Location";
            pickupCity = "Pickup City";
            pickupPostCode = "Pickup Postcode";
            pickupLat = 0;
            pickupLng = 0;
        }
        
        const jobTitle = deliveryPostCode 
            ? `${deliveryPostCode} - ${cartItems.length} items`
            : `${isProductOrder ? 'Product' : 'Restaurant'} Delivery`;
        
        // Determine category based on shop type
        const firstShop = firstItem?.product?.shop;
        const isRestaurantOrder = firstShop?.type === "restaurant";
        const jobCategory = isRestaurantOrder ? "restaurant" : "shop";
        const affiliateIdFromShop = firstShop?.affiliateId || null;
        const commissionConfig = affiliateIdFromShop
            ? await getAffiliateCommissionConfig()
            : { platformCommissionPercent: 0, affiliateSharePercent: 0 };
        const affiliateCommissionPercent = calculateEffectiveAffiliateRate(
            commissionConfig.platformCommissionPercent,
            commissionConfig.affiliateSharePercent
        );
        const affiliateCommissionAmount = affiliateIdFromShop
            ? calculateAffiliateCommission(
                totalCartPrice,
                commissionConfig.platformCommissionPercent,
                commissionConfig.affiliateSharePercent
            )
            : 0;
        
        let orderId;
        let jobId;

        if (isAddToOrderFlow) {
            const sourceOrder = await prisma.product_orders.findFirst({
                where: {
                    id: sourceOrderId,
                    userId: parseInt(userId),
                    shopId: shopId,
                    createdAt: {
                        gte: new Date(Date.now() - 8 * 60 * 1000)
                    },
                    status: {
                        in: ["pending", "paid"]
                    },
                    deliveryStatus: {
                        notIn: ["delivered", "cancelled"]
                    }
                },
                select: {
                    id: true,
                    jobId: true,
                    notes: true,
                    cartId: true,
                    affiliateId: true,
                    affiliateCommissionRate: true
                }
            });

            if (!sourceOrder?.jobId || !sourceOrder?.cartId) {
                return NextResponse.json({
                    error: "Add-to-order window expired or source order is no longer available"
                }, { status: 400 });
            }

            orderId = sourceOrder.id;
            jobId = sourceOrder.jobId;
            const sourceCartId = sourceOrder.cartId;

            // Merge newly added cart items into the original order cart
            for (const item of cartItems) {
                const existingItem = await prisma.cart_items.findFirst({
                    where: {
                        cartId: sourceCartId,
                        productId: item.productId
                    },
                    select: {
                        id: true,
                        quantity: true
                    }
                });

                if (existingItem) {
                    await prisma.cart_items.update({
                        where: { id: existingItem.id },
                        data: {
                            quantity: {
                                increment: item.quantity
                            }
                        }
                    });
                } else {
                    await prisma.cart_items.create({
                        data: {
                            cartId: sourceCartId,
                            productId: item.productId,
                            quantity: item.quantity,
                            metadata: item.metadata || null
                        }
                    });
                }
            }

            const nextNotes = `${sourceOrder.notes || "Cart checkout"}\n\nAdd to order at ${new Date().toISOString()}${specialInstructions ? `\nSpecial Instructions: ${specialInstructions}` : ""}`;

            const addToOrderAffiliateId = sourceOrder.affiliateId || affiliateIdFromShop;
            const addToOrderCommissionRate = sourceOrder.affiliateCommissionRate
                ? Number(sourceOrder.affiliateCommissionRate)
                : affiliateCommissionPercent;
            const addToOrderCommissionAmount = addToOrderAffiliateId
                ? Number(((Number(totalCartPrice || 0) * addToOrderCommissionRate) / 100).toFixed(2))
                : 0;

            const orderUpdateData = {
                totalCartPrice: {
                    increment: totalCartPrice
                },
                deliveryAddress: deliveryAddress,
                deliveryCity: deliveryCity || null,
                deliveryPostCode: deliveryPostCode || null,
                deliveryLat: deliveryLat,
                deliveryLng: deliveryLng,
                notes: nextNotes
            };

            if (addToOrderAffiliateId) {
                orderUpdateData.affiliateId = addToOrderAffiliateId;
                orderUpdateData.affiliateCommissionRate = addToOrderCommissionRate;
                if (addToOrderCommissionAmount > 0) {
                    orderUpdateData.affiliateCommissionAmount = {
                        increment: addToOrderCommissionAmount
                    };
                    orderUpdateData.affiliateCommissionStatus = "pending";
                }
            }

            await prisma.product_orders.update({
                where: { id: orderId },
                data: orderUpdateData
            });

            await prisma.jobs.update({
                where: { id: jobId },
                data: {
                    title: jobTitle,
                    notes: `Delivery of ${cartItems.length} ${isProductOrder ? "products" : "menu items"} from cart (add-to-order)`,
                    vanSize: vanSize || null,
                    // Keep job price aligned with total charged amount after add-to-order.
                    price: {
                        increment: totalPrice
                    },
                    dropOffAddressLine1: deliveryAddress,
                    dropOffCity: deliveryCity || "Delivery City",
                    dropOffPostCode: deliveryPostCode || "Delivery Postcode",
                    dropOffLat: deliveryLat,
                    dropOffLng: deliveryLng
                }
            });
        } else {
            orderId = uuid();
            await prisma.product_orders.create({
                data: {
                    id: orderId,
                    cartId: cart.id,
                    shopId: shopId,
                    userId: parseInt(userId),
                    totalCartPrice: totalCartPrice,
                    deliveryPrice: effectiveDeliveryPrice,
                    status: "pending",
                    affiliateId: affiliateIdFromShop,
                    affiliateCommissionRate: affiliateIdFromShop ? affiliateCommissionPercent : null,
                    affiliateCommissionAmount: affiliateIdFromShop ? affiliateCommissionAmount : null,
                    affiliateCommissionStatus: affiliateCommissionAmount > 0 ? "pending" : null,
                    deliveryAddress: deliveryAddress,
                    deliveryCity: deliveryCity || null,
                    deliveryPostCode: deliveryPostCode || null,
                    deliveryLat: deliveryLat,
                    deliveryLng: deliveryLng,
                    notes: `Cart checkout${specialInstructions ? `\n\nSpecial Instructions: ${specialInstructions}` : ''}`
                }
            });

            jobId = uuid();
            await prisma.jobs.create({
                data: {
                    id: jobId,
                    title: jobTitle,
                    category: jobCategory,
                    notes: `Delivery of ${cartItems.length} ${isProductOrder ? 'products' : 'menu items'} from cart`,
                    status: "draft",
                    vanSize: vanSize || null,
                    // Persist full checkout total, not only delivery fee.
                    price: totalPrice,
                    distance: calculatedDistance || null,
                    pickupAddressLine1: pickupAddress,
                    pickupCity: pickupCity,
                    pickupPostCode: pickupPostCode,
                    pickupLat: pickupLat,
                    pickupLng: pickupLng,
                    dropOffAddressLine1: deliveryAddress,
                    dropOffCity: deliveryCity || "Delivery City",
                    dropOffPostCode: deliveryPostCode || "Delivery Postcode",
                    dropOffLat: deliveryLat,
                    dropOffLng: deliveryLng,
                    createdById: parseInt(userId),
                    isPickupASAP: true,
                    isDropOffASAP: true,
                    deliveryOrderId: orderId
                }
            });

            await prisma.product_orders.update({
                where: { id: orderId },
                data: { jobId: jobId }
            });
        }

        let billDescription = `Order - ${cartItems.length} items\n\n`;
        cartItems.forEach(item => {
            const itemData = item.product || item.menuItem;
            let price = itemData?.price;
            const sv = item.metadata?.selectedVariant;
            if (sv && itemData?.variants?.items) {
                const vi = itemData.variants.items.find(i => i.value === sv);
                if (vi) price = vi.salePrice ?? vi.price;
            }
            if (price) {
                const itemTotal = Number(price) * item.quantity;
                const variantSuffix = sv ? ` (${sv})` : '';
                billDescription += `${itemData.name}${variantSuffix} x${item.quantity} = $${itemTotal.toFixed(2)}\n`;
            }
        });
        billDescription += `\nSubtotal: $${Number(totalCartPrice).toFixed(2)}\n`;
        billDescription += `Delivery: $${Number(effectiveDeliveryPrice).toFixed(2)}\n`;
        billDescription += `Total: $${Number(totalPrice).toFixed(2)}`;

        const orderItems = cartItems.map(item => {
            const itemData = item.product || item.menuItem;
            let price = itemData?.price;
            const sv = item.metadata?.selectedVariant;
            if (sv && itemData?.variants?.items) {
                const vi = itemData.variants.items.find(i => i.value === sv);
                if (vi) price = vi.salePrice ?? vi.price;
            }
            return {
                name: sv ? `${itemData?.name || "Item"} (${sv})` : (itemData?.name || "Item"),
                price: price ? Number(price) : 0,
                quantity: item.quantity,
                image: itemData?.image ? getFileUrl(itemData.image) : null
            };
        });

        const paymentUrl = await createJobPaymentSession(
            jobId,
            totalPrice,
            billDescription,
            parseInt(userId),
            {
                orderId: orderId,
                jobId: jobId,
                userId: userId.toString(),
                type: "cart_checkout",
                addToOrder: isAddToOrderFlow ? "true" : "false",
                sourceOrderId: sourceOrderId || "",
                checkoutCartId: cart.id,
                cartPrice: totalCartPrice,
                deliveryPrice: effectiveDeliveryPrice,
                totalPrice: totalPrice
            },
            orderItems
        );

        if (paymentUrl) {
            await prisma.cart.update({
                where: { id: cart.id },
                data: { status: "ordered" }
            });

            await prisma.cart.create({
                data: {
                    userId: parseInt(userId),
                    status: "active"
                }
            });

            return NextResponse.json({
                success: true,
                orderId: orderId,
                jobId: jobId,
                cartId: cart.id,
                requiresPayment: true,
                paymentUrl,
                message: "Order created successfully. Please complete payment."
            });
        } else {
            return NextResponse.json({
                success: false,
                error: "Failed to create payment session"
            }, { status: 500 });
        }

    } catch (error) {
        console.error("Error during checkout:", error);
        return NextResponse.json({ 
            error: error.message || "Failed to process checkout" 
        }, { status: 500 });
    }
};
