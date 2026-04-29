import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { calculateDistance } from "@/utils/helper";


export const dynamic = 'force-dynamic';
export const GET = async (req) => {
  try {
    const userId = req.headers.get("user-id");
    const role = req.headers.get("role");
    const { searchParams } = new URL(req.url);

    // Get query parameters
    const maxDistance = searchParams.get("maxDistance") || 50; // Default 50 miles radius
    const title = searchParams.get("title") || "";
    const categoriesParam = searchParams.get("categories") || "";

    let extraFilters = [];

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // Get provider's location
    const provider = await prisma.users.findUnique({
      where: { id: Number(userId) },
      select: { latitude: true, longitude: true }
    });

    if (!provider || provider.latitude === null || provider.longitude === null) {
      return NextResponse.json({
        message: "Your location is missing. Please update your address to see jobs near you."
      }, { status: 400 });
    }

    let providerVehicleTypes = [];

    // Apply provider-specific filters
    if (role === "provider") {
      const user = await prisma.users.findUnique({
        where: { id: Number(userId) },
        select: { settings: true },
      });

      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      let services = [];
      try {
        const settings = user.settings || {};
        services = (settings.services || [])
          .filter((service) => service.status === "Approved")
          .map((service) => service.name);
      } catch (err) {
        console.error("Failed to parse settings JSON:", err);
      }

      if (services.length > 0) {
        extraFilters.push({ category: { in: services } });
      } else {
        return NextResponse.json({
          jobs: [],
          message: "You have not registered any services yet. Please add and get them approved in your profile to see available jobs."
        }, { status: 200 });
      }

      // Fetch provider vehicle types for Van jobs
      try {
        const vehicles = await prisma.provider_vehicles.findMany({
          where: { userId: Number(userId) },
          include: {
            vehicleType: {
              select: { name: true }
            }
          }
        });
        providerVehicleTypes = vehicles
          .map(v => v.vehicleType?.name)
          .filter(Boolean);
      } catch (vehicleError) {
        console.error("Error fetching provider vehicles:", vehicleError);
      }
    }

    // Apply title filter
    if (title) {
      extraFilters.push({ title: { contains: title } });
    }

    // Apply categories filter
    // Exclude "Luggage Storage" category - these bookings go to shops, not service providers
    if (categoriesParam) {
      const categoriesArray = categoriesParam.split(",").map(c => c.trim()).filter(Boolean)
        .filter(cat => cat !== 'Luggage Storage'); // Remove luggage storage from categories
      if (categoriesArray.length > 0) {
        extraFilters.push({ category: { in: categoriesArray } });
      }
    } else {
      // If no category filter, explicitly exclude Luggage Storage
      extraFilters.push({ category: { not: 'Luggage Storage' } });
    }

    // Base filters
    const baseFilters = {
      status: 'active',
      acceptedById: null, // Only show unassigned jobs
      pickupLat: { not: null },
      pickupLng: { not: null },
      ...(extraFilters.length > 0 && { AND: extraFilters })
    };

    // First, get all active jobs with filters applied
    const jobs = await prisma.jobs.findMany({
      where: baseFilters,
      orderBy: { createdAt: 'desc' }
    });

    // Preload any linked delivery orders for jobs that reference them so we can filter by order deliveryStatus
    const deliveryOrderIds = jobs.map(j => j.deliveryOrderId).filter(Boolean);
    let orderMap = {};
    if (deliveryOrderIds.length > 0) {
      const orders = await prisma.product_orders.findMany({
        where: { id: { in: deliveryOrderIds } },
        select: { id: true, deliveryStatus: true }
      });
      orderMap = orders.reduce((acc, o) => { acc[o.id] = o; return acc; }, {});
    }

    // Additional filtering for Van, restaurant, and shop jobs based on provider vehicle types
    const filteredJobs = jobs.filter(job => {
        // Handle Van, restaurant, and shop categories (all delivery jobs)
        if (job.category === "Van" || job.category === "restaurant" || job.category === "shop") {
          // If job has vanSize set (assigned at checkout), ensure provider has that vehicle type
          const jobVan = job.vanSize;

          // If no vanSize on job but the job links to an order that is waiting_for_provider, prefer that as the source of truth
          const relatedOrder = job.deliveryOrderId ? orderMap[job.deliveryOrderId] : null;
          const orderWaiting = relatedOrder && relatedOrder.deliveryStatus === 'waiting_for_provider';

          // If provider has no registered vehicles, they can't take delivery jobs
          if (providerVehicleTypes.length === 0) return false;

          if (jobVan) {
            return providerVehicleTypes.includes(jobVan);
          }

          // fallback: only include when order is waiting and jobVan exists (should normally not be null if assigned at checkout)
          if (orderWaiting && job.vanSize) {
            return providerVehicleTypes.includes(job.vanSize);
          }

          return false;
        }
        return true;
      });

    // Filter jobs by distance
    const providerLat = Number(provider.latitude);
    const providerLng = Number(provider.longitude);
    const maxDist = Number(maxDistance);

    const nearbyJobs = filteredJobs.filter(job => {
      const distance = calculateDistance(
        providerLat,
        providerLng,
        Number(job.pickupLat),
        Number(job.pickupLng)
      );

      console.log("Provider:", providerLat, providerLng);
      console.log("Job:", job.pickupLat, job.pickupLng);
      console.log("Distance:", distance, "Max:", maxDist);
      return distance <= maxDist;
    });

    let message = "Jobs fetched successfully";

    if (jobs.length === 0) {
      message = "No jobs available at the moment.";
    } else if (nearbyJobs.length === 0) {
      message = "There are no jobs near your location. Please update your address to view jobs closer to you.";
    }

    // Enrich with latest submitted feedback for each nearby job
    const jobIds = nearbyJobs.map(j => j.id);
    let feedbackMap = {};
    if (jobIds.length > 0) {
      const feedbacks = await prisma.feedbacks.findMany({
        where: { itemType: 'job', itemId: { in: jobIds }, status: 'submitted' },
        select: { itemId: true, rating: true, feedback: true, feedbackAt: true },
        orderBy: { feedbackAt: 'desc' }
      });
      for (const fb of feedbacks) {
        if (!feedbackMap[fb.itemId]) {
          feedbackMap[fb.itemId] = { rating: fb.rating ?? null, feedback: fb.feedback ?? null };
        }
      }
    }

    const jobsWithFeedback = nearbyJobs.map(job => ({
      ...job,
      rating: feedbackMap[job.id]?.rating ?? null,
      feedback: feedbackMap[job.id]?.feedback ?? null
    }));

    return NextResponse.json({ jobs: jobsWithFeedback, message }, { status: 200 });

  } catch (error) {
    console.error("Error fetching nearby jobs:", error);
    return NextResponse.json(
      { jobs: [], message: error.message || "Failed to fetch nearby jobs" },
      { status: 500 }
    );
  }
};
