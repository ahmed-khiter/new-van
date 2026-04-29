import { NextResponse } from "next/server";
import { getPendingFeedbacks } from "@/utils/feedbackService";
import { getFileUrl } from "@/utils/helper";

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const userId = req.headers.get("user-id");
    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 401 });
    }

    const pendingFeedbacks = await getPendingFeedbacks(parseInt(userId));
    
    // Process feedbacks to include full profile picture URLs
    const processedFeedbacks = pendingFeedbacks.map(feedback => {
      if (feedback.jobDetails?.acceptedBy) {
        return {
          ...feedback,
          jobDetails: {
            ...feedback.jobDetails,
            acceptedBy: {
              ...feedback.jobDetails.acceptedBy,
              profilePicture: feedback.jobDetails.acceptedBy.profilePicture 
                ? getFileUrl(feedback.jobDetails.acceptedBy.profilePicture)
                : null
            }
          }
        };
      }
      return feedback;
    });
    
    // Return only the first pending feedback
    const firstFeedback = processedFeedbacks.length > 0 ? processedFeedbacks[0] : null;
    
    return NextResponse.json({
      success: true,
      data: firstFeedback,
      hasMore: processedFeedbacks.length > 1,
      totalCount: processedFeedbacks.length
    });
  } catch (error) {
    console.error("Error fetching pending feedbacks:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch pending feedbacks" },
      { status: 500 }
    );
  }
}
