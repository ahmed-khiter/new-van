import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getBoundingBox , calculateDistance, getFileUrl, isShopClosed } from "@/utils/helper";
import { getBusinessRatingSummaries } from "@/utils/reviewService";
export const dynamic = 'force-dynamic';

const getShopOpeningHours = (shop) =>
  shop?.shop_metadata?.openingHours || shop?.openingHours || null;

const sortShopsOpenFirst = (a, b) => {
  const aClosed = isShopClosed(getShopOpeningHours(a));
  const bClosed = isShopClosed(getShopOpeningHours(b));

  if (aClosed !== bClosed) {
    return aClosed ? 1 : -1;
  }

  const aDistance =
    typeof a.distance === "number" && !Number.isNaN(a.distance)
      ? a.distance
      : Number.POSITIVE_INFINITY;
  const bDistance =
    typeof b.distance === "number" && !Number.isNaN(b.distance)
      ? b.distance
      : Number.POSITIVE_INFINITY;

  if (aDistance !== bDistance) {
    return aDistance - bDistance;
  }

  return new Date(b.createdAt) - new Date(a.createdAt);
};

export const GET = async (req) => {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";
    const type = searchParams.get("type") || ""; // Filter by type: "shop" or "restaurant"
    const acceptsReservations = searchParams.get("acceptsReservations");
    const lat = parseFloat(searchParams.get("lat"));
    const lng = parseFloat(searchParams.get("lng"));
    const radius = parseFloat(searchParams.get("radius")) || 10; // miles
    const postCode = searchParams.get("postCode");
    const city = searchParams.get("city");
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 12;
    const skip = (page - 1) * limit;

    // Fetch all categories once to check for "All" category and for mapping later
    const allCategories = await prisma.categories.findMany({
      select: { id: true, name: true }
    });

    let whereClause = {
      status: "active" // Only show active shops
    };

    // Filter by type if provided
    if (type) {
      whereClause.type = type;
    }

    // Filter by acceptsReservations if provided
    if (acceptsReservations === "true") {
      whereClause.acceptsReservations = true;
    }

    if (search) {
      whereClause.OR = [{ name: { contains: search } }];
    }

    // Check if category is "All" - if so, don't filter by category
    if (category) {
      // Check if category parameter matches a category with name "All"
      const categoryById = allCategories.find(cat => cat.id.toString() === category);
      const categoryByName = allCategories.find(cat => cat.name === category);
      
      const isAllCategory = (categoryById && categoryById.name.toLowerCase() === "all") || 
                           (categoryByName && categoryByName.name.toLowerCase() === "all");
      
      // Only apply category filter if it's not "All"
      if (!isAllCategory) {
        whereClause.category = category;
      }
    }

    // Postal code filter (if provided)
    if (postCode) {
      whereClause.postCode = { contains: postCode };
    }

    // City filter (if provided)
    if (city) {
      whereClause.city = city;
    }

    let shops = [];
    let totalCount = 0;

    if (!isNaN(lat) && !isNaN(lng)) {
      // Step 1: Bounding box filter
      const box = getBoundingBox(lat, lng, radius);

      whereClause.AND = [
        { latitude: { gte: box.minLat, lte: box.maxLat } },
        { longitude: { gte: box.minLng, lte: box.maxLng } },
        { latitude: { not: null } },
        { longitude: { not: null } },
      ];
      const shopsWithLocationFilter = await prisma.shops.findMany({
        where: whereClause,
        include: {
          _count: { select: { products: true } },
          gallery: {
            where: { type: 'gallery' },
            orderBy: { order: 'asc' },
            select: {
              id: true,
              image: true,
              caption: true,
              type: true,
              order: true,
              createdAt: true
            }
          }
        },
      });
      // Step 2: Compute distance + filter
      const enriched = shopsWithLocationFilter
        .map((shop) => {
          const distance = calculateDistance(
            lat,
            lng,
            shop.latitude,
            shop.longitude
          );
          const openingHours = getShopOpeningHours(shop);
          const closed = isShopClosed(openingHours);
          return { ...shop, distance, isClosed: closed };
        })
        .filter((shop) => shop.distance !== null && shop.distance <= radius);

      // Step 3: Sort by open status first (open shops first), then by distance
      enriched.sort(sortShopsOpenFirst);

      // Step 4: Pagination
      totalCount = enriched.length;
      shops = enriched.slice(skip, skip + limit);
    } else {
      // fallback without location - fetch all matching shops to sort by open status
      const allShops = await prisma.shops.findMany({
        where: whereClause,
        include: {
          _count: { select: { products: true } },
          gallery: {
            where: { type: 'gallery' },
            orderBy: { order: 'asc' },
            select: {
              id: true,
              image: true,
              caption: true,
              type: true,
              order: true,
              createdAt: true
            }
          }
        },
      });

      const enrichedWithoutLocation = allShops.map((shop) => {
        const openingHours = getShopOpeningHours(shop);
        const closed = isShopClosed(openingHours);
        return { ...shop, isClosed: closed };
      });

      // Sort by open status first (open shops first), then by createdAt
      enrichedWithoutLocation.sort(sortShopsOpenFirst);

      // Pagination after sorting
      totalCount = enrichedWithoutLocation.length;
      shops = enrichedWithoutLocation.slice(skip, skip + limit);
    }

    const totalPages = Math.ceil(totalCount / limit);
    
    // Use the already fetched categories to map IDs to names
    const categoryMap = new Map(allCategories.map(cat => [cat.id.toString(), cat.name]));
    
    const ratingSummaries = await getBusinessRatingSummaries(shops.map((shop) => shop.id));

    shops = shops.map(shop => {
      const businessSummary = ratingSummaries[shop.id];
      const averageRatingFromReviews = businessSummary?.averageRating ?? 0;
      const fallbackRating = Number(shop.rating) || 0;
      const finalRating = businessSummary?.reviewCount ? averageRatingFromReviews : fallbackRating;
      const reviewCount = businessSummary?.reviewCount || 0;
      const openingHours = getShopOpeningHours(shop);
      const isClosed =
        typeof shop?.isClosed === "boolean"
          ? shop.isClosed
          : isShopClosed(openingHours);
      // Get category name from ID
      let categoryname = null;
      if (shop.category) {
        // Try to find category by ID (shop.category might be ID as string)
        categoryname = categoryMap.get(shop.category) || null;
        // If not found by ID, try to find by name (backward compatibility)
        if (!categoryname) {
          const categoryByName = allCategories.find(cat => cat.name === shop.category);
          categoryname = categoryByName ? categoryByName.name : null;
        }
      }
      return {
        ...shop,
        isClosed,
        rating: finalRating,
        reviewCount,
        categoryname: categoryname,
        image: getFileUrl(shop.image),
        gallery: shop.gallery ? shop.gallery.map(item => ({
          ...item,
          imageUrl: getFileUrl(item.image)
        })) : []
      };
    });

    // Safety pass to keep closed shops at the bottom in final payload order.
    shops.sort(sortShopsOpenFirst);
    return NextResponse.json(
      {
        shops,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          limit,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching shops:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch shops" }, { status: 500 });
  }
};
