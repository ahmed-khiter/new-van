import prisma from "@/lib/prisma";
import { generateJobTitle, getRequiredDocumentByCategory } from "@/utils/helper";
import { NextResponse } from "next/server";
import { v4 as uuid } from "uuid";

export const POST = async (req) => {
    try {
        const form = await req.json();
        const id = uuid();
        const pickupDateTimestamp = form.pickupDate
            ? new Date(form.pickupDate)
            : null;

        let pickupDateTime = form.pickupFixedTime
            ? new Date(form.pickupFixedTime)
            : null;

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

        // Exclude fields that aren't in the Prisma schema
        const { items, customerLocation, selectedLocationId, totalPrice, ...formWithoutInvalidFields } = form;

        const job = {
            ...formWithoutInvalidFields,
            title: generateJobTitle(form),
            pickupDate: pickupDateTimestamp,
            earliestPickupTime: form.isPickupTimeFlexible
                ? earliestPickupDateTime
                : null,
            latestPickupTime: latestPickupDateTime,
            pickupFixedTime: form.isPickupTimeFlexible ? null : pickupDateTime,
            dropOffFixedTime: form.isDropOffTimeFlexible ? null : dropOffDateTime,
            dropOffDate: dropOffDateTimestamp,
            earliestDropOffTime: earliestDropOffDateTime,
            latestDropOffTime: latestDropOffDateTime,
            price: Number(form.price),
            year: Number(form.year),
            id,
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

        return NextResponse.json(createdJob, { status: 200 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to create job" }, { status: 500 });
    }
};
