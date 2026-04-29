"use client";
import { FaStar, FaRegStar, FaStarHalfAlt } from "react-icons/fa";

export default function FeedbackSection({ shop }) {
  const rating = Number(shop?.rating || 0);
  const reviewCount = Number(shop?.reviewCount || 0);
  const reviews = Array.isArray(shop?.recentReviews) ? shop.recentReviews : [];

  return (
    <div>
      {/* Summary */}
      <div className="mb-6 flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-[16px] bg-[#f5f5f5]">
          <span className="text-[22px] font-bold text-[#1a1a2e]">{rating > 0 ? rating.toFixed(1) : "—"}</span>
        </div>
        <div>
          <div className="mb-1 flex items-center gap-0.5">
            {[...Array(5)].map((_, i) => {
              const s = i + 1;
              if (rating >= s) return <FaStar key={i} size={16} className="text-amber-400" />;
              if (rating >= s - 0.5) return <FaStarHalfAlt key={i} size={16} className="text-amber-400" />;
              return <FaRegStar key={i} size={16} className="text-[#d1d5db]" />;
            })}
          </div>
          <p className="text-[13px] text-[#6b7280]">
            {reviewCount} review{reviewCount !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Reviews */}
      {reviewCount === 0 ? (
        <div className="flex flex-col items-center py-12 text-center">
          <div className="mb-3 text-4xl">💬</div>
          <p className="text-[14px] text-[#6b7280]">No reviews yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <div key={review.id} className="rounded-[16px] border border-[#f0f0f0] bg-white p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[14px] font-semibold text-[#1a1a2e]">
                  {review?.user?.firstName || "Customer"} {review?.user?.lastName || ""}
                </span>
                <span className="text-[12px] text-[#9ca3af]">
                  {new Date(review.feedbackAt || review.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="mb-2 flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => (
                  i < Number(review.rating || 0)
                    ? <FaStar key={i} size={13} className="text-amber-400" />
                    : <FaRegStar key={i} size={13} className="text-[#d1d5db]" />
                ))}
              </div>
              {review.feedback && (
                <p className="text-[13px] leading-relaxed text-[#6b7280]">{review.feedback}</p>
              )}
              {review.businessReply && (
                <div className="mt-3 rounded-[12px] bg-[#f5f5f5] p-3">
                  <p className="text-[12px] font-semibold text-[#374151]">Business reply</p>
                  <p className="mt-1 text-[13px] text-[#6b7280]">{review.businessReply}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
