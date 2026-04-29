import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { createPendingJobFeedback } from "@/utils/feedbackService";
import { getUserFullName, serviceVerificationRequirements } from "@/utils/helper";
import { handleProviderPaymentEmailSending } from "@/utils/providerPaymentEmailService";
import { sendEmail } from "@/lib/sendEmail";
import { createDocumentApprovedNotification, createDocumentRejectedNotification, createPaymentNotification } from "@/utils/notificationService";

export const POST = async (req) => {
    try {
        const { docIds, status, reasonOfRejection } = await req.json();

        if (!docIds || !Array.isArray(docIds) || docIds.length === 0 || !status) {
            return NextResponse.json({ error: "Document IDs and status are required" }, { status: 400 });
        }


        const updateData = { status };
        if (typeof reasonOfRejection !== "undefined") updateData.reasonOfRejection = reasonOfRejection;

        const updatedDocs = await prisma.documents.updateMany({
            where: { id: { in: docIds } },
            data: updateData,
        });

        const docs = await prisma.documents.findMany({
            where: { id: { in: docIds } },
            select: { id: true, userId: true, category: true, jobId: true, name: true },
        });

        // Create notifications for document status changes
        if (status === 'Approved' || status === 'Rejected') {
            const notificationPromises = docs
                .filter(doc => doc.userId) // Only for documents with userId
                .map(doc => {
                    if (status === 'Approved') {
                        return createDocumentApprovedNotification(doc.userId, doc.name);
                    } else {
                        return createDocumentRejectedNotification(doc.userId, doc.name, reasonOfRejection);
                    }
                });
            
            try {
                await Promise.all(notificationPromises);
            } catch (error) {
                console.error('Error creating document notifications:', error);
                // Don't fail the bulk update if notification creation fails
            }
        }


        const grouped = {};
        docs.forEach((doc) => {
            if (doc.jobId) {
                if (!grouped[`job_${doc.jobId}`]) grouped[`job_${doc.jobId}`] = { jobId: doc.jobId, docs: [] };
                grouped[`job_${doc.jobId}`].docs.push(doc.id);
            } else {
                const key = `user_${doc.userId}_${doc.category}`;
                if (!grouped[key]) grouped[key] = { userId: doc.userId, category: doc.category, docs: [] };
                grouped[key].docs.push(doc.id);
            }
        });

        for (const key of Object.keys(grouped)) {
            const group = grouped[key];


            if (key.startsWith("job_")) {
                const jobId = group.jobId;
                const jobDocs = await prisma.documents.findMany({
                    where: { jobId, status: { not: "Reuploaded" } },
                    select: { name: true, status: true },
                });

                const requiredDocs = jobDocs.map(d => d.name);
                const allApproved = requiredDocs.every(reqName => jobDocs.some(d => d.name === reqName && d.status === "Approved"));

                if (allApproved) {
                    await prisma.jobs.updateMany({
                        where: { id: jobId },
                        data: { 
                            status: "completed",
                            completedAt: new Date()
                        },
                    });

                    // Also mark related product orders as completed
                    await prisma.product_orders.updateMany({
                        where: { 
                            jobId: jobId,
                            status: { in: ["pending", "paid"] }
                        },
                        data: { status: "completed" }
                    });

                    console.log(`Job ${jobId} marked as completed - related orders also marked as completed`);
                    
                    // Create pending feedback for the job creator
                    const job = await prisma.jobs.findUnique({
                        where: { id: jobId },
                        select: { createdById: true, acceptedById: true, price: true }
                    });
                    
                    if (job?.createdById) {
                        try {
                            await createPendingJobFeedback(jobId, job.createdById);
                            console.log(`Created pending feedback for job ${jobId} by user ${job.createdById}`);
                        } catch (error) {
                            console.error(`Failed to create pending feedback for job ${jobId}:`, error);
                        }
                    }

                    // Send payment notification email to provider (non-blocking)
                    if (job?.acceptedById && job?.price) {
                        try {
                            await handleProviderPaymentEmailSending(
                                jobId, 
                                job.acceptedById, 
                                job.price, 
                                "Bank Transfer"
                            );
                            console.log(`Provider payment email sent for job ${jobId}`);
                        } catch (error) {
                            console.error(`Failed to send provider payment email for job ${jobId}:`, error);
                            // Don't fail the job completion if email sending fails
                        }

                        // Create payment notification
                        try {
                            const jobDetails = await prisma.jobs.findUnique({
                                where: { id: jobId },
                                select: { title: true }
                            });
                            await createPaymentNotification(
                                job.acceptedById,
                                `£${parseFloat(job.price).toFixed(2)}`,
                                jobId,
                                jobDetails?.title
                            );
                        } catch (error) {
                            console.error(`Failed to create payment notification for job ${jobId}:`, error);
                        }
                    }
                }

            } else {

                const { userId, category } = group;
                const requiredDocs = serviceVerificationRequirements[category] || [];
                if (requiredDocs.length === 0) continue;

                const userDocs = await prisma.documents.findMany({
                    where: { userId, category, name: { in: requiredDocs } },
                    select: { name: true, status: true },
                });

                const allApproved = requiredDocs.every(reqName =>
                    userDocs.some(doc => doc.name === reqName && doc.status === "Approved")
                );

                if (allApproved) {
                    const user = await prisma.users.findUnique({ where: { id: userId } });
                    const updatedServices = user.settings.services.map(service =>
                        service.name === category ? { ...service, status: "Approved" } : service
                    );

                    await prisma.users.update({
                        where: { id: userId },
                        data: { settings: { ...user.settings, services: updatedServices } },
                    });


                    await sendEmail({
                        name: getUserFullName(user.firstName, user.lastName),
                        email: user.email,
                        serviceName: category,
                        subject: `Your ${category} Service Has Been Approved`,
                        type: "serviceApproval",
                    });
                }
            }
        }

        return NextResponse.json({ message: "Document statuses updated successfully", updatedCount: updatedDocs.count }, { status: 200 });

    } catch (error) {
        console.error("Error updating documents:", error);
        return NextResponse.json({ error: "Failed to update documents" }, { status: 500 });
    }
};
