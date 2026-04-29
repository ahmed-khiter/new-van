import prisma from "@/lib/prisma";
import { generateJobTitle, getRequiredDocumentByCategory } from "@/utils/helper";
import { calculateJobPrice } from "@/utils/pricingService";
import { NextResponse } from "next/server";
import { createJobPaymentSession } from "@/utils/paymentService";
import { v4 as uuid } from "uuid";
import { notifyProvidersAboutJob } from "@/utils/jobService";
export const dynamic = 'force-dynamic';


export const POST = async (req) => {
    try {
        const form = await req.json();
        const id = uuid();
        const userId = req.headers.get("user-id");
        const userRole = req.headers.get("role");

        const pickupDateTimestamp = form.pickupDate
            ? new Date(form.pickupDate)
            : null;

        // ASAP (urgent) is sent as null from client; requireUrgent or pickupFixedTime === 'ASAP' means isPickupASAP
        const isPickupASAP = form.requireUrgent === true || form.pickupFixedTime === "ASAP";
        let pickupDateTime = isPickupASAP || !form.pickupFixedTime
            ? null
            : new Date(form.pickupFixedTime);

        const earliestPickupDateTime = form.earliestPickupTime
            ? new Date(form.earliestPickupTime)
            : null;

        const latestPickupDateTime = form.latestPickupTime
            ? new Date(form.latestPickupTime)
            : null;

        const dropOffDateTime = form.dropOffFixedTime
            ? new Date(form.dropOffFixedTime)
            : null;

        const earliestDropOffDateTime = form.earliestDropOffTime
            ? new Date(form.earliestDropOffTime)
            : null;

        const latestDropOffDateTime = form.latestDropOffTime
            ? new Date(form.latestDropOffTime)
            : null;

        const dropOffDateTimestamp = form.dropOffDate
            ? new Date(form.dropOffDate)
            : null;
        
        // Calculate price using the new pricing service
        const calculatedPrice = await calculateJobPrice(form.category, {
            distance: parseFloat(form.distance),
            howManyRooms: form.howManyRooms,
            howManyBathrooms: form.howManyBathrooms,
            howManyItems: form.howManyItems,
            vanSize: form.vanSize,
            isTwoMenRequired: form.isTwoMenRequired,
            isHelpLoading: form.isHelpLoading,
            make: form.make,
            model: form.model,
            doesCarTurnOn: form.doesCarTurnOn,
            typeOfKey: form.typeOfKey,
            typeOfLock: form.typeOfLock,
            typeOfPlace: form.typeOfPlace,
            hasCleaningProducts: form.hasCleaningProducts,
            hasLogBook: form.hasLogBook,
            hasCarKey: form.hasCarKey
        });
        
        // Exclude fields that aren't in the Prisma schema
        const { items, customerLocation, selectedLocationId, totalPrice, ...formWithoutInvalidFields } = form;
        
        // Use calculated price if available, otherwise fall back to form's totalPrice or price
        const finalPrice = (calculatedPrice != null && calculatedPrice > 0)
            ? calculatedPrice
            : (parseFloat(totalPrice) > 0 ? parseFloat(totalPrice) : (parseFloat(form.price) > 0 ? parseFloat(form.price) : calculatedPrice || 0));

        const job = {
            ...formWithoutInvalidFields,
            title:generateJobTitle(form),
            pickupDate: pickupDateTimestamp,
            earliestPickupTime: form.isPickupTimeFlexible
                ? earliestPickupDateTime
                : null,
            latestPickupTime: latestPickupDateTime,
            pickupFixedTime: form.isPickupTimeFlexible || isPickupASAP ? null : pickupDateTime,
            isPickupASAP: isPickupASAP,
            requireUrgent: form.requireUrgent === true || isPickupASAP,
            dropOffFixedTime: form.isDropOffTimeFlexible ? null : dropOffDateTime,
            dropOffDate: dropOffDateTimestamp,
            earliestDropOffTime: earliestDropOffDateTime,
            latestDropOffTime: latestDropOffDateTime,
            price: finalPrice, // Use calculated price with fallback to form price
            year: Number(form.year),
            id,
            createdById: userId ? Number(userId) : null,
            // Set status based on user role
            status: userRole === "visitor" ? "draft" : "active",
            distance: parseFloat(form.distance),
        };

        const createdJob = await prisma.jobs.create({ data: job });
        const requiredDocs = getRequiredDocumentByCategory(form?.category);
        if (requiredDocs.length > 0) {
            await prisma.documents.createMany({
                data: requiredDocs.map((docName) => ({
                    name: docName,
                    jobId: createdJob.id,
                    category: createdJob?.category,
                    status: "Required",
                })),
            });
        }

        // Send email notifications to matching providers (only for active jobs)
        if (createdJob.status === "active") {
            try {
                const notificationResult = await notifyProvidersAboutJob(createdJob);
                console.log(`Job notification result:`, notificationResult);
            } catch (error) {
                console.error("Error sending job notifications:", error);
                // Don't fail the job creation if email sending fails
            }
        }

        // If visitor, create payment session and return payment URL
        if (userRole === "visitor") {
            try {
                const paymentUrl = await createJobPaymentSession(
                    createdJob.id, 
                    createdJob.price, 
                    createdJob.title, 
                    userId
                );
                
                return NextResponse.json({
                    job: createdJob,
                    paymentUrl: paymentUrl,
                    requiresPayment: true,
                }, { status: 201 });
            } catch (error) {
                console.error("Error creating payment session:", error);
                // If payment session creation fails, return job without payment URL
                return NextResponse.json(createdJob, { status: 201 });
            }
        }

        return NextResponse.json(createdJob, { status: 201 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: error.message || "Failed to create job" }, { status: 500 });
    }
};

export const GET = async (req) => {
    try {
        const { searchParams } = new URL(req.url);
        const title = searchParams.get("title") || "";
        const categoriesParam = searchParams.get("categories") || "";
        const status = searchParams.get("status") || "";
        const role = req.headers.get("role");
        const userId = req.headers.get("user-id");

        let extraFilters = [];


        if (role === "visitor") {
            // For visitors, only show jobs created by them
            extraFilters.push({ createdById: Number(userId) });
        } else {
            if (!status) {
                extraFilters.push({ status: { not: "draft" } });
            }
        } 


        if (title) {
            extraFilters.push({ title: { contains: title } });
        }

        // Handle status filter
        if (status) {
            extraFilters.push({ status: status });
        }

        if (categoriesParam) {
            const categoriesArray = categoriesParam.split(",").map(c => c.trim()).filter(Boolean);
            if (categoriesArray.length > 0) {
                extraFilters.push({ category: { in: categoriesArray } });
            }
        }

        const jobs = await prisma.jobs.findMany({
            where: { AND: extraFilters },
            include: {
                chat: {
                    select: {
                        id: true,
                        _count: {
                            select: {
                                messages: {
                                    where: {
                                        senderId: { not: parseInt(userId) },
                                        isRead: false
                                    }
                                }
                            }
                        }
                    }
                }
            },
            orderBy: { createdAt: "desc" },
        });

        // Add unread message count and chat ID to each job
        const jobsWithUnreadCount = jobs.map(job => ({
            ...job,
            chatId: job.chat?.id || null,
            unreadMessageCount: job.chat?._count?.messages || 0
        }));

        // Enrich with latest submitted feedback (itemId === job.id)
        const jobIds = jobsWithUnreadCount.map(j => j.id);
        let feedbackMap = {};
        if (jobIds.length > 0) {
            const feedbacks = await prisma.feedbacks.findMany({
                where: {
                    itemType: 'job',
                    itemId: { in: jobIds },
                    status: 'submitted'
                },
                select: { itemId: true, rating: true, feedback: true, feedbackAt: true },
                orderBy: { feedbackAt: 'desc' }
            });

            for (const fb of feedbacks) {
                if (!feedbackMap[fb.itemId]) {
                    feedbackMap[fb.itemId] = { rating: fb.rating ?? null, feedback: fb.feedback ?? null };
                }
            }
        }

        const jobsWithFeedback = jobsWithUnreadCount.map(job => ({
            ...job,
            rating: feedbackMap[job.id]?.rating ?? null,
            feedback: feedbackMap[job.id]?.feedback ?? null
        }));

        return NextResponse.json({ jobs: jobsWithFeedback }, { status: 200 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: error.message || "Failed to fetch jobs" }, { status: 500 });
    }
};


