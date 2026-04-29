import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';
// GET - Get cart item count
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

        // Get active cart and count its items
        const cart = await prisma.cart.findFirst({
            where: { 
                userId: parseInt(userId),
                status: "active"
            },
            include: {
                cartItems: {
                    select: {
                        productId: true,
                        quantity: true
                    }
                }
            }
        });

        // Calculate total quantity (sum of all item quantities)
        const cartCount = cart ? cart.cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0) : 0;
        const products = cart ? cart.cartItems.filter(item => item.productId).map(item => item.productId) : [];

        return NextResponse.json({ 
            count: cartCount,
            products
        });

    } catch (error) {
        console.error("Error fetching cart count:", error);
        return NextResponse.json({ error: error.message || "Failed to fetch cart count" }, { status: 500 });
    }
};
