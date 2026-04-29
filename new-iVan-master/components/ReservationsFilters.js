"use client";
import { useCategories } from "@/hooks/useCategories";
import { getFileUrl } from "@/utils/helper";
import { useTranslations } from "next-intl";
import { useMemo, useState } from 'react';

const ReservationsFilters = ({ serviceType, selectedService, onSelectService, showTitle = false }) => {
  const t = useTranslations("ReservationsPage");
  const [showMorePopup, setShowMorePopup] = useState(false);
  
  // Fetch categories from API based on serviceType
  const { categories, loading: categoriesLoading } = useCategories(serviceType);
  
  // Get title based on service type
  const getTitle = () => {
    const titleMap = {
      restaurant: t("select_restaurant_service") || "Select your cuisine",
      spa: t("select_spa_service") || "Choose a spa treatment",
      mot: t("select_mot_service") || "Choose a service",
      shisha: t("select_shisha_service") || "Choose a service",
      beauty: t("select_beauty_service") || "Choose a beauty category",
      healthcare: t("select_healthcare_service") || "Choose a healthcare service",
      events: t("select_events_service") || "Choose an event service",
      entertainment: t("select_entertainment_service") || "Choose an entertainment option",
      shop: t("select_shop_service") || "Choose a shop category",
    };
    return titleMap[serviceType] || "Choose a service";
  };

  // Get selected color based on service type
  const getSelectedColor = () => {
    const colorMap = {
      shop: "#00403f", // Yellow/Orange for shops
      restaurant: "#d44b14", // Orange/Red for restaurants
      spa: "#667eea", // Purple for spa
      mot: "#f093fb", // Pink for MOT
      beauty: "#fa709a", // Pink for beauty
      shisha: "#4facfe", // Blue for shisha
      healthcare: "#43e97b", // Green for healthcare
      events: "#fa8bff", // Purple for events
      entertainment: "#ff9a9e", // Pink for entertainment
    };
    return colorMap[serviceType] || "#d44b14"; // Default to restaurant color
  };
  
  // Transform categories from API into the format expected by the component
  const pricingData = useMemo(() => {
    if (categoriesLoading || !categories || categories.length === 0) {
      return null;
    }
    
    // Map categories to items format
    const items = categories.map((category) => ({
      id: String(category.id),
      name: category.name,
      image: category.image ? getFileUrl(category.image) : null,
      categoryId: category.id,
    }));
    
    return {
      title: getTitle(),
      items: items,
    };
  }, [categories, categoriesLoading, serviceType, t]);

  // Show loading state
  if (categoriesLoading) {
    return (
      <div className="mb-1 pt-2">
       
        <div className="flex gap-3 sm:gap-4 overflow-x-auto scrollbar-hide">
          <div className="flex-shrink-0 w-[85px] rounded-xl overflow-hidden">
            {/* Image Section */}
            <div className="w-full h-[65px] bg-gray-200 overflow-hidden relative rounded-t-xl flex items-center justify-center">
              <div className="spinner-border spinner-border-sm text-gray-400" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
            {/* Label Section */}
            <div className="min-h-[36px] px-1 py-[5px] flex items-center justify-center rounded-b-xl bg-gray-200">
              <span className="font-bold text-[10.5px] text-center text-gray-600">Loading...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show nothing if no categories
  if (!pricingData || !pricingData.items || pricingData.items.length === 0) {
    return null;
  }

  return (
    <>
    
    {showTitle && (
      <div className="mb-1">
        <div className="flex items-center justify-center gap-2">
          <div className="flex-1 h-px bg-gray-200"></div>
          <h2 className="text-base font-medium text-gray-500">{pricingData.title}</h2>
          <div className="flex-1 h-px bg-gray-200"></div>
        </div>
      </div>
    )}
      <div className="flex gap-2 pt-2 sm:gap-4 overflow-x-auto scrollbar-hide">
  
        {pricingData.items.map((item) => {
          const isSelected = selectedService?.id === item.id || selectedService?.categoryId === item.categoryId;
          const isMoreCategory = item.name?.toLowerCase() === "more";
          return (
            <div
              key={item.id}
              onClick={() => {
                if (isMoreCategory) {
                  setShowMorePopup(true);
                } else {
                  onSelectService(item);
                }
              }}
              className="flex-shrink-0 w-[85px] rounded-xl overflow-hidden cursor-pointer transition-all hover:opacity-90"
            >
              {/* Image Section */}
              <div className="w-full h-[65px] bg-gray-200 overflow-hidden relative rounded-t-xl">
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '';
                      e.target.style.display = 'none';
                      const fallback = e.target.nextElementSibling;
                      if (fallback) fallback.style.display = 'flex';
                    }}
                  />
                ) : null}
              </div>
              
              {/* Label Section - Button-like appearance, fixed height so single-word cards match multi-line */}
              <div
                className={`min-h-[36px] px-1 py-[5px] flex items-center justify-center rounded-b-xl transition-colors ${
                  isSelected
                    ? ""
                    : "bg-gray-200"
                }`}
                style={{
                  backgroundColor: isSelected ? getSelectedColor() : undefined
                }}
              >
                <div className="flex items-center gap-1 flex-1 min-w-0 justify-center">
                  <span
                    className={`font-bold text-[10.5px] text-center leading-tight line-clamp-2 ${
                      isSelected ? "text-white" : "text-gray-700"
                    }`}
                    style={{ maxWidth: '80px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
                  >
                    {item.name}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* More Services Popup */}
      {showMorePopup && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4"
          onClick={() => setShowMorePopup(false)}
        >
          <div 
            className="w-full max-w-md bg-white rounded-2xl shadow-2xl relative z-[10000] animate-slideUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-[#00483D] text-white p-4 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold">
                  <i className="fa fa-info-circle text-white me-2" aria-hidden="true"></i>
                  Coming Soon
                </h3>
                <button
                  onClick={() => setShowMorePopup(false)}
                  className="text-white hover:text-gray-200 transition-colors p-1 hover:bg-white/10 rounded-full"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 pb-6">
              <p className="text-gray-600 leading-relaxed text-center">
                We're working on bringing you even more services
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ReservationsFilters;

