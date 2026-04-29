import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export const POST = async (req) => {
    try {
        const userId = req.headers.get("user-id");
        const userRole = req.headers.get("role");

        if (!userId) {
            return NextResponse.json({ error: "User ID is required" }, { status: 401 });
        }

        if (userRole !== "visitor") {
            return NextResponse.json({ error: "Only visitors can manage favorites" }, { status: 403 });
        }

        const { productId, action } = await req.json();

        if (!productId || !action) {
            return NextResponse.json({ 
                error: "Product ID and action (add/remove) are required" 
            }, { status: 400 });
        }

        if (!["add", "remove"].includes(action)) {
            return NextResponse.json({ 
                error: "Action must be either 'add' or 'remove'" 
            }, { status: 400 });
        }

        // Check if product exists
        const product = await prisma.products.findUnique({
            where: { id: productId },
            select: { id: true, name: true }
        });

        if (!product) {
            return NextResponse.json({ error: "Product not found" }, { status: 404 });
        }

        if (action === "add") {
            // Check if already in favorites
            const existingFavorite = await prisma.favorite_products.findFirst({
                where: {
                    userId: parseInt(userId),
                    productId: productId
                }
            });

            if (existingFavorite) {
                return NextResponse.json({ 
                    message: "Product already in favorites",
                    isFavorite: true
                }, { status: 200 });
            }

            // Add to favorites
            await prisma.favorite_products.create({
                data: {
                    userId: parseInt(userId),
                    productId: productId
                }
            });

            return NextResponse.json({ 
                message: "Product added to favorites",
                isFavorite: true
            }, { status: 200 });

        } else if (action === "remove") {
            // Remove from favorites
            const deleted = await prisma.favorite_products.deleteMany({
                where: {
                    userId: parseInt(userId),
                    productId: productId
                }
            });

            if (deleted.count === 0) {
                return NextResponse.json({ 
                    message: "Product not in favorites",
                    isFavorite: false
                }, { status: 200 });
            }

            return NextResponse.json({ 
                message: "Product removed from favorites",
                isFavorite: false
            }, { status: 200 });
        }

    } catch (error) {
        console.error("Error managing favorite product:", error);
        return NextResponse.json({ 
            error: error.message || "Failed to manage favorite product" 
        }, { status: 500 });
    }
};

export const GET = async (req) => {
    try {
        const userId = req.headers.get("user-id");
        const userRole = req.headers.get("role");

        if (!userId) {
            return NextResponse.json({ error: "User ID is required" }, { status: 401 });
        }

        if (userRole !== "visitor") {
            return NextResponse.json({ error: "Only visitors can view favorites" }, { status: 403 });
        }

        const favorites = await prisma.favorite_products.findMany({
            where: {
                userId: parseInt(userId)
            },
            include: {
                product: {
                    select: {
                        id: true,
                        name: true,
                        price: true,
                        image: true,
                        category: true,
                        stock: true,
                        isActive: true
                    }
                }
            },
            orderBy: {
                createdAt: "desc"
            }
        });

        return NextResponse.json({ 
            favorites: favorites.map(fav => (fav.product))
        }, { status: 200 });

    } catch (error) {
        console.error("Error fetching favorite products:", error);
        return NextResponse.json({ 
            error: error.message || "Failed to fetch favorite products" 
        }, { status: 500 });
    }
};
