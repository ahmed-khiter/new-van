import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { createPendingJobFeedback } from "@/utils/feedbackService";
import { getUserFullName, serviceVerificationRequirements } from "@/utils/helper";
import { handleProviderPaymentEmailSending } from "@/utils/providerPaymentEmailService";
import { sendEmail } from "@/lib/sendEmail";
import { createDocumentApprovedNotification, createDocumentRejectedNotification, createPaymentNotification } from "@/utils/notificationService";

export const POST = async (req, { params }) => {
    try {
        const { id } = params;
        const { status, reasonOfRejection } = await req.json();

        if (!id || !status) {
            return NextResponse.json({ error: "Document ID and status are required" }, { status: 400 });
        }


        const updateData = { status };
        if (typeof reasonOfRejection !== "undefined") updateData.reasonOfRejection = reasonOfRejection;

        const updatedDoc = await prisma.documents.update({
            where: { id },
            data: updateData,
        });

        const { userId, category, jobId, name } = updatedDoc;

        // Create notification for document status change
        if (userId && (status === 'Approved' || status === 'Rejected')) {
          try {
            if (status === 'Approved') {
              await createDocumentApprovedNotification(userId, name);
            } else if (status === 'Rejected') {
              await createDocumentRejectedNotification(userId, name, reasonOfRejection);
            }
          } catch (error) {
            console.error('Error creating document notification:', error);
            // Don't fail the document update if notification creation fails
          }
        }

        if (jobId) {

            const jobDocs = await prisma.documents.findMany({
                where: { jobId, status: { not: "Reuploaded" } },
                select: { name: true, status: true },
            });

            const requiredDocs = jobDocs.map(d => d.name);
            const allApproved = requiredDocs.every(reqName =>
                jobDocs.some(d => d.name === reqName && d.status === "Approved")
            );

            if (allApproved) {
                await prisma.jobs.updateMany({
                    where: { id: jobId },
                    data: { 
                        status: "completed",
                        completedAt: new Date(),
                        providerPaymentStatus: "pending"
                    },
                });

                // Also mark related product orders as completed
                await prisma.product_orders.updateMany({
                    where: { 
                        jobId: jobId,
                        status: "paid"
                    },
                    data: { shopOwnerPaymentStatus: "pending" }
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

            const requiredDocs = serviceVerificationRequirements[category] || [];
            if (requiredDocs.length > 0) {
                const userDocs = await prisma.documents.findMany({
                    where: { userId, category, name: { in: requiredDocs } },
                    select: { name: true, status: true },
                });

                const allRequiredApproved = requiredDocs.every(reqName =>
                    userDocs.some(doc => doc.name === reqName && doc.status === "Approved")
                );

                if (allRequiredApproved) {
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

        return NextResponse.json(
            { message: "Document status updated successfully", document: updatedDoc },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error updating document:", error);
        return NextResponse.json({ error: "Failed to update document" }, { status: 500 });
    }
};
