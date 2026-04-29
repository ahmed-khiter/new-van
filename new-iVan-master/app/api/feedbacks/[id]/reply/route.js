import { NextResponse } from "next/server";
import { replyToFeedback } from "@/utils/feedbackService";

export const dynamic = "force-dynamic";

export async function PATCH(req, { params }) {
  try {
    const userId = req.headers.get("user-id");
    const role = req.headers.get("role");
    const feedbackId = params.id;
    const { reply } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 401 });
    }

    if (!["shop-owner", "restaurant", "provider"].includes(role || "")) {
      return NextResponse.json(
        { error: "Only businesses can reply to reviews" },
        { status: 403 },
      );
    }

    if (!feedbackId) {
      return NextResponse.json({ error: "Feedback ID is required" }, { status: 400 });
    }

    if (reply && String(reply).length > 1000) {
      return NextResponse.json(
        { error: "Reply must be less than or equal to 1000 characters" },
        { status: 400 },
      );
    }

    const updated = await replyToFeedback(feedbackId, userId, reply);
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Error replying to feedback:", error);
    return NextResponse.json(
      { error: error.message || "Failed to reply to feedback" },
      { status: 500 },
    );
  }
}
