import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { v4 as uuid } from "uuid";
import { getRequiredDocumentByCategory } from "@/utils/helper";
import { notifyProvidersAboutJob } from "@/utils/jobService";
import { handleJobCancellationEmailSending } from "@/utils/jobCancellationEmailService";

export const POST = async (req) => {
    try {
        const userIdHeader = req.headers.get("user-id");
        const userID = parseInt(userIdHeader, 10);
        const { id } = await req.json();

        if (!id) {
            return NextResponse.json({ error: "id is required" }, { status: 400 });
        }
        if (isNaN(userID)) {
            return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
        }

        const job = await prisma.jobs.findUnique({ where: { id } });

        if (!job) {
            return NextResponse.json({ error: "Job not found" }, { status: 404 });
        }


        if (job.acceptedById !== userID) {
            return NextResponse.json(
                { error: "You are not authorized to cancel this job" },
                { status: 403 }
            );
        }


        // Update job status and reset delivery order status if exists
        await prisma.jobs.update({
            where: { id },
            data: { status: "cancelled" },
        });

        const newJobID = uuid();
        const { id: jobId, createdAt, updatedAt, ...jobData } = job;

        const newJob = await prisma.jobs.create({
            data: {
                ...jobData,
                id: newJobID,
                status: "active",
                acceptedById: null,
                deliveryOrderId: job.deliveryOrderId
            },
        });
        await prisma.product_orders.update({
            where: { id: job.deliveryOrderId },
            data: {
                deliveryStatus: "ready_to_dispatch",
                deliveryProviderId: null,
                providerAcceptedAt: null,
                jobId: newJob.id
            }
        });
        const requiredDocs = getRequiredDocumentByCategory(newJob?.category);
        if (requiredDocs.length > 0) {
            await prisma.documents.createMany({
                data: requiredDocs.map((docName) => ({
                    name: docName,
                    jobId: newJob.id,
                    category: newJob?.category,
                    status: "Required",
                })),
            });
        }

        // Send notifications to providers about the new active job (replacement job)
        try {
            const notificationResult = await notifyProvidersAboutJob(newJob);
            console.log(`Job notification result for replacement job ${newJobID}:`, notificationResult);
        } catch (error) {
            console.error("Error sending job notifications for replacement job:", error);
            // Don't fail the job cancellation if email sending fails
        }

        // Send job cancellation email to customer (non-blocking)
        if (job.createdById) {
            try {
                await handleJobCancellationEmailSending(
                    id, 
                    job.createdById, 
                    userID, 
                    null, // cancellation reason - could be added to the API if needed
                    newJobID
                );
                console.log(`Job cancellation email sent for job ${id}`);
            } catch (error) {
                console.error(`Failed to send job cancellation email for job ${id}:`, error);
                // Don't fail the job cancellation if email sending fails
            }
        }

        return NextResponse.json({ message: "Job cancelled" }, { status: 200 });
    } catch (error) {
        console.error("Cancel job error:", error);
        return NextResponse.json({ error: "Failed to cancel job" }, { status: 500 });
    }
};
