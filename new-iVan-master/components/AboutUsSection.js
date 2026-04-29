"use client";
import { useTranslations } from "next-intl";
import { PiMapPinLight } from "react-icons/pi";
import { MdAccessTime, MdPhone } from "react-icons/md";
import { FaCheckCircle } from "react-icons/fa";

export default function AboutUsSection({ shop }) {
  const t = useTranslations("ReservationPage");

  if (!shop) return null;

  const formatTime = (time) => (time ? time.substring(0, 5) : "");

  const processOpeningHours = () => {
    const openingHours = shop.shop_metadata?.openingHours || shop.openingHours;
    if (Array.isArray(openingHours)) return openingHours;
    if (openingHours && typeof openingHours === "object") {
      const dayLabels = {
        monday: t("days.monday"), tuesday: t("days.tuesday"), wednesday: t("days.wednesday"),
        thursday: t("days.thursday"), friday: t("days.friday"), saturday: t("days.saturday"), sunday: t("days.sunday"),
      };
      return Object.keys(openingHours).map((dayKey) => {
        const d = openingHours[dayKey];
        return d?.open || d?.close ? { day: dayKey, label: dayLabels[dayKey] || dayKey, open: d.open || "", close: d.close || "" } : null;
      }).filter(Boolean);
    }
    return [];
  };

  const hoursArray = processOpeningHours();

  const handleAddressClick = () => {
    const fullAddress = [shop.address1, shop.address2, shop.city, shop.postCode, shop.country].filter(Boolean).join(", ");
    if (fullAddress) window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="space-y-6">
      {/* Address */}
      {(shop.address1 || shop.city) && (
        <div className="rounded-[16px] border border-[#f0f0f0] bg-white p-5">
          <div className="mb-3 flex items-center gap-2 text-[15px] font-semibold text-[#1a1a2e]">
            <PiMapPinLight size={18} className="text-[#6b7280]" />
            {t("address")}
          </div>
          <button onClick={handleAddressClick} className="text-[14px] text-[#6b7280] underline underline-offset-2 transition hover:text-[#1a1a2e]">
            {[shop.address1, shop.city, shop.postCode].filter(Boolean).join(", ")}
          </button>
        </div>
      )}

      {/* Opening hours */}
      {hoursArray.length > 0 && (
        <div className="rounded-[16px] border border-[#f0f0f0] bg-white p-5">
          <div className="mb-4 flex items-center gap-2 text-[15px] font-semibold text-[#1a1a2e]">
            <MdAccessTime size={18} className="text-[#6b7280]" />
            {t("opening_hours")}
          </div>
          <div className="space-y-2">
            {hoursArray.map((d, i) => {
              const hasHours = d.open && d.close;
              return (
                <div key={`${d.day}-${i}`} className="flex items-center justify-between text-[14px]">
                  <span className="font-medium text-[#374151]">{d.label || d.day}</span>
                  {hasHours ? (
                    <span className="text-[#6b7280]">{formatTime(d.open)} – {formatTime(d.close)}</span>
                  ) : (
                    <span className="text-[#9ca3af]">{t("closed")}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Contact */}
      {shop.phone && (
        <div className="rounded-[16px] border border-[#f0f0f0] bg-white p-5">
          <div className="mb-3 flex items-center gap-2 text-[15px] font-semibold text-[#1a1a2e]">
            <MdPhone size={18} className="text-[#6b7280]" />
            {t("contact_number")}
          </div>
          <a href={`tel:${shop.phone}`} className="text-[14px] font-medium text-[#1a1a2e] no-underline hover:underline">{shop.phone}</a>
        </div>
      )}

      {/* Halal */}
      {shop.shop_metadata?.halal && (
        <div className="rounded-[16px] border border-[#f0f0f0] bg-white p-5">
          <div className="flex items-center gap-2 text-[15px] font-semibold text-[#1a1a2e]">
            <FaCheckCircle size={16} className="text-emerald-500" />
            {t("halal_status")}
          </div>
          <span className="mt-2 inline-block rounded-full bg-emerald-50 px-3 py-1 text-[13px] font-semibold text-emerald-700">
            {t("halal")}
          </span>
        </div>
      )}
    </div>
  );
}
