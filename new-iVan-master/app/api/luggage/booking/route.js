import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { createJobPaymentSession } from "@/utils/paymentService";
import { calculateDistance } from "@/utils/helper";
import { v4 as uuid } from "uuid";

export const dynamic = 'force-dynamic';

export const POST = async (req) => {
    try {
        const body = await req.json();
        const { items, locationId, deliveryMethod, customerLocation, totalPrice, serviceType = 'luggage' } = body;
        const userId = req.headers.get("user-id");
        const userRole = req.headers.get("role");
        
        const isCleaning = serviceType === 'cleaning';

        // Validation
        if (!items || Object.keys(items).length === 0) {
            return NextResponse.json({ error: "Please select at least one item" }, { status: 400 });
        }
        if (!locationId) {
            return NextResponse.json({ error: "Please select a location" }, { status: 400 });
        }
        if (!deliveryMethod || (deliveryMethod !== 'dropoff' && deliveryMethod !== 'collection')) {
            return NextResponse.json({ error: "Please select a delivery option" }, { status: 400 });
        }
        if (!customerLocation) {
            return NextResponse.json({ error: "Please provide your location" }, { status: 400 });
        }
        if (!totalPrice || totalPrice <= 0) {
            return NextResponse.json({ error: "Invalid total price" }, { status: 400 });
        }

        // Verify location exists
        const location = await prisma.luggage_locations.findUnique({
            where: { id: locationId },
            select: { id: true, address1: true, city: true, postCode: true, latitude: true, longitude: true }
        });

        if (!location) {
            return NextResponse.json({ error: "Selected location not found" }, { status: 404 });
        }

        // Generate location name from address
        const locationName = location.city 
            ? `${location.address1}, ${location.city}`
            : location.address1;

        // Get luggage items to build description
        const luggageItemIds = Object.keys(items);
        const luggageItems = await prisma.luggage_items.findMany({
            where: { id: { in: luggageItemIds } },
            select: { id: true, name: true, price: true }
        });

        // Build job title and notes
        const itemDescriptions = luggageItems.map(item => {
            const quantity = items[item.id] || 0;
            return `${item.name} (×${quantity})`;
        }).join(', ');

        const jobTitle = `${isCleaning ? 'Cleaning' : 'Luggage'} - ${itemDescriptions}`;
        const notes = JSON.stringify({
            type: serviceType,
            items: items,
            locationId: locationId,
            locationName: locationName,
            deliveryMethod: deliveryMethod,
            customerLocation: customerLocation,
            luggageItems: luggageItems.map(item => ({
                id: item.id,
                name: item.name,
                price: parseFloat(item.price),
                quantity: items[item.id] || 0
            }))
        });

        // Create job
        // Note: Luggage/Cleaning bookings are NOT posted to service providers
        // They go directly to shops for cleaning/storage
        const jobId = uuid();
        const job = {
            id: jobId,
            title: jobTitle,
            category: isCleaning ? "Dry Cleaning Pick-Up" : "Luggage Storage",
            notes: notes,
            price: parseFloat(totalPrice),
            status: userRole === "visitor" ? "draft" : "pending", // Use "pending" instead of "active" to prevent provider notifications
            createdById: userId ? Number(userId) : null,
            // Customer location (pickup location)
            pickupAddressLine1: customerLocation.address,
            pickupCity: customerLocation.city || null,
            pickupPostCode: customerLocation.postCode || null,
            pickupLat: customerLocation.lat,
            pickupLng: customerLocation.lng,
            // Location (dropoff location)
            dropOffAddressLine1: location.address1,
            dropOffAddressLine2: null,
            dropOffCity: location.city || null,
            dropOffPostCode: location.postCode || null,
            dropOffLat: location.latitude,
            dropOffLng: location.longitude,
            // Save delivery method for tracking
            deliveryMethod: deliveryMethod,
            // Calculate distance if both locations available
            distance: customerLocation.lat && customerLocation.lng && location.latitude && location.longitude
                ? calculateDistance(
                    customerLocation.lat,
                    customerLocation.lng,
                    location.latitude,
                    location.longitude
                )
                : null,
        };

        const createdJob = await prisma.jobs.create({ data: job });

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
                return NextResponse.json({
                    job: createdJob,
                    error: "Payment session creation failed, but booking was created"
                }, { status: 201 });
            }
        }

        return NextResponse.json(createdJob, { status: 201 });
    } catch (error) {
        console.error("Error creating luggage booking:", error);
        return NextResponse.json(
            { error: error.message || `Failed to create ${isCleaning ? 'cleaning' : 'luggage'} booking` },
            { status: 500 }
        );
    }
};

