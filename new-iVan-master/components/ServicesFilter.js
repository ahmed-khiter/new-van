"use client";
import { getFilteredServices } from "@/utils/helper";
import { passesHomepageLocationFilter } from "@/utils/homepageServices";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import InfoModal from "@/components/Modals/InfoModal";

const ServicesFilter = ({
  selectedService = "",
  onServiceChange,
  className = "",
  variant = "cards",
  scrollable = false,
  mobileScrollable = false,
  excludeServices = [],
  servicesOrder = [],
  /** When set, replaces the default static `services` list (e.g. DB-driven homepage). */
  servicesCatalog = [],
  /** When set, only these legacy ids are shown (order preserved). */
  servicesRestrictTo = null,
  showAllOption = false,
}) => {
  const router = useRouter();
  const t = useTranslations("Services");
  const tHome = useTranslations("PublicPages.home.miniApps.comingSoon");
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [showComingSoon, setShowComingSoon] = useState(false);
  const [selectedServiceName, setSelectedServiceName] = useState(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const loadLocation = () => {
        const savedLocation = localStorage.getItem('selectedLocation');
        if (savedLocation) {
          try {
            setSelectedLocation(JSON.parse(savedLocation));
          } catch (error) {
            console.error("Error parsing saved location:", error);
          }
        }
      };

      loadLocation();

      window.addEventListener('storage', loadLocation);
      const handleLocationChange = () => loadLocation();
      window.addEventListener('locationChanged', handleLocationChange);

      return () => {
        window.removeEventListener('storage', loadLocation);
        window.removeEventListener('locationChanged', handleLocationChange);
      };
    }
  }, []);


  const isServiceSelected = (serviceId) => {
    if (Array.isArray(selectedService)) {
      return selectedService.includes(serviceId);
    }
    return selectedService === serviceId;
  };

  const isAllSelected = () => {
    if (Array.isArray(selectedService)) {
      return selectedService.includes("All") || (selectedService.length === 1 && selectedService[0] === "All");
    }
    return selectedService === "All";
  };

  const handleServiceChange = (serviceId, serviceName, options = {}) => {
    const { routeHref } = options;

    // Handle "All" option
    if (serviceId === "All") {
      if (onServiceChange) {
        onServiceChange("All");
      }
      return;
    }

    if (routeHref) {
      router.push(routeHref);
      return;
    }

    // Navigate to Taxi Rides page
    if (serviceId === "Taxi Rides") {
      router.push("/swipped-rides");
      return;
    }

    // Call custom handler if provided (for state management)
    if (onServiceChange) {
      onServiceChange(serviceId);
      return;
    }

    // Default navigation logic - always run to ensure navigation happens
    // The custom handler may navigate for some services, but we ensure all services are handled
    if (serviceId === "shop") {
      router.push('/shops?category=all');
      return;
    } else if(serviceId === "supermarket") {
      router.push('/shops?category=supermarket');
      return;
    } else if (serviceId === "restaurant") {
      router.push('/restaurants?category=all');
      return;
    } else if (serviceId === "Luggage Storage") {
      router.push('/booking?service=Luggage Storage');
      return;
    } else if (serviceId === "Dry Cleaning Pick-Up") {
      router.push('/booking?service=cleaning');
      return;
    } else if (serviceId === "Book a Table") {
      router.push('/reservations?service=restaurant');
      return;
    } else if (serviceId === "MOT & Repairs") {
      router.push('/reservations?service=mot');
      return;
    } else if (serviceId === "Shisha lounges") {
      router.push('/reservations?service=shisha');
      return;
    } else if (serviceId === "Spa") {
      router.push('/reservations?service=spa');
      return;
    } else if (serviceId === "Beauty") {
      router.push('/reservations?service=beauty');
      return;
    } else if (serviceId === "Shop Reservation") {
      router.push('/booking?service=Shop Reservation');
      return;
    } else if (serviceId === "Healthcare") {
      router.push('/reservations?service=healthcare');
      return;
    } else if (serviceId === "Events") {
      router.push('/reservations?service=events');
      return;
    } else if (serviceId === "Entertainment") {
      router.push('/reservations?service=entertainment');
      return;
    }
    
    // Fallback for other services - only navigate if no custom handler
    // (custom handler should handle navigation for services it knows about)
    if (!onServiceChange) {
      router.push(`/booking?service=${encodeURIComponent(serviceId)}`);
    }
  };

  const isFeatured = variant === "featured";

  const AllCard = () => {
    const isActive = isAllSelected();
    if (isFeatured) {
      return (
        <button className={`svc-card svc-card-featured ${isActive ? "svc-card-active" : ""}`} onClick={() => handleServiceChange("All", "All", {})}>
          <img className="svc-card-img" src="/assets/img/categories/all.png" alt="All" />
          <div className="svc-card-overlay svc-card-overlay-light" />
          <span className="svc-card-name svc-card-name-featured">All</span>
        </button>
      );
    }
    return (
      <button className={`svc-card ${isActive ? "svc-card-active" : ""}`} onClick={() => handleServiceChange("All", "All", {})}>
        <img className="svc-card-img" src="/assets/img/categories/all.png" alt="All" />
        <div className="svc-card-overlay" />
        <span className="svc-card-name">All</span>
      </button>
    );
  };

  const ServiceCard = ({ service, index }) => {
    const isActive = isServiceSelected(service.id);
    const serviceName = t(`${service.id}.name`, { defaultValue: service.name });
    const videoRef = useRef(null);
    const touchStartTime = useRef(null);
    const preventClickRef = useRef(false);

    const showVideo = () => {
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.play().catch(() => {});
      }
    };

    const hideVideo = () => {
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      }
    };

    const handleTouchStart = () => {
      touchStartTime.current = Date.now();
      preventClickRef.current = false;
      showVideo();
    };

    const handleTouchEnd = () => {
      const elapsed = Date.now() - (touchStartTime.current || 0);
      hideVideo();
      if (elapsed > 250) {
        preventClickRef.current = true;
      }
    };

    const handleClick = () => {
      if (preventClickRef.current) {
        preventClickRef.current = false;
        return;
      }
      handleServiceChange(service.id, serviceName, { routeHref: service.routeHref });
    };

    if (isFeatured) {
      const hasVideo = !!service.images.preview_video;
      return (
        <button
          key={index}
          className={`svc-card svc-card-featured ${isActive ? "svc-card-active" : ""}`}
          onClick={hasVideo ? handleClick : () => handleServiceChange(service.id, serviceName, { routeHref: service.routeHref })}
          onMouseEnter={hasVideo ? showVideo : undefined}
          onMouseLeave={hasVideo ? hideVideo : undefined}
          onTouchStart={hasVideo ? handleTouchStart : undefined}
          onTouchEnd={hasVideo ? handleTouchEnd : undefined}
        >
          {hasVideo ? (
            <video
              ref={videoRef}
              className="svc-card-img svc-card-video-poster"
              src={service.images.preview_video}
              poster={service.images.preview_poster}
              muted
              loop
              playsInline
              preload="auto"
            />
          ) : (
            <img className="svc-card-img" src={service.images.list_service_img} alt={serviceName} />
          )}
          <div className="svc-card-overlay svc-card-overlay-light" />
          <span className="svc-card-name svc-card-name-featured">{serviceName}</span>
        </button>
      );
    }
    return (
      <button key={index} className={`svc-card ${isActive ? "svc-card-active" : ""}`} onClick={() => handleServiceChange(service.id, serviceName, { routeHref: service.routeHref })}>
        <img className="svc-card-img" src={service.images.list_service_img} alt={serviceName} />
        <div className="svc-card-overlay" />
        <span className="svc-card-name">{serviceName}</span>
      </button>
    );
  };

  const servicesSource = Array.isArray(servicesCatalog) ? servicesCatalog : [];

  let filteredServices = getFilteredServices(servicesSource, selectedLocation)
    .filter((service) => passesHomepageLocationFilter(service.locationFilter, selectedLocation))
    .filter((service) => !excludeServices.includes(service.id));

  if (servicesRestrictTo?.length > 0) {
    const orderIndex = Object.fromEntries(servicesRestrictTo.map((id, i) => [id, i]));
    filteredServices = filteredServices
      .filter((s) => servicesRestrictTo.includes(s.id))
      .sort((a, b) => (orderIndex[a.id] ?? 999) - (orderIndex[b.id] ?? 999));
  }

  // Sort services according to servicesOrder if provided
  if (servicesOrder.length > 0) {
    filteredServices = filteredServices.sort((a, b) => {
      const indexA = servicesOrder.indexOf(a.id);
      const indexB = servicesOrder.indexOf(b.id);
      // If service is in order array, use its index; otherwise, put it at the end
      if (indexA === -1 && indexB === -1) return 0;
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });
  }

  const cardGrid = (
    <div className={`${isFeatured ? "svc-grid-featured" : "svc-grid"} ${className}`}>
      {showAllOption && <AllCard />}
      {filteredServices.map((service, index) => (
        <ServiceCard key={index} service={service} index={index} />
      ))}
    </div>
  );

  return (
    <>
      {cardGrid}
      <InfoModal
        isOpen={showComingSoon}
        onClose={() => setShowComingSoon(false)}
        title={tHome("title")}
        message={tHome("message", {
          appName: selectedServiceName || tHome("defaultAppName"),
        })}
        icon="fa-hourglass-half"
        showComingSoonIcon={true}
      />
    </>
  );
};

export default ServicesFilter;
