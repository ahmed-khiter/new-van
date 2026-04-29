import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { trackJobDecline } from "@/utils/deliveryNotificationService";

export const dynamic = 'force-dynamic';

export const POST = async (req, { params }) => {
    try {
        const userIdHeader = req.headers.get("user-id");
        const userId = parseInt(userIdHeader, 10);
        const jobId = params.id;

        if (!jobId) {
            return NextResponse.json({
                success: false,
                message: "Job ID is required",
                data: null
            }, { status: 400 });
        }

        if (isNaN(userId)) {
            return NextResponse.json({
                success: false,
                message: "Invalid provider ID",
                data: null
            }, { status: 400 });
        }

        // Get request body for optional decline reason
        let declineReason = null;
        try {
            const body = await req.json();
            declineReason = body.reason || null;
        } catch (error) {
            // Body is optional, continue without it
        }

        // Verify job exists
        const job = await prisma.jobs.findUnique({
            where: { id: jobId },
            select: {
                id: true,
                status: true,
                acceptedById: true,
                deliveryOrderId: true
            }
        });

        if (!job) {
            return NextResponse.json({
                success: false,
                message: "Job not found",
                data: null
            }, { status: 404 });
        }

        // Check if job is already accepted
        if (job.acceptedById) {
            return NextResponse.json({
                success: false,
                message: "Job is already accepted by another provider",
                data: null
            }, { status: 409 });
        }

        // Check if job is still available
        if (job.status !== "active") {
            return NextResponse.json({
                success: false,
                message: `Job is not available to decline. Current status: ${job.status}`,
                data: null
            }, { status: 400 });
        }

        // Track the decline for analytics
        try {
            await trackJobDecline(jobId, userId, declineReason);
            console.log(`Job decline tracked: Provider ${userId} declined job ${jobId}`);
        } catch (trackError) {
            console.error("Error tracking job decline:", trackError);
            // Don't fail the decline if tracking fails
        }

        // Note: We don't update the job status here because:
        // 1. The job should remain "active" for other providers to accept
        // 2. Declining doesn't remove the job from the system
        // 3. Other providers can still accept the job

        return NextResponse.json({
            success: true,
            message: "Job decline recorded successfully",
            data: {
                jobId: jobId,
                declinedBy: userId,
                reason: declineReason,
                jobStillAvailable: true
            }
        }, { status: 200 });

    } catch (error) {
        console.error("Decline job error:", error);
        return NextResponse.json({
            success: false,
            message: error.message || "Failed to decline job",
            data: null
        }, { status: 500 });
    }
};

