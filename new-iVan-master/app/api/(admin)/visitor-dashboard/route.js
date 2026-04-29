import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';
export const GET = async (req) => {
    try {
        const userId = req.headers.get("user-id");
        const role = req.headers.get("role");

        if (!userId || role !== "visitor") {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Get job counts for the visitor
        const totalJobs = await prisma.jobs.count({
            where: { createdById: Number(userId) }
        });

        const activeJobs = await prisma.jobs.count({
            where: { 
                createdById: Number(userId),
                status: "active"
            }
        });

        const completedJobs = await prisma.jobs.count({
            where: { 
                createdById: Number(userId),
                status: "completed"
            }
        });

        const pendingJobs = await prisma.jobs.count({
            where: { 
                createdById: Number(userId),
                status: "pending"
            }
        });

        const openJobs = await prisma.jobs.count({
            where: { 
                createdById: Number(userId),
                status: "open"
            }
        });

        const cancelledJobs = await prisma.jobs.count({
            where: { 
                createdById: Number(userId),
                status: "cancelled"
            }
        });

        // Calculate total spent from completed jobs
        const completedJobsWithPrice = await prisma.transaction.findMany({
            where: { 
                user_id: Number(userId),
            },
            select: { amount: true }
        });

        const totalSpent = completedJobsWithPrice.reduce((sum, job) => {
            return sum + (parseFloat(job.amount) || 0);
        }, 0);

        // Get transaction stats
        const totalTransactions = await prisma.transaction.count({
            where: { user_id: Number(userId), type: "payment" }
        });

        const stats = {
            jobs: {
                total: totalJobs,
                active: activeJobs,
                completed: completedJobs,
                pending: pendingJobs,
                open: openJobs,
                cancelled: cancelledJobs
            },
            spending: {
                totalSpent: totalSpent
            },
            transactions: {
                total: totalTransactions,
            }
        };

        return NextResponse.json({ stats }, { status: 200 });
    } catch (error) {
        console.error("Error fetching visitor dashboard stats:", error);
        return NextResponse.json(
            { error: "Failed to fetch dashboard stats" },
            { status: 500 }
        );
    }
};
