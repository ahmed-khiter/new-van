import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export const GET = async (req) => {
    try {
        const userId = req.headers.get("user-id");
        
        if (!userId) {
            return NextResponse.json({
                success: false,
                message: "User ID is required"
            }, { status: 400 });
        }

        const providerId = parseInt(userId);

        // Fetch active deliveries (assigned to this provider)
        const deliveries = await prisma.product_orders.findMany({
            where: {
                deliveryProviderId: providerId,
                deliveryStatus: {
                    in: ['assigned', 'in-transit']
                }
            },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        phone: true
                    }
                },
                job: {
                    select: {
                        id: true,
                        title: true,
                        pickupAddressLine1: true,
                        pickupCity: true,
                        dropOffAddressLine1: true,
                        dropOffCity: true,
                        status: true
                    }
                }
            },
            orderBy: {
                providerAcceptedAt: 'desc'
            }
        });

        return NextResponse.json({
            success: true,
            deliveries: deliveries
        }, { status: 200 });

    } catch (error) {
        console.error('Error fetching active deliveries:', error);
        return NextResponse.json({
            success: false,
            message: error.message || "Failed to fetch active deliveries"
        }, { status: 500 });
    }
};

