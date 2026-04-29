import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getSubscriptionStatus, isSubscriptionActive } from "@/utils/subscriptionService";
import { sendEmail } from "@/lib/sendEmail";

export const GET = async (req, { params }) => {
    try {
        const { id } = params;

        const provider = await prisma.users.findUnique({
            where: { 
                id: parseInt(id),
                role: "provider"
            },
            include: {
                _count: {
                    select: {
                        acceptedJobs: true
                    }
                }
            }
        });

        if (!provider) {
            return NextResponse.json({ error: "Provider not found" }, { status: 404 });
        }

        // Fetch approved documents where jobId is null (general documents)
        const documents = await prisma.documents.findMany({
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

        const { subscription } = await getSubscriptionStatus(parseInt(id));
        
        let planInfo = null;

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

        return NextResponse.json({ 
            provider: {
                ...provider,
                documents,
            },
            plan: planInfo,
        }, { status: 200 });
    } catch (error) {
        console.error('Error fetching provider details:', error);
        return NextResponse.json({ error: error.message || "Failed to fetch provider details" }, { status: 500 });
    }
};

export const PATCH = async (req, { params }) => {
    try {
        const { id } = params;
        const { status } = await req.json();

        if (!status || !["active", "suspended"].includes(status)) {
            return NextResponse.json({ error: "Invalid status. Must be active or suspended" }, { status: 400 });
        }

        const existingProvider = await prisma.users.findUnique({
            where: {
                id: parseInt(id),
                role: "provider"
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                status: true
            }
        });

        if (!existingProvider) {
            return NextResponse.json({ error: "Provider not found" }, { status: 404 });
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

        if (status === "active" && existingProvider.status !== "active") {
            const providerName = `${existingProvider.firstName || ""} ${existingProvider.lastName || ""}`.trim() || "User";
            const dashboardLink = `${process.env.NEXTAUTH_URL}/provider/dashboard`;

            sendEmail({
                type: "businessAccountApproved",
                name: providerName,
                email: existingProvider.email,
                subject: "Your Swipped account has been approved",
                accountType: "Service Provider",
                dashboardLink,
            }).catch((emailError) => {
                console.error("Failed to send provider approval email:", emailError);
            });
        }

        return NextResponse.json({ 
            message: `Provider account ${status === 'active' ? 'activated' : 'suspended'} successfully`,
            provider: updatedProvider
        }, { status: 200 });
    } catch (error) {
        console.error('Error updating provider status:', error);
        return NextResponse.json({ error: error.message || "Failed to update provider status" }, { status: 500 });
    }
};
