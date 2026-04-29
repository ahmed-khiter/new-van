import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export const GET = async (req) => {
    try {
        const userRole = req.headers.get("role");
        const { searchParams } = new URL(req.url);
        const startDate = searchParams.get("startDate");
        const endDate = searchParams.get("endDate");
        const providerId = searchParams.get("providerId");

        // Only admins, shop owners, or restaurants can access analytics
        if (userRole !== 'admin' && userRole !== 'shop-owner' && userRole !== 'restaurant') {
            return NextResponse.json({
                success: false,
                message: "Unauthorized access"
            }, { status: 403 });
        }

        // Build date filter
        const dateFilter = {};
        if (startDate || endDate) {
            dateFilter.createdAt = {};
            if (startDate) {
                dateFilter.createdAt.gte = new Date(startDate);
            }
            if (endDate) {
                dateFilter.createdAt.lte = new Date(endDate);
            }
        }

        // Build provider filter
        const providerFilter = providerId ? { deliveryProviderId: parseInt(providerId) } : {};

        // Get all delivery orders
        const orders = await prisma.product_orders.findMany({
            where: {
                ...dateFilter,
                ...providerFilter,
                deliveryStatus: {
                    not: null
                }
            },
            include: {
                deliveryProvider: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true
                    }
                },
                shopConfirmedBy: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        // Calculate analytics
        const totalOrders = orders.length;
        const confirmedOrders = orders.filter(o => o.deliveryStatus === 'confirmed' || o.deliveryStatus === 'assigned' || o.deliveryStatus === 'in-transit' || o.deliveryStatus === 'delivered').length;
        const deliveredOrders = orders.filter(o => o.deliveryStatus === 'delivered').length;
        const cancelledOrders = orders.filter(o => o.deliveryStatus === 'cancelled').length;

        // Calculate average times
        const confirmedOrdersWithTimes = orders.filter(o => o.shopConfirmedAt && o.createdAt);
        const avgTimeToConfirmation = confirmedOrdersWithTimes.length > 0
            ? confirmedOrdersWithTimes.reduce((sum, o) => {
                const timeDiff = new Date(o.shopConfirmedAt) - new Date(o.createdAt);
                return sum + (timeDiff / (1000 * 60)); // Convert to minutes
            }, 0) / confirmedOrdersWithTimes.length
            : 0;

        const assignedOrdersWithTimes = orders.filter(o => o.providerAcceptedAt && o.shopConfirmedAt);
        const avgTimeToAssignment = assignedOrdersWithTimes.length > 0
            ? assignedOrdersWithTimes.reduce((sum, o) => {
                const timeDiff = new Date(o.providerAcceptedAt) - new Date(o.shopConfirmedAt);
                return sum + (timeDiff / (1000 * 60)); // Convert to minutes
            }, 0) / assignedOrdersWithTimes.length
            : 0;

        const deliveredOrdersWithTimes = orders.filter(o => o.deliveredAt && o.providerAcceptedAt);
        const avgDeliveryTime = deliveredOrdersWithTimes.length > 0
            ? deliveredOrdersWithTimes.reduce((sum, o) => {
                const timeDiff = new Date(o.deliveredAt) - new Date(o.providerAcceptedAt);
                return sum + (timeDiff / (1000 * 60)); // Convert to minutes
            }, 0) / deliveredOrdersWithTimes.length
            : 0;

        // Provider acceptance rate
        const providerStats = {};
        orders.forEach(order => {
            if (order.deliveryProviderId) {
                const providerId = order.deliveryProviderId;
                if (!providerStats[providerId]) {
                    providerStats[providerId] = {
                        providerId: providerId,
                        providerName: `${order.deliveryProvider?.firstName || ''} ${order.deliveryProvider?.lastName || ''}`.trim(),
                        totalAccepted: 0,
                        totalDelivered: 0,
                        totalCancelled: 0
                    };
                }
                providerStats[providerId].totalAccepted++;
                if (order.deliveryStatus === 'delivered') {
                    providerStats[providerId].totalDelivered++;
                }
                if (order.deliveryStatus === 'cancelled') {
                    providerStats[providerId].totalCancelled++;
                }
            }
        });

        const providerStatsArray = Object.values(providerStats).map(stat => ({
            ...stat,
            successRate: stat.totalAccepted > 0 ? ((stat.totalDelivered / stat.totalAccepted) * 100).toFixed(2) : 0
        }));

        // Status distribution
        const statusDistribution = {
            pending: orders.filter(o => o.deliveryStatus === 'pending').length,
            confirmed: orders.filter(o => o.deliveryStatus === 'confirmed').length,
            assigned: orders.filter(o => o.deliveryStatus === 'assigned').length,
            'in-transit': orders.filter(o => o.deliveryStatus === 'in-transit').length,
            delivered: deliveredOrders,
            cancelled: cancelledOrders
        };

        // Daily delivery trends
        const dailyTrends = {};
        orders.forEach(order => {
            const date = new Date(order.createdAt).toISOString().split('T')[0];
            if (!dailyTrends[date]) {
                dailyTrends[date] = {
                    date: date,
                    total: 0,
                    delivered: 0,
                    cancelled: 0
                };
            }
            dailyTrends[date].total++;
            if (order.deliveryStatus === 'delivered') {
                dailyTrends[date].delivered++;
            }
            if (order.deliveryStatus === 'cancelled') {
                dailyTrends[date].cancelled++;
            }
        });

        const dailyTrendsArray = Object.values(dailyTrends).sort((a, b) => 
            new Date(a.date) - new Date(b.date)
        );

        return NextResponse.json({
            success: true,
            analytics: {
                overview: {
                    totalOrders,
                    confirmedOrders,
                    deliveredOrders,
                    cancelledOrders,
                    deliveryRate: totalOrders > 0 ? ((deliveredOrders / totalOrders) * 100).toFixed(2) : 0,
                    cancellationRate: totalOrders > 0 ? ((cancelledOrders / totalOrders) * 100).toFixed(2) : 0
                },
                averageTimes: {
                    avgTimeToConfirmation: avgTimeToConfirmation.toFixed(2), // minutes
                    avgTimeToAssignment: avgTimeToAssignment.toFixed(2), // minutes
                    avgDeliveryTime: avgDeliveryTime.toFixed(2) // minutes
                },
                providerStats: providerStatsArray,
                statusDistribution,
                dailyTrends: dailyTrendsArray
            }
        }, { status: 200 });

    } catch (error) {
        console.error('Error fetching delivery analytics:', error);
        return NextResponse.json({
            success: false,
            message: error.message || "Failed to fetch delivery analytics"
        }, { status: 500 });
    }
};

