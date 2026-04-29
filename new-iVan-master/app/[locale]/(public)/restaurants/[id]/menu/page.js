"use client";
import ShopHeaderCard from "@/components/ShopHeaderCard";
import RestaurantMenuContent from "@/components/RestaurantMenuContent";
import AboutUsSection from "@/components/AboutUsSection";
import Gallery from "@/components/Gallery";
import DeliveryInfoBanner from "@/components/DeliveryInfoBanner";
import FeedbackSection from "@/components/FeedbackSection";
import { useRouter } from "@/i18n/routing";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useEffect, useMemo } from "react";
import toast from "react-hot-toast";
import { FaArrowLeft } from "react-icons/fa";
import Image from "next/image";
import { GoArrowLeft } from "react-icons/go";
import { calculateDistance, calculateDeliveryTimeMinutes } from "@/utils/helper";

export default function RestaurantMenuPage() {
  const { id } = useParams();
  const router = useRouter();
  const t = useTranslations("RestaurantMenuPage");
  const tReservation = useTranslations("ReservationPage");
  const [isLoading, setIsLoading] = useState(true);
  const [restaurant, setRestaurant] = useState(null);
  const [activeTab, setActiveTab] = useState('menu');
  const [selectedLocation, setSelectedLocation] = useState(null);

  const deliveryTimeMinutes = useMemo(() => {
    if (!restaurant) return null;

    if (restaurant.distance !== null && restaurant.distance !== undefined) {
      return calculateDeliveryTimeMinutes(restaurant.distance);
    }

    const distance = calculateDistance(
      selectedLocation?.lat,
      selectedLocation?.lng,
      restaurant?.latitude,
      restaurant?.longitude
    );

    return distance !== null ? calculateDeliveryTimeMinutes(distance) : null;
  }, [restaurant, selectedLocation]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const savedLocation = localStorage.getItem("selectedLocation");
    if (!savedLocation) return;

    try {
      setSelectedLocation(JSON.parse(savedLocation));
    } catch (error) {
      console.error("Error parsing saved location:", error);
    }
  }, []);
  useEffect(() => {
    const fetchRestaurant = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/shops/public/${id}?type=restaurant`);
        if (response.ok) {
          const data = await response.json();
          setRestaurant(data);
        }
      } catch (error) {
        console.error('Error fetching restaurant:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchRestaurant();
    }
  }, [id]);

  const handleBack = () => {
    router.push(`/restaurants?category=all`);
  };

  const handleShare = async () => {
    const shareUrl = window.location.href;

    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
        toast.success(t('link_copied'));
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = shareUrl;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        toast.success(t('link_copied'));
      }
    } catch (err) {
      console.log('Error copying to clipboard:', err);
      toast.error(t('failed_copy_link'));
    }
  };

  return (
    <>
      <div className="min-h-screen bg-white">
      <div className="container">
        {/* Header */}
        <div className="relative mt-4">
          <button
            onClick={handleBack}
            className="absolute left-3 top-3 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition hover:bg-black/60 sm:hidden"
            aria-label="Go back"
          >
            <GoArrowLeft className="h-4 w-4" />
          </button>
          <ShopHeaderCard
            shop={restaurant}
            isLoading={isLoading}
            onShare={handleShare}
            type="restaurant"
            showReservationButton={true}
            reservationRoute={`/reservations/${id}`}
          />
        </div>
        <div className="mb-4 mt-4">
          <DeliveryInfoBanner deliveryTimeMinutes={deliveryTimeMinutes} />
        </div>

        {/* Tabs */}
        <div className="mb-5">
          <div className="inline-flex gap-0.5 rounded-full bg-[#f0f0f0] p-1">
            {[
              { key: "menu", label: t("menu"), icon: (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/></svg>
              )},
              { key: "about", label: tReservation("about_us"), icon: (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
              )},
              { key: "gallery", label: tReservation("gallery"), icon: (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
              )},
              { key: "feedback", label: tReservation("feedback"), icon: (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              )},
            ].map(({ key, label, icon }) => {
              const isActive = activeTab === key;
              return (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`flex items-center gap-1.5 rounded-full py-1.5 text-[13px] font-semibold whitespace-nowrap transition-all ${
                    isActive
                      ? "bg-white px-4 text-[#1a1a2e] shadow-sm"
                      : "px-2.5 text-[#9ca3af] hover:text-[#6b7280]"
                  }`}
                >
                  {icon}
                  {isActive && label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="pb-10">
          {activeTab === "menu" && (
            <RestaurantMenuContent restaurantId={id} hideHeader={false} shopData={restaurant} />
          )}

          {activeTab === "about" && <AboutUsSection shop={restaurant} />}

          {activeTab === "gallery" && (
            <Gallery
              images={restaurant?.gallery || []}
              isLoading={isLoading}
              emptyMessage="No gallery images available"
            />
          )}

          {activeTab === "feedback" && (
            <FeedbackSection shop={restaurant} />
          )}
        </div>
      </div>
      </div>
    </>
  );
}

