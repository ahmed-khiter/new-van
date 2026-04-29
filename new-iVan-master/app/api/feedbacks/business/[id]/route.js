import { NextResponse } from "next/server";
import { getBusinessRatingSummaries, getBusinessReviews } from "@/utils/reviewService";
import { getFileUrl } from "@/utils/helper";

export const dynamic = "force-dynamic";

export async function GET(req, { params }) {
  try {
    const businessId = params.id;
    if (!businessId) {
      return NextResponse.json({ error: "Business ID is required" }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get("page") || 1);
    const limit = Number(searchParams.get("limit") || 10);

    const [summaryMap, reviewsPayload] = await Promise.all([
      getBusinessRatingSummaries([businessId]),
      getBusinessReviews(businessId, { page, limit }),
    ]);

    const summary = summaryMap[businessId] || { averageRating: 0, reviewCount: 0 };

    const reviews = (reviewsPayload.reviews || []).map((review) => ({
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

    return NextResponse.json({
      success: true,
      summary,
      ...reviewsPayload,
      reviews,
    });
  } catch (error) {
    console.error("Error fetching business feedbacks:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch business feedbacks" },
      { status: 500 },
    );
  }
}
