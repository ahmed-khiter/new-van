"use client";
import { FaStar, FaStarHalfAlt } from "react-icons/fa";

const FeedbackRating = ({ 
  rating,
  totalCount,
  showAverage = false, 
  showCount = false, 
  showStars = true,
  showDetailed = false,
  size = "sm",
  className = "" 
}) => {

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <FaStar 
          key={i} 
          className={`${size === "sm" ? "w-3 h-3" : size === "md" ? "w-4 h-4" : "w-5 h-5"} text-yellow-400`} 
        />
      );
    }

    if (hasHalfStar) {
      stars.push(
        <FaStarHalfAlt 
          key="half" 
          className={`${size === "sm" ? "w-3 h-3" : size === "md" ? "w-4 h-4" : "w-5 h-5"} text-yellow-400`} 
        />
      );
    }

    const remainingStars = 5 - Math.ceil(rating);
    for (let i = 0; i < remainingStars; i++) {
      stars.push(
        <FaStar 
          key={`empty-${i}`} 
          className={`${size === "sm" ? "w-3 h-3" : size === "md" ? "w-4 h-4" : "w-5 h-5"} text-gray-300`} 
        />
      );
    }

    return stars;
  };

  if (typeof rating !== 'number') {
    return (
      <div className={`flex items-center gap-1 text-gray-400 ${className}`}>
        <span className="text-xs">No ratings</span>
      </div>
    );
  }

  // Show detailed feedback for admin
  if (showDetailed) {
    return (
      <div className={`w-full ${className}`}>
        <div className="space-y-4">
          {feedbackData.feedbacks.map((feedback, index) => (
            <div key={feedback.id} className="bg-gray-50 p-4 rounded-lg border">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    {renderStars(feedback.rating)}
                  </div>
                  <span className="font-medium text-gray-700">
                    {feedback.rating}/5
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {/* Customer Profile Image */}
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                    {feedback.user?.profilePicture ? (
                      <img 
                        src={feedback.user.profilePicture} 
                        alt={`${feedback.user.firstName} ${feedback.user.lastName}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div 
                      className="w-full h-full bg-gray-300 flex items-center justify-center text-gray-600 text-sm font-medium"
                      style={{ display: feedback.user?.profilePicture ? 'none' : 'flex' }}
                    >
                      {feedback.user?.firstName?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    {feedback.user?.firstName} {feedback.user?.lastName}
                  </div>
                </div>
              </div>
              {feedback.feedback && (
                <div className="mt-2">
                  <p className="text-gray-700 text-sm italic">
                    "{feedback.feedback}"
                  </p>
                </div>
              )}
              <div className="text-xs text-gray-400 mt-2">
                {new Date(feedback.feedbackAt).toLocaleDateString()} at {new Date(feedback.feedbackAt).toLocaleTimeString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Show simple feedback for non-admin users
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {showStars && (
        <div className="flex items-center gap-0.5">
              <p className="text-gray-500 text-sm mb-0">Feedback</p>:{renderStars(rating)}
        </div>
      )}
      {showAverage && (
        <span className={`font-medium text-gray-700 ${size === "sm" ? "text-xs" : size === "md" ? "text-sm" : "text-base"}`}>
          {rating}
        </span>
      )}
      {showCount && (
        <span className={`text-gray-500 ${size === "sm" ? "text-xs" : size === "md" ? "text-sm" : "text-base"}`}>
          ({typeof totalCount === 'number' ? totalCount : 1})
        </span>
      )}
    </div>
  );
};

export default FeedbackRating;
