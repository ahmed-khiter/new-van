"use client";
import { useEffect, useState } from "react";
import { useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { isShopClosed, getTodayOpeningHours, getNextDayOpenTime, isNewItem, getShopBannerGradient } from "@/utils/helper";
import { MdShare } from "react-icons/md";
import { PiMapPinLight } from "react-icons/pi";

import StarRatingModal from "@/components/Modals/StarRatingModal";
import DeliveryLocationModal from "@/components/Modals/DeliveryLocationModal";


export default function ShopHeaderCard({
  shop,
  isLoading,
  onShare,
  type = "shop",
  showReservationButton = false,
  reservationRoute = null,
  setRating,
}) {
  const router = useRouter();
  const t = useTranslations(
    type === "restaurant" ? "RestaurantMenuPage" : "ShopProductsPage"
  );
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [isDeliveryLocationModalOpen, setIsDeliveryLocationModalOpen] =
    useState(false);

  const handleOpenGoogleMaps = () => {
    const address = [shop.address1, shop.city, shop.country]
      .filter(Boolean)
      .join(", ");
    if (address) {
      const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        address
      )}`;
      window.open(googleMapsUrl, "_blank");
    }
  };

  useEffect(() => {
    if (typeof setRating === "function") {
      setRating(shop?.rating ? parseFloat(shop.rating) : 0);
    }
  }, [shop, setRating]);



  if (isLoading) {
    return (
      <div className="relative">
        <div className="h-[220px] w-full animate-pulse bg-gray-200 sm:h-[340px]" />
        <div className="mx-auto mt-3 rounded-[20px] bg-white px-6 py-5 shadow-sm">
          <div className="mb-3 h-7 w-2/5 animate-pulse rounded bg-gray-100" />
          <div className="mb-2 flex gap-2">
            <div className="h-4 w-20 animate-pulse rounded bg-gray-100" />
            <div className="h-4 w-28 animate-pulse rounded bg-gray-100" />
          </div>
          <div className="h-4 w-3/5 animate-pulse rounded bg-gray-100" />
        </div>
      </div>
    );
  }

  if (!shop) {
    return (
      <h1 className="py-4 text-[20px] font-bold text-[#1a1a2e]">
        {type === "restaurant" ? t("restaurant_menu") : t("shop_products")}
      </h1>
    );
  }

  const averageRating = Number(shop?.rating || 0);
  const reviewCount = Number(shop?.reviewCount || 0);
  const hasRatings = reviewCount > 0 || averageRating > 0;

  return (
    <div className="relative">
      {/* Hero image — contained, rounded, with glass card floating over the bottom */}
      <div className="relative h-[240px] overflow-hidden rounded-[20px] sm:h-[300px] md:h-[340px]">
        {shop.image ? (
          <img
            src={shop.image}
            alt={shop.name}
            className="h-full w-full object-cover"
            onError={(e) => { e.target.style.display = "none"; }}
          />
        ) : (
          <div className="h-full w-full" style={{ background: getShopBannerGradient(shop?.type) }} />
        )}

        {/* Scrim */}
        <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-black/70 to-transparent" />

        {/* NEW badge — top left */}
        {isNewItem(shop?.createdAt) && (
          <span className="absolute left-3 top-3 rounded-full bg-black/60 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-sm">
            {t("new_badge")}
          </span>
        )}

        {/* Category badge — top right */}
        {shop?.categoryname && (
          <span className="absolute right-3 top-3 rounded-full bg-black/50 px-2.5 py-0.5 text-[10px] font-semibold text-white/90 backdrop-blur-sm">
            {shop.categoryname}
          </span>
        )}

        {/* Share button */}
        {onShare && (
          <button onClick={onShare} className="absolute bottom-3 right-3 flex h-7 w-7 items-center justify-center rounded-full bg-white/15 text-white/70 backdrop-blur-sm transition hover:bg-white/25">
            <MdShare size={13} />
          </button>
        )}

        {/* Glass info card — floats over the bottom of the image */}
        <div className="absolute inset-x-3 bottom-3 rounded-[14px] bg-black/65 px-3.5 py-3 backdrop-blur-md">
          {/* Name */}
          <h1 className="pr-8 text-[1rem] font-bold leading-snug tracking-[-0.01em] text-white sm:text-[1.1rem]">
            {shop.name}
          </h1>

          {/* Meta row */}
          <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[11.5px]">
            <button onClick={() => setIsRatingModalOpen(true)} className="flex items-center gap-1 transition hover:opacity-70">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="#facc15" stroke="#facc15" strokeWidth="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              <span className="text-white/60 underline underline-offset-2">
                {hasRatings ? `${averageRating.toFixed(1)} (${reviewCount})` : "No ratings yet"}
              </span>
            </button>

            {(() => {
              const openingHours = shop?.shop_metadata?.openingHours;
              const todayHours = getTodayOpeningHours(openingHours);
              const isClosed = isShopClosed(openingHours);
              if (!todayHours?.open || !todayHours?.close) return null;
              return (
                <span className="flex items-center gap-1">
                  <span className={`h-1.5 w-1.5 rounded-full ${isClosed ? "bg-red-400" : "bg-emerald-400"}`} />
                  <span style={{ color: isClosed ? "#fca5a5" : "#86efac" }}>
                    {isClosed
                      ? (() => {
                          const next = getNextDayOpenTime(openingHours);
                          return next?.open ? `${t("closed")} · ${t("opens_at", { time: next.open.substring(0, 5) })}` : t("closed");
                        })()
                      : t("open_closes", { time: todayHours.close.substring(0, 5) })}
                  </span>
                </span>
              );
            })()}

            {shop.shop_metadata?.halal && (
              <span className="rounded-full bg-emerald-500/20 px-1.5 py-px text-[10px] font-semibold text-emerald-300">Halal</span>
            )}

            {(shop.address1 || shop.city) && (
              <button onClick={handleOpenGoogleMaps} className="flex items-center gap-0.5 text-white/35 transition hover:text-white/60">
                <PiMapPinLight size={11} />
                <span className="truncate max-w-[200px]">{[shop.address1, shop.city].filter(Boolean).join(", ")}</span>
              </button>
            )}
          </div>

          {showReservationButton && shop.acceptsReservations && reservationRoute && (
            <div className="mt-1.5">
              <button
                onClick={() => router.push(reservationRoute)}
                className="flex h-6 items-center gap-1.5 rounded-full bg-white/10 px-3 text-[11px] font-semibold text-white transition hover:bg-white/20"
              >
                Switch to Reservation
              </button>
            </div>
          )}
        </div>
      </div>

      <StarRatingModal
        isOpen={isRatingModalOpen}
        onClose={() => setIsRatingModalOpen(false)}
        title="Rating"
        subtitle={`${shop?.name || "This restaurant"}`}
        rating={averageRating}
        isStatic={true}
      />

      <DeliveryLocationModal
        isOpen={isDeliveryLocationModalOpen}
        onClose={() => setIsDeliveryLocationModalOpen(false)}
        onConfirm={(location) => {
          router.push(`/restaurants/${shop.id}/menu`);
        }}
        restaurant={shop}
      />
    </div>
  );
}
