import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export const GET = async (req) => {
    try {
        const userId = req.headers.get("user-id");
        const { searchParams } = new URL(req.url);
        const limit = parseInt(searchParams.get("limit")) || 50;
        
        if (!userId) {
            return NextResponse.json({
                success: false,
                message: "User ID is required"
            }, { status: 400 });
        }

        const providerId = parseInt(userId);

        // Fetch delivery history (completed or cancelled)
        const deliveries = await prisma.product_orders.findMany({
            where: {
                deliveryProviderId: providerId,
                deliveryStatus: {
                    in: ['delivered', 'cancelled']
                }
            },
            include: {
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
                        title: true
                    }
                }
            },
            orderBy: {
                deliveredAt: 'desc'
            },
            take: limit
        });

        return NextResponse.json({
            success: true,
            deliveries: deliveries
        }, { status: 200 });

    } catch (error) {
        console.error('Error fetching delivery history:', error);
        return NextResponse.json({
            success: false,
            message: error.message || "Failed to fetch delivery history"
        }, { status: 500 });
    }
};

