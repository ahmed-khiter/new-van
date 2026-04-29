import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { isShopClosed } from "@/utils/helper";

export const GET = async (req) => {
    try {
        const userId = req.headers.get("user-id");
        const userRole = req.headers.get("role");

        if (!userId) {
            return NextResponse.json({ error: "User ID is required" }, { status: 401 });
        }

        if (userRole !== "visitor") {
            return NextResponse.json({ error: "Only visitors can access cart" }, { status: 403 });
        }

        let cart = await prisma.cart.findFirst({
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
                        }
                    },
                    orderBy: { createdAt: 'desc' }
                }
            }
        });

        if (!cart) {
            cart = await prisma.cart.create({
                data: {
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
                            }
                        },
                        orderBy: { createdAt: 'desc' }
                    }
                }
            });
        }

        const totalPrice = cart.cartItems.reduce((sum, item) => {
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

        return NextResponse.json({
            cart: cart,
            cartItems: cart.cartItems,
            totalPrice,
            itemCount: cart.cartItems.length
        });

    } catch (error) {
        console.error("Error fetching cart:", error);
        return NextResponse.json({ error: error.message || "Failed to fetch cart" }, { status: 500 });
    }
};

export const POST = async (req) => {
    try {
        const userId = req.headers.get("user-id");
        const userRole = req.headers.get("role");
        const { productId, quantity = 1, action = "add", selectedVariant = null } = await req.json();

        if (!userId) {
            return NextResponse.json({ error: "User ID is required" }, { status: 401 });
        }

        if (userRole !== "visitor") {
            return NextResponse.json({ error: "Only visitors can add to cart" }, { status: 403 });
        }

        if (!productId) {
            return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
        }

        const product = await prisma.products.findUnique({
            where: { id: productId },
            include: {
                shop: {
                    select: {
                        type: true,
                        shop_metadata: true
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

        if (action !== "decrement" && isShopClosed(product.shop?.shop_metadata?.openingHours)) {
            return NextResponse.json({ error: "shop_closed" }, { status: 400 });
        }

        const isRestaurant = product.shop?.type === "restaurant";
        let effectiveStock = product.stock;
        if (product.variants?.enabled && product.variants?.items?.length > 0) {
            if (selectedVariant) {
                const vi = product.variants.items.find(i => i.value === selectedVariant);
                if (vi) effectiveStock = vi.stock;
            } else {
                effectiveStock = product.variants.items.reduce((sum, i) => sum + (i.stock || 0), 0);
            }
        }
        if (!isRestaurant && effectiveStock < quantity) {
            return NextResponse.json({ 
                error: `Insufficient stock. Available: ${effectiveStock}, Requested: ${quantity}` 
            }, { status: 400 });
        }

        let cart = await prisma.cart.findFirst({
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
                        }
                    }
                }
            }
        });

        if (!cart) {
            cart = await prisma.cart.create({
                data: {
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
                            }
                        }
                    }
                }
            });
        }

        if (action === "reset-add") {
            await prisma.cart_items.deleteMany({
                where: {
                    cartId: cart.id
                }
            });
        }

        if (action !== "reset-add" && cart.cartItems.length > 0 && product.shopId) {
            const existingCartShopId = cart.cartItems[0]?.product?.shopId;
            
            if (existingCartShopId && existingCartShopId !== product.shopId) {
                const existingShop = cart.cartItems[0]?.product?.shop;
                
                const newShop = await prisma.shops.findUnique({
                    where: { id: product.shopId }
                });

                return NextResponse.json({
                    requireReset: true,
                    message: "Cart contains items from a different shop",
                    existingShop: existingShop ? {
                        id: existingShop.id,
                        name: existingShop.name,
                        image: existingShop.image,
                        address: existingShop.address1,
                        city: existingShop.city
                    } : null,
                    existingCartItems: cart.cartItems.map(item => ({
                        productId: item.productId,
                        name: item.product?.name,
                        image: item.product?.image,
                        quantity: item.quantity,
                        price: item.product?.price
                    })),
                    newProduct: {
                        id: product.id,
                        name: product.name,
                        image: product.image,
                        price: product.price
                    },
                    newShop: newShop ? {
                        id: newShop.id,
                        name: newShop.name,
                        image: newShop.image,
                        address: newShop.address1,
                        city: newShop.city
                    } : null
                }, { status: 200 });
            }
        }

        const existingCartItem = await prisma.cart_items.findUnique({
            where: {
                cartId_productId: {
                    cartId: cart.id,
                    productId: productId
                }
            }
        });

        if (existingCartItem) {
            let newQuantity;
            if (action === "set") {
                newQuantity = quantity;
            } else if (action === "increment") {
                newQuantity = existingCartItem.quantity + quantity;
            } else if (action === "decrement") {
                newQuantity = Math.max(0, existingCartItem.quantity - quantity);
            } else {
                newQuantity = existingCartItem.quantity + quantity;
            }
            
            const isRestaurant = product.shop?.type === "restaurant";
            const activeVariant = selectedVariant || existingCartItem.metadata?.selectedVariant;
            let variantStock = product.stock;
            if (activeVariant && product.variants?.items) {
                const vi = product.variants.items.find(i => i.value === activeVariant);
                if (vi) variantStock = vi.stock;
            }
            if (!isRestaurant && newQuantity > variantStock) {
                return NextResponse.json({ 
                    error: `Cannot add ${quantity} more items. Total would exceed stock of ${variantStock}` 
                }, { status: 400 });
            }

            const updatePayload = { quantity: newQuantity };
            if (selectedVariant !== null && selectedVariant !== undefined) {
                updatePayload.metadata = { selectedVariant };
            }

            const updatedCartItem = await prisma.cart_items.update({
                where: {
                    cartId_productId: {
                        cartId: cart.id,
                        productId: productId
                    }
                },
                data: updatePayload,
                include: {
                    product: true
                }
            });

            return NextResponse.json({
                message: "Cart updated successfully",
                cartItem: updatedCartItem,
                isNewProduct: false
            });
        } else {
            const newCartItem = await prisma.cart_items.create({
                data: {
                    cartId: cart.id,
                    productId: productId,
                    quantity: quantity,
                    metadata: selectedVariant ? { selectedVariant } : undefined
                },
                include: {
                    product: true
                }
            });

            return NextResponse.json({
                message: "Item added to cart successfully",
                cartItem: newCartItem,
                isNewProduct: true
            });
        }

    } catch (error) {
        console.error("Error adding to cart:", error);
        return NextResponse.json({ error: error.message || "Failed to add item to cart" }, { status: 500 });
    }
};

export const DELETE = async (req) => {
    try {
        const userId = req.headers.get("user-id");
        const userRole = req.headers.get("role");
        const { productId } = await req.json();

        if (!userId) {
            return NextResponse.json({ error: "User ID is required" }, { status: 401 });
        }

        if (userRole !== "visitor") {
            return NextResponse.json({ error: "Only visitors can remove from cart" }, { status: 403 });
        }

        if (!productId) {
            return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
        }

        const cart = await prisma.cart.findFirst({
            where: { 
                userId: parseInt(userId),
                status: "active"
            }
        });

        if (!cart) {
            return NextResponse.json({ error: "No active cart found" }, { status: 404 });
        }

        const existingCartItem = await prisma.cart_items.findUnique({
            where: {
                cartId_productId: {
                    cartId: cart.id,
                    productId: productId
                }
            }
        });

        if (!existingCartItem) {
            return NextResponse.json({ error: "Item not found in cart" }, { status: 404 });
        }

        await prisma.cart_items.delete({
            where: {
                cartId_productId: {
                    cartId: cart.id,
                    productId: productId
                }
            }
        });

        return NextResponse.json({
            message: "Item removed from cart successfully"
        });

    } catch (error) {
        console.error("Error removing from cart:", error);
        return NextResponse.json({ error: error.message || "Failed to remove item from cart" }, { status: 500 });
    }
};