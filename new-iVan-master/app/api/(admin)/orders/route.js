import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';
export const GET = async (req) => {
    try {
        const userRole = req.headers.get("role");
        const userId = req.headers.get("user-id");
        const { searchParams } = new URL(req.url);
        const status = searchParams.get("status") || "all";
        const deliveryStatus = searchParams.get("deliveryStatus") || "all";
        const productId = searchParams.get("productId");
        const customerId = searchParams.get("customerId");
        const dateFrom = searchParams.get("dateFrom");
        const dateTo = searchParams.get("dateTo");

        let whereClause = {};

        // Filter by payment status
        if (status !== "all") {
            whereClause.status = status;
        }

        // Filter by delivery status
        if (deliveryStatus !== "all") {
            whereClause.deliveryStatus = deliveryStatus;
        }

        // Filter by user
        if (customerId) {
            whereClause.userId = parseInt(customerId);
        }

        // Filter by date range
        if (dateFrom || dateTo) {
            whereClause.createdAt = {};
            if (dateFrom) {
                whereClause.createdAt.gte = new Date(dateFrom);
            }
            if (dateTo) {
                whereClause.createdAt.lte = new Date(dateTo);
            }
        }

        if (productId) {
            whereClause.cart = {
                cartItems: {
                    some: {
                        productId: productId
                    }
                }
            };
        } else if ((userRole === 'shop-owner' || userRole === 'restaurant') && userId) {
            // Get shop/restaurant for the user
            const shopType = userRole === "restaurant" ? "restaurant" : "shop";
            const shop = await prisma.shops.findFirst({
                where: { 
                    createdById: Number(userId),
                    type: shopType
                },
                select: { id: true }
            });
            
            if (shop) {
                whereClause.shopId = shop.id;
            }
        }

        const orders = await prisma.product_orders.findMany({
            where: whereClause,
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
                        name: true
                    }
                },
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true
                    }
                },
                job: {
                    select: {
                        id: true,
                        status: true
                    }
                }
            },
            orderBy: { createdAt: "desc" }
        });

        // Get filter options
        const products = await prisma.products.findMany({
            where: { ...((userRole === "shop-owner" || userRole === "restaurant") && { createdById: Number(userId) }) },
            select: {
                id: true,
                name: true
            },
            orderBy: { name: "asc" }
        });

        const visitors = await prisma.users.findMany({
            where: { 
                role: "visitor", 
                ...((userRole === "shop-owner" || userRole === "restaurant") && { 
                    productOrders: {
                        some: {
                            cart: {
                                cartItems: {
                                    some: {
                                        product: {
                                            createdById: Number(userId)
                                        }
                                    }
                                }
                            }
                        }
                    }
                })
            },
            select: {
                id: true,
                firstName: true,
                lastName: true
            },
            orderBy: { firstName: "asc" }
        });

        // Calculate stats based on all orders (not filtered)
        let statsWhereClause = {};
        if ((userRole === 'shop-owner' || userRole === 'restaurant') && userId) {
            const shopType = userRole === "restaurant" ? "restaurant" : "shop";
            const shop = await prisma.shops.findFirst({
                where: { 
                    createdById: Number(userId),
                    type: shopType
                },
                select: { id: true }
            });
            
            if (shop) {
                statsWhereClause.shopId = shop.id;
            }
        }

        const allOrders = await prisma.product_orders.findMany({
            where: statsWhereClause,
            select: {
                status: true,
                deliveryStatus: true
            }
        });

        const stats = {
            totalOrders: allOrders.length,
            pendingOrders: allOrders.filter(order => order.status === "pending").length,
            paidOrders: allOrders.filter(order => order.status === "paid").length,
            completedOrders: allOrders.filter(order => order.status === "completed").length,
            confirmedDeliveries: allOrders.filter(order => order.deliveryStatus === "confirmed").length,
            inTransitDeliveries: allOrders.filter(order => order.deliveryStatus === "in-transit").length,
            deliveredOrders: allOrders.filter(order => order.deliveryStatus === "delivered").length
        };

        return NextResponse.json({
            orders,
            stats,
            filterOptions: {
                products,
                visitors
            }
        });

    } catch (error) {
        console.error('Error fetching orders:', error);
        return NextResponse.json({ error: error.message || "Failed to fetch orders" }, { status: 500 });
    }
};
