import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getSubscriptionStatus, isSubscriptionActive } from "@/utils/subscriptionService";

export const GET = async (req, { params }) => {
    try {
        const { id } = params;
        const requestRole = req.headers.get("role");
        const requestUserId = parseInt(req.headers.get("user-id"));

        const user = await prisma.users.findUnique({
            where: { 
                id: parseInt(id),
            },
            include: {
                _count: {
                    select: {
                        acceptedJobs: true
                    }
                }
            }
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Affiliates can only inspect users they created.
        if (requestRole === "affiliate" && user.createdById !== requestUserId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }
        
        let documents = [];
        let planInfo = null;

        // Only fetch documents and plan for provider role
        if(user.role === "provider") {
            // Fetch approved documents where jobId is null (general documents)
            documents = await prisma.documents.findMany({
                where: {
                    userId: parseInt(id),
                    jobId: null,
                    status: "Approved"
                },
                select: {
                    id: true,
                    name: true,
                    fileName: true,
                    status: true,
                    createdAt: true,
                    updatedAt: true,
                    category: true
                },
                orderBy: {
                    createdAt: 'desc'
                }
            });
            
            // Fetch subscription/plan only for providers
            const { subscription } = await getSubscriptionStatus(parseInt(id));
            
            if (subscription) {
                planInfo = {
                    planId: subscription.plans.plan_id,
                    name: subscription.plans.name,
                    description: subscription.plans.description,
                    price: subscription.plans.price,
                    type: subscription.type,
                    status: subscription.status,
                    startDate: subscription.start_date,
                    endDate: subscription.end_date,
                    amountCharged: subscription.amount_charged,
                };
            }
        }

        return NextResponse.json({ 
            user: {
                ...user,
                documents,
                plan: planInfo,
            },

        }, { status: 200 });
    } catch (error) {
        console.error('Error fetching provider details:', error);
        return NextResponse.json({ error: error.message || "Failed to fetch provider details" }, { status: 500 });
    }
};

export const PATCH = async (req, { params }) => {
    try {
        const { id } = params;
        const { status , role} = await req.json();

        if (!status || !["active", "suspended"].includes(status) && role === "provider") {
            return NextResponse.json({ error: "Invalid status. Must be active or suspended" }, { status: 400 });
        }


        const updatedProvider = await prisma.users.update({
            where: { 
                id: parseInt(id),
                role: "provider"
            },
            data: {
                status: status
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                status: true,
                isActive: true,
                createdAt: true
            }
        });

        return NextResponse.json({ 
            message: `Provider account ${status === 'active' ? 'activated' : 'suspended'} successfully`,
            provider: updatedProvider
        }, { status: 200 });
    } catch (error) {
        console.error('Error updating provider status:', error);
        return NextResponse.json({ error: error.message || "Failed to update provider status" }, { status: 500 });
    }
};
