"use client";
import dynamic from "next/dynamic";
import { useMemo, useEffect, useState } from "react";
import { useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import InfoModal from "@/components/Modals/InfoModal";

const OwlCarousel = dynamic(() => import("react-owl-carousel3"), {
  ssr: false,
});

const options = {
  items: 3.4,
  loop: true,
  margin: 20,
  autoplay: false,
  autoplayTimeout: 3000,
  autoplayHoverPause: true,
  dots: false,
  nav: true,
  navText: [
    '<span class="owl-prev ">&#10094;</span>',
    '<span class="owl-next ">&#10095;</span>',
  ],
  responsive: {
    0: { items: 1.2, nav: false },
    576: { items: 2.2, nav: false },
    992: { items: 3.4 },
  },
};

export default function ServiceSlider({ onSlideClick }) {
  const router = useRouter();
  const t = useTranslations("PublicPages.home.services");
  const tHome = useTranslations("PublicPages.home.miniApps.comingSoon");
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [showComingSoon, setShowComingSoon] = useState(false);
  const [selectedServiceName, setSelectedServiceName] = useState(null);
  const [servicesCatalog, setServicesCatalog] = useState([]);

  // Map service IDs to translation keys
  const getServiceTranslationKey = (serviceId) => {
    const mapping = {
      "shop": "shop",
      "restaurant": "restaurant",
      "supermarket": "supermarket",
      "Taxi Rides": "swipped_rides",
      "Book a Table": "restaurant_reservation",
      "MOT & Repairs": "mot_resrevations",
      "Shisha lounges": "shisha_lounge",
      "Spa": "spa",
      "Beauty": "beauty",
      "Luggage Storage": "luggage_storage",
      "Dry Cleaning Pick-Up": "dry_cleaning_pick_up",
      "Recovery": "recovery",
      "Cleaning": "cleaning",
      "Locksmith": "locksmith",
      "Car Key Replacement": "car_key_replacement",
      "Removals": "removals",
      "Click & Collect": "click_and_collect",
      "Van": "van",
      "Healthcare": "healthcare",
      "Events": "events",
      "Entertainment": "entertainment"
    };
    return mapping[serviceId] || serviceId.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
  };

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

  useEffect(() => {
    let cancelled = false;
    const fetchCatalog = async () => {
      try {
        const q = selectedLocation?.code
          ? `?locationCode=${encodeURIComponent(selectedLocation.code)}`
          : "";
        const res = await fetch(`/api/public/home-services${q}`);
        const data = await res.json();
        if (cancelled) return;
        if (res.ok && Array.isArray(data.catalog)) {
          setServicesCatalog(data.catalog);
        }
      } catch (error) {
        if (!cancelled) {
          setServicesCatalog([]);
        }
      }
    };
    fetchCatalog();
    return () => {
      cancelled = true;
    };
  }, [selectedLocation?.code]);

  const slides = useMemo(() => {
    const sourceServices = servicesCatalog;
    if (!sourceServices || !Array.isArray(sourceServices)) return [];
    const filteredServices = sourceServices
      .filter(service => {
        if (!service?.images?.slider) {
          return false;
        }
        if (service.id === 'Click & Collect' && selectedLocation?.code === 'SA') {
          return false;
        }
        if (service.id === 'Luggage Storage' && selectedLocation?.code !== 'GB') {
          return false;
        }
        return true;
      })
      .map(service => {
        const translationKey = getServiceTranslationKey(service.id);
        return {
          id: service.id,
          title: t(`${translationKey}.name`) || service.name,
          img: service.images.slider,
          desc: t(`${translationKey}.description`) || service.description,
        };
      });
    
    return filteredServices.sort((a, b) => {
      if (a.id === 'Order Food') return -1;
      if (b.id === 'Order Food') return 1;
      return 0;
    });
  }, [selectedLocation, t]);

  const handleSlideClick = (serviceId, serviceName) => {
    // If custom handler is provided, use it
    if (onSlideClick) {
      onSlideClick(serviceId);
      return;
    }

    // Navigate to Taxi Rides page
    if (serviceId === "Taxi Rides") {
      router.push("/swipped-rides");
      return;
    }

    // Default navigation logic
    if (serviceId === "shop") {
      router.push('/shops');
      return;
    } else if (serviceId === "restaurant") {
      router.push('/restaurants');
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
    } else if (serviceId === "Healthcare") {
      router.push('/reservations?service=healthcare');
      return;
    } else if (serviceId === "Events") {
      router.push('/reservations?service=events');
      return;
    } else if (serviceId === "Entertainment") {
      router.push('/reservations?service=entertainment');
      return;
    } else if (serviceId === "Shop Reservation") {
      router.push('/booking?service=Shop Reservation');
      return;
    }
    router.push(`/booking?service=${encodeURIComponent(serviceId)}`);
  };

  return (
    <section>
      <div className="custom_slider_wrapp">
        <div className="container">
          <OwlCarousel className="owl-theme" {...options}>
            {slides.map((slide) => (
              <div
                key={slide.id}
                className="promo-slide group cursor-pointer"
                onClick={() => handleSlideClick(slide.id, slide.title)}
              >
                <div className="promo-slide-img">
                  <img src={slide.img} alt={slide.title} />
                </div>
                <div className="promo-slide-body">
                  <h4 className="promo-slide-title">{slide.title}</h4>
                  <p className="promo-slide-desc">{slide.desc}</p>
                </div>
              </div>
            ))}
          </OwlCarousel>
        </div>
      </div>
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
    </section>
  );
}

