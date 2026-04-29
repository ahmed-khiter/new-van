"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { FaArrowLeft, FaHome, FaBriefcase, FaHeart, FaApple } from "react-icons/fa";
import { IoTimeOutline, IoSearchOutline, IoLocationSharp } from "react-icons/io5";
import { HiOutlineClock } from "react-icons/hi";
import { MdMyLocation } from "react-icons/md";
import toast from "react-hot-toast";

// Mapbox token must come from env (never hardcode secrets).
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || "";

const RIDE_TIERS = [
  { id: "bike", nameKey: "swippedBike", price: "4.50", eta: "3", features: ["1 seat", "Fast"], badge: null },
  { id: "comfort", nameKey: "swippedComfort", price: "16.80", eta: "5", features: ["4 seats", "Comfy"], badge: "Popular" },
];

function BikeIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={className}>
      <circle cx="16" cy="44" r="10" stroke="currentColor" strokeWidth="3" />
      <circle cx="48" cy="44" r="10" stroke="currentColor" strokeWidth="3" />
      <path d="M16 44L28 20H38L48 44" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M28 20L32 44H48" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="28" cy="20" r="3" fill="currentColor" />
    </svg>
  );
}

function CarIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={className}>
      <path d="M8 38V46C8 47.1 8.9 48 10 48H16C17.1 48 18 47.1 18 46V44H46V46C46 47.1 46.9 48 48 48H54C55.1 48 56 47.1 56 46V38" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 38H56V32C56 30.9 55.1 30 54 30H10C8.9 30 8 30.9 8 32V38Z" stroke="currentColor" strokeWidth="2.5" />
      <path d="M12 30L17 18H47L52 30" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20 18V14H44V18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="16" cy="36" r="2.5" fill="currentColor" />
      <circle cx="48" cy="36" r="2.5" fill="currentColor" />
      <line x1="22" y1="36" x2="42" y2="36" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

const RECENT_PLACES = [
  { name: "Westfield Shopping Centre", address: "Ariel Way, W12 7GF" },
];

function FadeIn({ children, delay = 0, className = "" }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  return (
    <div className={`transition-all duration-500 ease-out ${className} ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"}`}>
      {children}
    </div>
  );
}

function GradientCTA({ onClick, disabled, children, className = "" }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full h-[50px] rounded-xl text-[15px] font-semibold text-white transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_2px_10px_rgba(230,30,77,0.25)] hover:shadow-[0_4px_18px_rgba(230,30,77,0.35)] ${className}`}
      style={{ background: disabled ? "#D1D5DB" : "linear-gradient(to right, #E61E4D 0%, #E31C5F 50%, #D70466 100%)" }}
    >
      {children}
    </button>
  );
}

// Lazy-loads mapbox-gl to avoid SSR issues
function MapboxMap({ className = "" }) {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    if (mapRef.current || !mapContainer.current) return;

    let cancelled = false;

    import("mapbox-gl").then((mapboxgl) => {
      if (cancelled || !mapContainer.current) return;

      import("mapbox-gl/dist/mapbox-gl.css");

      if (!MAPBOX_TOKEN) {
        console.error("Missing NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN for Mapbox.");
        return;
      }

      mapboxgl.default.accessToken = MAPBOX_TOKEN;
      const map = new mapboxgl.default.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/light-v11",
        center: [-0.1278, 51.5074],
        zoom: 13,
        attributionControl: false,
        logoPosition: "bottom-right",
      });

      map.addControl(new mapboxgl.default.NavigationControl({ showCompass: false }), "bottom-right");
      mapRef.current = map;
    });

    return () => { cancelled = true; mapRef.current?.remove(); mapRef.current = null; };
  }, []);

  return <div ref={mapContainer} className={`w-full h-full ${className}`} />;
}

function RideForm({ showInputs, setShowInputs, pickup, setPickup, dropoff, setDropoff, dropoffRef, onSubmit, t }) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 space-y-3">
        {showInputs ? (
          <FadeIn>
            <div className="rounded-2xl bg-[#F5F5F5] overflow-hidden">
              <div className="flex items-center px-4 h-[46px] gap-3">
                <MdMyLocation className="w-[16px] h-[16px] text-[#E31C5F] flex-shrink-0" />
                <input
                  type="text"
                  value={pickup}
                  onChange={(e) => setPickup(e.target.value)}
                  placeholder={t("pickup")}
                  className="flex-1 text-[14px] text-[#222] placeholder:text-[#AAAAAA] bg-transparent border-none outline-none focus:outline-none focus:ring-0 font-medium"
                />
              </div>
              <div className="mx-4 border-t border-[#E8E8E8]" />
              <div className="flex items-center px-4 h-[46px] gap-3">
                <IoLocationSharp className="w-[16px] h-[16px] text-[#E31C5F] flex-shrink-0" />
                <input
                  ref={dropoffRef}
                  type="text"
                  value={dropoff}
                  onChange={(e) => setDropoff(e.target.value)}
                  placeholder={t("whereTo")}
                  className="flex-1 text-[14px] text-[#222] placeholder:text-[#AAAAAA] bg-transparent border-none outline-none focus:outline-none focus:ring-0 font-medium"
                />
              </div>
            </div>
          </FadeIn>
        ) : (
          <button
            onClick={() => { setShowInputs(true); setTimeout(() => dropoffRef.current?.focus(), 150); }}
            className="w-full flex items-center gap-3 h-[46px] px-4 rounded-2xl bg-[#F5F5F5] hover:bg-[#EEEEEE] transition-colors text-left"
          >
            <IoSearchOutline className="text-[#AAAAAA] text-lg flex-shrink-0" />
            <span className="text-[14px] text-[#AAAAAA]">{t("whereTo")}</span>
          </button>
        )}

        <div className="flex gap-2.5 overflow-x-auto scrollbar-hide">
          {[
            { icon: FaHome, label: t("home") },
            { icon: FaBriefcase, label: t("work") },
            { icon: FaHeart, label: t("savedPlaces") },
          ].map((item, i) => (
            <button key={i} className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#F5F5F5] hover:bg-[#EEEEEE] transition-colors whitespace-nowrap active:scale-[0.97]">
              <item.icon className="w-3.5 h-3.5 text-[#888] flex-shrink-0" />
              <span className="text-[13px] font-medium text-[#444]">{item.label}</span>
            </button>
          ))}
        </div>

        <div className="border-t border-[#F0F0F0]" />

        <p className="text-[11px] font-semibold text-[#AAAAAA] uppercase tracking-[0.08em]">{t("recentSearches")}</p>
        {RECENT_PLACES.map((place, i) => (
          <button key={i} className="w-full flex items-center gap-3 py-1.5 hover:bg-[#FAFAFA] rounded-xl transition-colors text-left">
            <div className="w-9 h-9 rounded-xl bg-[#F5F5F5] flex items-center justify-center flex-shrink-0">
              <IoTimeOutline className="text-[#AAAAAA] text-[15px]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-medium text-[#222] truncate leading-none">{place.name}</p>
              <p className="text-[12px] text-[#AAAAAA] truncate mt-0.5 leading-none">{place.address}</p>
            </div>
          </button>
        ))}
      </div>

      <div className="pt-3 mt-auto">
        <GradientCTA onClick={onSubmit}>{t("continue")}</GradientCTA>
      </div>
    </div>
  );
}

export default function SwippedRidesPage() {
  const router = useRouter();
  const t = useTranslations("PublicPages.swippedRides");

  const [step, setStep] = useState(1);
  const [pickup, setPickup] = useState(t("currentLocation"));
  const [dropoff, setDropoff] = useState("");
  const [selectedRide, setSelectedRide] = useState("comfort");
  const [showInputs, setShowInputs] = useState(false);
  const dropoffRef = useRef(null);

  const pickupLabel = pickup.trim() || t("currentLocation");
  const selectedTier = RIDE_TIERS.find((r) => r.id === selectedRide);
  const handleBack = () => { if (step === 2) setStep(1); else if (showInputs) setShowInputs(false); else router.push("/"); };
  const handleConfirmRide = () => { if (!selectedRide) return; toast.success(t("rideConfirmed")); };

  if (step === 2) {
    return (
      <div className="min-h-[100dvh] bg-white flex flex-col lg:flex-row" style={{ fontFamily: "'Cereal', 'Circular', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" }}>
        {/* Panel */}
        <div className="relative z-10 flex flex-col lg:w-[440px] xl:w-[480px] lg:flex-shrink-0 bg-white lg:border-r lg:border-[#EBEBEB]">
          <div className="flex-1 overflow-y-auto pb-[200px] lg:pb-0">
            <div className="px-6 pt-6 lg:px-8 lg:pt-8">
              {/* Header */}
              <FadeIn>
                <div className="flex items-center gap-4 mb-5">
                  <button onClick={handleBack} className="w-9 h-9 rounded-full flex items-center justify-center border border-[#E5E5E5] hover:bg-[#F5F5F5] transition-all active:scale-95 flex-shrink-0">
                    <FaArrowLeft className="w-3 h-3 text-[#222]" />
                  </button>
                  <h1 className="text-[22px] font-extrabold text-[#222] tracking-[-0.02em] flex-1 text-center">{t("chooseRide")}</h1>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#F5F5F5] flex-shrink-0">
                    <HiOutlineClock className="text-[11px] text-[#666]" />
                    <span className="text-[11px] font-semibold text-[#666]">{selectedTier?.eta || "5"} {t("eta")}</span>
                  </div>
                </div>
              </FadeIn>

              <FadeIn delay={40}>
                <div className="flex items-center gap-2 mb-5">
                  <MdMyLocation className="w-3.5 h-3.5 text-[#E31C5F] flex-shrink-0" />
                  <span className="text-[13px] text-[#888] truncate">{pickupLabel}</span>
                  <span className="text-[#CCC]">→</span>
                  <IoLocationSharp className="w-3.5 h-3.5 text-[#E31C5F] flex-shrink-0" />
                  <span className="text-[13px] text-[#888] truncate">{dropoff.trim() || t("destination")}</span>
                </div>
              </FadeIn>

              <div className="border-t border-[#F0F0F0] mb-4" />

              <div className="space-y-3">
                {RIDE_TIERS.map((tier, index) => {
                  const isSelected = selectedRide === tier.id;
                  const TierIcon = tier.id === "bike" ? BikeIcon : CarIcon;
                  return (
                    <FadeIn key={tier.id} delay={60 * (index + 1)}>
                      <button
                        onClick={() => setSelectedRide(tier.id)}
                        className={`group w-full text-left rounded-2xl border-2 p-4 transition-all duration-200 ${
                          isSelected
                            ? "border-[#E31C5F]/30 bg-[#FFF5F7]"
                            : "border-[#F0F0F0] bg-white hover:border-[#E5E5E5] hover:bg-[#FAFAFA]"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${isSelected ? "bg-white shadow-sm" : "bg-[#F5F5F5] group-hover:bg-[#EEEEEE]"}`}>
                            <TierIcon className={`w-6 h-6 ${isSelected ? "text-[#E31C5F]" : "text-[#999]"}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1.5">
                              <span className="text-[15px] font-semibold text-[#222]">{t(tier.nameKey)}</span>
                              {tier.badge && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 uppercase tracking-wide">{tier.badge}</span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5">
                              {tier.features.map((f, fi) => (
                                <span key={fi} className="text-[11px] text-[#777] bg-[#F0F0F0] px-2 py-0.5 rounded-md font-medium">{f}</span>
                              ))}
                              <span className="text-[11px] text-[#AAA] bg-[#F0F0F0] px-2 py-0.5 rounded-md flex items-center gap-1">
                                <HiOutlineClock className="text-[10px]" />
                                {tier.eta} {t("eta")}
                              </span>
                            </div>
                          </div>
                          <p className={`text-[17px] font-bold tabular-nums flex-shrink-0 ${isSelected ? "text-[#E31C5F]" : "text-[#222]"}`}>
                            &pound;{tier.price}
                          </p>
                        </div>
                      </button>
                    </FadeIn>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer (desktop) */}
          <div className="hidden lg:block border-t border-[#F0F0F0] bg-white px-8 py-4">
            <BottomBar selectedTier={selectedTier} onConfirm={handleConfirmRide} selectedRide={selectedRide} t={t} />
          </div>
        </div>

        {/* Map */}
        <div className="hidden lg:block flex-1 relative">
          <MapboxMap />
          <div className="absolute top-5 left-5 z-10 bg-white rounded-2xl shadow-lg border border-[#EBEBEB] px-4 py-3 min-w-[280px]">
            <div className="flex items-stretch gap-3">
              <div className="flex flex-col items-center">
                <MdMyLocation className="w-3.5 h-3.5 text-[#E31C5F] flex-shrink-0" />
                <span className="w-[1.5px] flex-1 my-0.5 bg-gradient-to-b from-[#E31C5F]/40 to-[#E31C5F]/10" />
                <IoLocationSharp className="w-3.5 h-3.5 text-[#E31C5F] flex-shrink-0" />
              </div>
              <div className="flex flex-col justify-between min-w-0 gap-2">
                <p className="text-[13px] font-medium text-[#222] truncate leading-none">{pickupLabel}</p>
                <div className="border-t border-dashed border-[#EEE]" />
                <p className="text-[13px] font-medium text-[#222] truncate leading-none">{dropoff.trim() || t("destination")}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer (mobile) */}
        <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-white border-t border-[#F0F0F0] px-6 pt-3 pb-4">
          <BottomBar selectedTier={selectedTier} onConfirm={handleConfirmRide} selectedRide={selectedRide} t={t} />
          <div className="h-[env(safe-area-inset-bottom)]" />
        </div>
      </div>
    );
  }

  // Step 1
  return (
    <div className="h-[100dvh] flex flex-col lg:flex-row bg-white overflow-hidden" style={{ fontFamily: "'Cereal', 'Circular', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" }}>
      {/* Map */}
      <div className="relative flex-1 min-h-0">
        <MapboxMap />
        <div className="absolute top-4 left-0 right-0 z-20 flex items-center justify-between px-4">
          <button onClick={handleBack} className="w-9 h-9 rounded-full flex items-center justify-center bg-white shadow-sm hover:shadow-md transition-all active:scale-95 flex-shrink-0">
            <FaArrowLeft className="w-3 h-3 text-[#222]" />
          </button>
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-[#F0F0F0] shadow-sm">
            <span className="relative flex h-1.5 w-1.5 flex-shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
            </span>
            <span className="text-[11px] font-semibold text-[#444]">{t("driversNearby")}</span>
          </div>
          <div className="w-9 flex-shrink-0" aria-hidden />
        </div>
      </div>

      {/* Bottom panel */}
      <div className="relative z-10 -mt-4 lg:mt-0 lg:w-[420px] xl:w-[460px] lg:flex-shrink-0 flex-shrink-0">
        <div className="rounded-t-3xl lg:rounded-none bg-white/80 backdrop-blur-xl lg:border-l lg:border-[#EBEBEB] shadow-[0_-2px_16px_rgba(0,0,0,0.06)] lg:shadow-none h-full flex flex-col">
          <div className="px-6 pt-3 pb-5 lg:pt-8 lg:pb-6 lg:px-8 flex flex-col flex-1 min-h-0">
            <div className="flex justify-center mb-4 lg:hidden">
              <div className="w-10 h-[4px] rounded-full bg-[#DDD]" />
            </div>
            <FadeIn className="hidden lg:block mb-6">
              <h2 className="text-[24px] font-extrabold text-[#222] tracking-[-0.02em]">{t("whereToTitle")}</h2>
              <p className="text-[14px] text-[#999] mt-1">{t("whereToSubtitle")}</p>
            </FadeIn>
            <div className="flex-1 flex flex-col min-h-0">
              <RideForm
                showInputs={showInputs}
                setShowInputs={setShowInputs}
                pickup={pickup}
                setPickup={setPickup}
                dropoff={dropoff}
                setDropoff={setDropoff}
                dropoffRef={dropoffRef}
                onSubmit={() => setStep(2)}
                t={t}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Shared between mobile fixed footer and desktop panel
function BottomBar({ selectedTier, onConfirm, selectedRide, t }) {
  return (
    <>
      <div className="flex items-center gap-3 mb-3">
        <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center flex-shrink-0">
          <FaApple className="w-3.5 h-3.5 text-white" />
        </div>
        <span className="text-[13px] font-semibold text-[#222] flex-1">{t("applePay")}</span>
        <button className="text-[12px] font-medium text-[#E31C5F] hover:underline">{t("changePayment")}</button>
      </div>

      {selectedTier && (
        <div className="flex items-center justify-between mb-3">
          <p className="text-[14px] text-[#888]">{t(selectedTier.nameKey)}</p>
          <p className="text-[22px] font-bold text-[#222] tabular-nums tracking-tight">&pound;{selectedTier.price}</p>
        </div>
      )}
      <GradientCTA onClick={onConfirm} disabled={!selectedRide}>{t("confirmRide")}</GradientCTA>
    </>
  );
}
