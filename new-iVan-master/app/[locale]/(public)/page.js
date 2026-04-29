"use client";
import TypewriterSearchPlaceholder from "@/components/TypewriterSearchPlaceholder";
import {
  getFilteredServices,
} from "@/utils/helper";
import { useRouter, Link, usePathname } from "@/i18n/routing";
import { useEffect, useState, useRef } from "react";

import { useTranslations, useLocale } from "next-intl";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import ServicesFilter from "@/components/ServicesFilter";
import LocationBadge from "@/components/LocationBadge";
import MiniApps from "@/components/MiniApps";
import { FiChevronDown } from "react-icons/fi";
import { TbMotorbike } from "react-icons/tb";

const TYPEWRITER_PHRASES = [
  "restaurants nearby",
  "groceries delivered",
  "a taxi ride",
  "book a table",
  "cleaning & repairs",
  "retail stores near me",
  "supermarket delivery",
  "a spa appointment",
];

function CarouselWithDots({ children, count }) {
  const [active, setActive] = useState(0);
  const [thumbLeft, setThumbLeft] = useState(0);
  const [thumbWidth, setThumbWidth] = useState(0);
  const [scrolling, setScrolling] = useState(false);
  const wrapRef = useRef(null);
  const scrollTimer = useRef(null);
  const TRACK_W = 72;

  useEffect(() => {
    const el = wrapRef.current?.querySelector(".svc-grid");
    if (!el) return;

    const update = () => {
      const { scrollLeft, scrollWidth, clientWidth } = el;
      const max = scrollWidth - clientWidth;
      const idx = max > 0 ? Math.round((scrollLeft / max) * (count - 1)) : 0;
      setActive(Math.max(0, Math.min(count - 1, idx)));

      const ratio = clientWidth / scrollWidth;
      const tw = Math.max(16, TRACK_W * ratio);
      setThumbWidth(tw);
      setThumbLeft(max > 0 ? (scrollLeft / max) * (TRACK_W - tw) : 0);

      setScrolling(true);
      clearTimeout(scrollTimer.current);
      scrollTimer.current = setTimeout(() => setScrolling(false), 800);
    };

    update();
    el.addEventListener("scroll", update, { passive: true });
    return () => {
      el.removeEventListener("scroll", update);
      clearTimeout(scrollTimer.current);
    };
  }, [count]);

  return (
    <div ref={wrapRef}>
      {children}
      <div className="svc-scrollbar-wrap">
        <div className="svc-scrollbar-track" style={{ width: TRACK_W }}>
          <div
            className={`svc-scrollbar-thumb${scrolling ? " svc-scrollbar-thumb-active" : ""}`}
            style={{ width: thumbWidth, transform: `translateX(${thumbLeft}px)` }}
          />
        </div>
      </div>
      <div className="svc-dots">
        {Array.from({ length: count }).map((_, i) => (
          <span key={i} className={`svc-dot${i === active ? " svc-dot-active" : ""}`} />
        ))}
      </div>
    </div>
  );
}

export default function HomePage() {
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("PublicPages.home");
  const activeLocale = useLocale();
  const [pendingLocale, setPendingLocale] = useState(null);
  const { data: session, status } = useSession();
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [selectedService, setSelectedService] = useState("");
  const [globalUserCount, setGlobalUserCount] = useState(null);
  const [locationUserCount, setLocationUserCount] = useState(null);
  const [statsLoaded, setStatsLoaded] = useState(false);
  const [miniAppCount, setMiniAppCount] = useState();
  const [isMobile, setIsMobile] = useState(false);
  const [homeServiceSections, setHomeServiceSections] = useState({
    ordering: [],
    reservation: [],
    booking: [],
    catalog: [],
  });

  useEffect(() => {
    const loadLocation = () => {
      const savedLocation = localStorage.getItem("selectedLocation");
      if (savedLocation) {
        setSelectedLocation(JSON.parse(savedLocation));
      }
    };
    loadLocation();
    const handleLocationChange = () => loadLocation();
    window.addEventListener("locationChanged", handleLocationChange);
    window.addEventListener("storage", handleLocationChange);
    return () => {
      window.removeEventListener("locationChanged", handleLocationChange);
      window.removeEventListener("storage", handleLocationChange);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const q = selectedLocation?.code
          ? `?locationCode=${encodeURIComponent(selectedLocation.code)}`
          : "";
        const res = await fetch(`/api/public/services${q}`);
        const data = await res.json();
        if (cancelled) return;
        if (res.ok && Array.isArray(data.catalog)) {
          setHomeServiceSections({
            ordering: data.ordering || [],
            reservation: data.reservation || [],
            booking: data.booking || [],
            catalog: data.catalog || [],
          });
        }
      } catch (e) {
        if (!cancelled) {
          setHomeServiceSections({
            ordering: [],
            reservation: [],
            booking: [],
            catalog: [],
          });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedLocation?.code]);

  useEffect(() => {
    if (pendingLocale && activeLocale === pendingLocale) {
      setPendingLocale(null);
    }
  }, [activeLocale, pendingLocale]);

  useEffect(() => {
    const fetchStats = async () => {
      setStatsLoaded(false);
      try {
        const url =
          selectedLocation?.lat && selectedLocation?.lng
            ? `/api/stats?lat=${selectedLocation.lat}&lng=${selectedLocation.lng}`
            : "/api/stats";
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to fetch stats: ${response.status}`);
        }
        const data = await response.json();
        if (data.globalUserCount !== undefined) {
          setGlobalUserCount(data.globalUserCount);
        }
        if (selectedLocation?.lat && selectedLocation?.lng) {
          if (data.locationUserCount !== undefined) {
            setLocationUserCount(data.locationUserCount);
          }
        } else {
          setLocationUserCount(null);
        }
        setStatsLoaded(true);
      } catch (error) {
        console.error("Error fetching stats:", error);
        setGlobalUserCount(null);
        setLocationUserCount(null);
        setStatsLoaded(true);
      }
    };
    fetchStats();
  }, [selectedLocation]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Check on mount
    checkMobile();

    // Add event listener for window resize
    window.addEventListener("resize", checkMobile);

    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  const bikeRef = useRef(null);
  const bikeHeaderRef = useRef(null);

  useEffect(() => {
    const header = bikeHeaderRef.current;
    const bike = bikeRef.current;
    if (!header || !bike) return;

    let startX = 0,
      endX = 0,
      triggerStart = 0,
      triggerEnd = 1;

    const calcPositions = () => {
      const h3 = header.querySelector("h3");
      const badge = header.querySelector(".svc-badge");
      if (!h3 || !badge) return;
      const headerRect = header.getBoundingClientRect();
      const h3Rect = h3.getBoundingClientRect();
      const badgeRect = badge.getBoundingClientRect();

      startX = h3Rect.right - headerRect.left + 8;
      endX = badgeRect.left - headerRect.left - 30;

      // absolute scroll positions — stable regardless of viewport size
      const headerAbsTop = window.scrollY + headerRect.top;
      // clamp to 0 so if header is already visible at load, bike always starts at startX
      triggerStart = Math.max(0, headerAbsTop - window.innerHeight);
      triggerEnd = triggerStart + window.innerHeight * 0.55;
    };

    const onScroll = () => {
      const progress = Math.min(1, Math.max(0, (window.scrollY - triggerStart) / (triggerEnd - triggerStart)));
      bike.style.left = `${startX + progress * (endX - startX)}px`;
    };

    const onResize = () => {
      calcPositions();
      onScroll();
    };

    requestAnimationFrame(() => {
      calcPositions();
      onScroll();
    });

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  const openLocationModal = () => {
    window.dispatchEvent(new CustomEvent("openLocationSelector"));
  };

  const servicesCatalog = homeServiceSections.catalog;

  const filteredServices = getFilteredServices(servicesCatalog, selectedLocation);
  const orderingServices = homeServiceSections.ordering;
  const reservationServices = homeServiceSections.reservation;
  const bookingServices = homeServiceSections.booking;
  const totalServices = filteredServices?.length || 0;
  const totalUsers =
    typeof globalUserCount === "number" ? globalUserCount.toLocaleString() : null;
  const nearbyUsers =
    typeof locationUserCount === "number" ? locationUserCount.toLocaleString() : null;
  const hasGlobalUsers = typeof globalUserCount === "number";
  const hasNearbyUsers = typeof locationUserCount === "number";

  return (
    <div className="pb-4">
      {/* ── Hero ── */}
      <section className="hero">
        <div className="hero-bg" />

        {/* floating lifestyle images — mixed shapes */}
        <div className="hero-float hero-float-1">
          <img src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=280&q=80" alt="" />
        </div>
        <div className="hero-float hero-float-2">
          <img src="https://images.unsplash.com/photo-1556742111-a301076d9d18?auto=format&fit=crop&w=240&q=80" alt="" />
        </div>
        <div className="hero-float hero-float-3">
          <img
            src="https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=220&q=80"
            alt=""
          />
        </div>
        <div className="hero-float hero-float-4">
          <img
            src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=260&q=80"
            alt=""
          />
        </div>
        <div className="hero-float hero-float-5">
          <img
            src="https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=240&q=80"
            alt=""
          />
        </div>

        <div className="hero-inner">
          <div className="hero-location">
            <LocationBadge
              text={(location) => (location ? location.name : null)}
              changeButtonText=""
              selectorPresentation="page"
            />
          </div>

          <h1 className="hero-h1">
            Your <em className="hero-accent">everyday</em> platform
            <br />
            for everything you need.
          </h1>

          <p className="hero-sub">Order from retail stores, restaurants & services — all in one place.</p>

          <div className="hero-chips">
            <span className="hero-chip chip-pink">Order</span>
            <span className="hero-chip chip-amber">Book</span>
            <span className="hero-chip chip-purple">Connect</span>
            <span className="hero-chip chip-green">Earn</span>
          </div>

          <p className="hero-hint">
            {selectedLocation ? (
              <button className="hero-hint-location" onClick={openLocationModal} type="button">
                <span className="hero-hint-location__lead">
                  <span className="hero-hint-location__flag">{selectedLocation.flag}</span>
                  <FiChevronDown className="hero-hint-chevron" />
                </span>
                <span className="hero-hint-location__text">
                  {totalServices} services
                  {hasGlobalUsers ? ` · ${totalUsers} Global users` : ""}
                  {hasNearbyUsers ? ` · ${nearbyUsers} in ${selectedLocation.name}` : ""}
                </span>
              </button>
            ) : (
              <button
                className="hero-hint-location hero-hint-location--empty"
                onClick={openLocationModal}
                type="button"
              >
                <span className="hero-hint-location__lead">
                  <span className="hero-hint-location__flag">📍</span>
                  <FiChevronDown className="hero-hint-chevron" />
                </span>
                <span className="hero-hint-location__text">
                  Set location · {totalServices} services
                  {hasGlobalUsers ? ` · ${totalUsers} Global users` : ""}
                </span>
              </button>
            )}
          </p>

          <div
            className="hero-search-wrap"
            onClick={() => {
              const el = document.getElementById("services-section");
              if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
          >
            <span className="hero-search-domain">swipped.co.uk/</span>
            <TypewriterSearchPlaceholder
              phrases={TYPEWRITER_PHRASES}
              className="hero-search-placeholder"
            />
            <button className="hero-search-go">Explore</button>
          </div>
        </div>
      </section>

      {/* ── Promo Banner ── */}
      <section className="hp-promo">
        <div className="hp-promo-card">
          <div className="hp-promo-overlay" />
          <div className="hp-promo-content">
            <span className="hp-promo-eyebrow">{t("promo_eyebrow")}</span>
            <p className="hp-promo-discount">{t("promo_discount")}</p>
            <p className="hp-promo-sub">
              {t("promo_sub")} <strong>{t("promo_code")}</strong>
            </p>
          </div>
        </div>
      </section>

      {/* ── Services ── */}
      <section>
        <div className="services_box py-0">
          <div className="container">
            <div id="services-section" className="svc-area">
              <div className="svc-header" ref={bikeHeaderRef} style={{ position: "relative" }}>
                <h3>On Demand</h3>
                <span ref={bikeRef} className="svc-bike" aria-hidden="true">
                  <TbMotorbike />
                </span>
                <span className="svc-badge badge-pink">Delivered Within 60 Minutes</span>
              </div>
              <p className="svc-sub">Products, food and groceries — delivered to you.</p>
              <ServicesFilter
                selectedService={selectedService}
                variant="featured"
                servicesCatalog={servicesCatalog}
                servicesRestrictTo={orderingServices.map((s) => s.id)}
              />

              <div className="svc-header">
                <h3>{t("book_now")}</h3>
                <span className="svc-badge badge-amber">Book in Seconds</span>
              </div>
              <p className="svc-sub">Reserve a table, book a session or schedule an appointment.</p>
              <CarouselWithDots count={reservationServices.length}>
                <ServicesFilter
                  selectedService={selectedService}
                  servicesCatalog={servicesCatalog}
                  servicesRestrictTo={reservationServices.map((s) => s.id)}
                />
              </CarouselWithDots>

              <div className="svc-header">
                <h3>Services</h3>
                <span className="svc-badge badge-green">Instant Dispatch</span>
              </div>
              <p className="svc-sub">Cleaning, repairs, deliveries and more — on demand.</p>
              <CarouselWithDots count={bookingServices.length}>
                <ServicesFilter
                  selectedService={selectedService}
                  servicesCatalog={servicesCatalog}
                  servicesRestrictTo={bookingServices.map((s) => s.id)}
                  servicesOrder={bookingServices.map((s) => s.id)}
                />
              </CarouselWithDots>
            </div>
          </div>
        </div>
      </section>

      {/* ── Headline ── */}
      <section className="hp-headline">
        <div className="container">
          <h2 className="hp-headline-text">
            Everything in one place.
            <br />
            Built for <em>you</em>.
          </h2>
          <p className="hp-headline-sub">
            Order, book, connect, and earn — all from a single platform designed to simplify your day.
          </p>
        </div>
      </section>

      {/* ── Portrait-style 2x2 card ── */}
      <section className="hp-grid-section">
        <div className="container">
          <div className="hp-grid-card">
            <div className="hp-grid-cell">
              <div className="hp-grid-icon" style={{ background: "#dbeafe" }}>
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="2" y1="12" x2="22" y2="12" />
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
              </div>
              <h4>{t("promotional_slider.slide4.title")}</h4>
              <p>{t("promotional_slider.slide4.desc")}</p>
            </div>
            <div className="hp-grid-cell">
              <div className="hp-grid-icon" style={{ background: "#fce7f3" }}>
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#ec4899"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              </div>
              <h4>{t("promotional_slider.slide3.title")}</h4>
              <p>{t("promotional_slider.slide3.desc")}</p>
            </div>
            <div className="hp-grid-cell">
              <div className="hp-grid-icon" style={{ background: "#d1fae5" }}>
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <h4>{t("promotional_slider.slide6.title")}</h4>
              <p>{t("promotional_slider.slide6.desc")}</p>
            </div>
            <div className="hp-grid-cell">
              <div className="hp-grid-icon" style={{ background: "#ede9fe" }}>
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#8b5cf6"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              </div>
              <h4>{t("promotional_slider.slide1.title")}</h4>
              <p>{t("promotional_slider.slide1.desc")}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Coming Soon carousel ── */}
      <section className="hp-coming">
        <div className="container">
          <h3 className="hp-coming-title">Coming soon</h3>
          <div className="hp-coming-track">
            <div className="hp-coming-card">
              <div className="hp-coming-icon" style={{ background: "#fff7ed" }}>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#f97316"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                </svg>
              </div>
              <h4>{t("promotional_slider.slide5.title")}</h4>
              <p>{t("promotional_slider.slide5.desc")}</p>
            </div>
            <div className="hp-coming-card">
              <div className="hp-coming-icon" style={{ background: "#fef3c7" }}>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#d97706"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                </svg>
              </div>
              <h4>{t("promotional_slider.slide7.title")}</h4>
              <p>{t("promotional_slider.slide7.desc")}</p>
            </div>
            <div className="hp-coming-card">
              <div className="hp-coming-icon" style={{ background: "#fce4ec" }}>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#e91e63"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <h4>{t("promotional_slider.slide8.title")}</h4>
              <p>{t("promotional_slider.slide8.desc")}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="hp-cta">
        <div className="container">
          <div className="hp-cta-inner">
            <h2>Start using Swipped today.</h2>
            <Link href="/register" className="hp-cta-btn">
              Get Started →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
