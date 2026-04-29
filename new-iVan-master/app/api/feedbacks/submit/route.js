import { NextResponse } from "next/server";
import { submitFeedback, skipFeedback } from "@/utils/feedbackService";

export async function POST(req) {
  try {
    const userId = req.headers.get("user-id");
    const { feedbackId, rating, feedback, action } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 401 });
    }

    if (!feedbackId) {
      return NextResponse.json({ error: "Feedback ID is required" }, { status: 400 });
    }

    let result;
    
    if (action === 'skip') {
      result = await skipFeedback(feedbackId, userId);
    } else {
      // Validate rating if provided
      if (rating && (rating < 1 || rating > 5)) {
        return NextResponse.json(
          { error: "Rating must be between 1 and 5" },
          { status: 400 }
        );
      }

      result = await submitFeedback(feedbackId, { rating, feedback, userId });
    }
    
    return NextResponse.json({
      success: true,
      data: result,
      message: action === 'skip' ? 'Feedback skipped successfully' : 'Feedback submitted successfully'
    });
  } catch (error) {
    console.error("Error submitting feedback:", error);
    return NextResponse.json(
      { error: error.message || "Failed to submit feedback" },
      { status: 500 }
    );
  }
}
