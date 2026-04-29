import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getFileUrl } from "@/utils/helper";
import { getBusinessRatingSummaries, getBusinessReviews } from "@/utils/reviewService";

export const dynamic = 'force-dynamic';

export const GET = async (req, { params }) => {
  try {
    const { id } = params;
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type"); // Optional: "shop", "restaurant", "mot", "shisha", "spa", "beauty", "healthcare", "events", "entertainment"

    // Valid service types that accept reservations
    const validReservationTypes = ["restaurant", "mot", "shisha", "spa", "beauty", "healthcare", "events", "entertainment"];
    const validShopTypes = ["shop", ...validReservationTypes];

    // If type is provided, validate it
    if (type && !validShopTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid type. Must be one of: ${validShopTypes.join(", ")}` },
        { status: 400 }
      );
    }

    // Fetch shop with all related data
    const shop = await prisma.shops.findUnique({
      where: { id },
      include: {
        _count: { 
          select: { 
            products: true 
          } 
        },
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
      }
    });

    // Check if shop exists
    if (!shop) {
      return NextResponse.json(
        { error: "Shop not found" },
        { status: 404 }
      );
    }

    // Check if shop is active
    if (shop.status !== "active") {
      return NextResponse.json(
        { error: "Shop is not active" },
        { status: 404 }
      );
    }

    // If type is provided, validate that the shop type matches the requested type
    // If type is not provided, allow any type (for backward compatibility)
    if (type && shop.type !== type) {
      return NextResponse.json(
        { 
          error: `This shop is of type '${shop.type}', not '${type}'`,
          actualType: shop.type
        },
        { status: 400 }
      );
    }

    // Fetch category name and subcategories from ID
    let categoryname = null;
    let subcategories = [];
    if (shop.category) {
      const categoryId = parseInt(shop.category, 10);
      if (!isNaN(categoryId)) {
        const category = await prisma.categories.findUnique({
          where: { id: categoryId },
          select: { name: true, subcategories: true }
        });
        if (category) {
          categoryname = category.name;
          subcategories = Array.isArray(category.subcategories) ? category.subcategories : [];
        }
      } else {
        const category = await prisma.categories.findUnique({
          where: { name: shop.category },
          select: { name: true, subcategories: true }
        });
        if (category) {
          categoryname = category.name;
          subcategories = Array.isArray(category.subcategories) ? category.subcategories : [];
        }
      }
    }

    const [ratingSummaries, recentReviewsPayload] = await Promise.all([
      getBusinessRatingSummaries([shop.id]),
      getBusinessReviews(shop.id, { page: 1, limit: 10 }),
    ]);

    const businessSummary = ratingSummaries[shop.id];
    const averageRatingFromReviews = businessSummary?.averageRating ?? 0;
    const fallbackRating = Number(shop.rating) || 0;
    const finalRating = businessSummary?.reviewCount ? averageRatingFromReviews : fallbackRating;
    const reviewCount = businessSummary?.reviewCount || 0;

    // Format the response with image URLs
    const recentReviews = (recentReviewsPayload.reviews || []).map((review) => ({
      ...review,
      user: review.user
        ? {
            ...review.user,
            profilePicture: review.user.profilePicture
              ? getFileUrl(review.user.profilePicture)
              : null,
          }
        : null,
    }));

    const shopWithUrls = {
      ...shop,
      rating: finalRating,
      reviewCount,
      recentReviews,
      categoryname: categoryname,
      subcategories: subcategories,
      image: getFileUrl(shop.image),
      gallery: shop.gallery ? shop.gallery.map(item => ({
        ...item,
        imageUrl: getFileUrl(item.image)
      })) : []
    };

    // Return the shop object directly (not wrapped)
    return NextResponse.json(
      shopWithUrls,
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching shop:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch shop" },
      { status: 500 }
    );
  }
};

