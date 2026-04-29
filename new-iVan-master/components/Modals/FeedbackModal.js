"use client";
import { useState } from "react";
import { FiX, FiStar, FiClock, FiUser, FiCheckCircle } from "react-icons/fi";
import toast from "react-hot-toast";
import { fullDateFormate, getServiceName, getFileUrl } from "@/utils/helper";
import { useTranslations } from "next-intl";

function FeedbackModal({ feedback, isOpen, onClose, onFeedbackSubmitted }) {
  const t = useTranslations("VisitorPages.feedback");
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !feedback) return null;

  const { jobDetails, orderDetails, reservationDetails } = feedback;
  const provider = jobDetails?.acceptedBy;
  const business = orderDetails?.shop || reservationDetails?.restaurant;
  const itemType = feedback?.itemType;

  const handleStarClick = (starRating) => {
    setRating(starRating);
  };

  const handleStarHover = (starRating) => {
    setHoveredRating(starRating);
  };

  const handleStarLeave = () => {
    setHoveredRating(0);
  };

  const handleSubmit = async (action) => {
    if (action === 'submit' && rating === 0) {
      toast.error(t("messages.rating_required"));
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/feedbacks/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          feedbackId: feedback.id,
          rating: action === 'submit' ? rating : null,
          feedback: action === 'submit' ? feedbackText : null,
          action: action
        }),
      });

      const data = await response.json();

      if (response.ok) {
        if (action === 'submit') {
          toast.success(data.message);
        } 
        onFeedbackSubmitted?.(feedback.id);
        onClose();
      } else {
        toast.error(data.error || t("messages.submit_error"));
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast.error(t("messages.submit_error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const modalTitle =
    itemType === "order"
      ? "Rate Your Order"
      : itemType === "reservation"
      ? "Rate Your Reservation"
      : t("title");

  const completedLabel =
    itemType === "order"
      ? "Delivered on"
      : itemType === "reservation"
      ? "Service date"
      : t("job_details.completed_on");

  const completedValue =
    itemType === "order"
      ? fullDateFormate(orderDetails?.deliveredAt || orderDetails?.createdAt)
      : itemType === "reservation"
      ? fullDateFormate(reservationDetails?.completedAt || reservationDetails?.reservationDate)
      : fullDateFormate(jobDetails?.updatedAt);

  const itemTitle =
    itemType === "order"
      ? `Order #${orderDetails?.id?.slice?.(0, 8) || ""}`
      : itemType === "reservation"
      ? `${reservationDetails?.restaurant?.name || "Reservation"}`
      : jobDetails?.title;

  const itemSubtitle =
    itemType === "order"
      ? `${orderDetails?.shop?.name || ""}`
      : itemType === "reservation"
      ? `${reservationDetails?.reservationTime || ""}`
      : getServiceName(jobDetails?.category);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4 animate-fadeIn">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl relative z-[10000] max-h-[95dvh] overflow-hidden animate-slideUp">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-0">{modalTitle}</h2>
              <p className="text-gray-600 text-sm mb-0">{t("subtitle")}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-full"
            >
              <FiX className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="!p-6 overflow-y-auto max-h-[calc(90vh-100px)] space-y-4">
          {/* Job Details Card */}
          <div>
            <div className="flex items-start space-x-4">
              {/* Job Icon */}
              <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg flex-shrink-0">
                <FiCheckCircle className="w-6 h-6 text-green-600" />
              </div>
              
              {/* Job Info */}
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-2">{itemTitle}</h3>
                <p className="text-sm text-gray-600 capitalize mb-2">{itemSubtitle}</p>
                
              
                
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <FiClock className="w-4 h-4" />
                  <span>{completedLabel} {completedValue}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Service Provider Section */}
            {(provider || business) && (
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                            <label className="block text-lg font-semibold text-gray-900 mb-3">
              {t("rating.label")} {t("rating.required")}
            </label>
                <div className="flex flex-col items-center justify-center space-y-3">
                  {/* Provider Profile Image - Top */}
                  <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center flex-shrink-0">
                    {(provider?.profilePicture || business?.image) ? (
                      <img 
                        src={getFileUrl(provider?.profilePicture || business?.image)} 
                        alt={`${provider?.firstName || business?.name || "Business"} ${provider?.lastName || ""}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div 
                      className="w-full h-full bg-gray-300 flex items-center justify-center text-gray-600 text-2xl font-bold"
                      style={{ display: (provider?.profilePicture || business?.image) ? 'none' : 'flex' }}
                    >
                      {(provider?.firstName?.charAt(0) || business?.name?.charAt(0) || "B").toUpperCase()}
                    </div>
                  </div>
                  
                  {/* Provider Name - Bottom */}
                  <div className="text-center">
                    <h5 className="text-lg font-semibold text-gray-900 mb-1">
                      {provider ? `${provider.firstName} ${provider.lastName}` : business?.name}
                    </h5>
                  </div>
                </div>
                <div className="flex justify-center space-x-2 mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => handleStarClick(star)}
                  onMouseEnter={() => handleStarHover(star)}
                  onMouseLeave={handleStarLeave}
                  className="focus:outline-none transition-all duration-200 hover:scale-110"
                >
                  <FiStar
                    className={`w-10 h-10 ${
                      star <= (hoveredRating || rating)
                        ? 'text-yellow-400 fill-current'
                        : 'text-gray-300 hover:text-yellow-200'
                    }`}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <div className="text-center">
                <p className="text-lg font-medium text-gray-800 mb-0">
                  {rating === 1 && t("rating.poor")}
                  {rating === 2 && t("rating.fair")}
                  {rating === 3 && t("rating.good")}
                  {rating === 4 && t("rating.very_good")}
                  {rating === 5 && t("rating.excellent")}
                </p>
              </div>
            )}
              </div>
            )}


          {/* Feedback Text */}
          <div>
            <label className="block text-lg font-semibold text-gray-900 mb-2">
              {t("comments.label")}
            </label>
            <textarea
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder={t("comments.placeholder")}
              className="w-full !px-4 !py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-colors"
              rows={4}
              maxLength={500}
            />
            <p className="text-sm text-gray-500 mt-2 text-right mb-0">
              {t("comments.character_count", { count: feedbackText.length })}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4">
            <button
              onClick={() => handleSubmit('skip')}
              disabled={isSubmitting}
              className="flex-1 px-6 !py-3 text-base font-medium text-gray-700 bg-gray-100 border-2 border-gray-300 rounded-lg hover:bg-gray-200 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {isSubmitting ? t("actions.processing") : t("actions.skip")}
            </button>
            <button
              onClick={() => handleSubmit('submit')}
              disabled={isSubmitting || rating === 0}
              className="flex-1 px-6 !py-3 text-base font-medium text-white bg-blue-600 border-2 border-blue-600 rounded-lg hover:bg-blue-700 hover:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {isSubmitting ? t("actions.submitting") : t("actions.submit")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FeedbackModal;
