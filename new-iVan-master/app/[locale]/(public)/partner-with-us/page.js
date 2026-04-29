"use client";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import EarningsCalculator from "@/components/EarningsCalculator";
import InfoModal from "@/components/Modals/InfoModal";

export default function PartnerWithUsPage() {
  const t = useTranslations("PublicPages.partnerWithUs");
  const [selectedFeature, setSelectedFeature] = useState(null);
  const searchParams = useSearchParams();

  // Scroll to section when hash is present in URL
  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      const sectionId = hash.substring(1); // Remove the # symbol
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100); // Small delay to ensure page is rendered
    }
  }, [searchParams]);

  const partners = [
    {
      id: "service-providers",
      image: "/assets/img/partnerwithus/service-provider.jpg",
      title: t("serviceProviders.title"),
      description: t("serviceProviders.description"),
      infoDescription: t("serviceProviders.infoDescription"),
      features: [
        {
          text: t("serviceProviders.feature1"),
          info: t("serviceProviders.feature1Info"),
        },
        {
          text: t("serviceProviders.feature2"),
          info: t("serviceProviders.feature2Info"),
        },
        {
          text: t("serviceProviders.feature3"),
          info: t("serviceProviders.feature3Info"),
        },
        {
          text: t("serviceProviders.feature4"),
          info: t("serviceProviders.feature4Info"),
        },
      ],
    },
    
    {
      id: "shop-owners",
      image: "/assets/img/partnerwithus/shop_owner.jpg",
      title: t("shopOwners.title"),
      description: t("shopOwners.description"),
      infoDescription: t("shopOwners.infoDescription"),
      features: [
        {
          text: t("shopOwners.feature1"),
          info: t("shopOwners.feature1Info"),
        },
        {
          text: t("shopOwners.feature2"),
          info: t("shopOwners.feature2Info"),
        },
        {
          text: t("shopOwners.feature3"),
          info: t("shopOwners.feature3Info"),
        },
        {
          text: t("shopOwners.feature4"),
          info: t("shopOwners.feature4Info"),
        },
      ],
    },
    // {
    //   id: "content-creators",
    //   image: "/assets/img/partnerwithus/content_creator.jpg",
    //   title: t("contentCreators.title"),
    //   description: t("contentCreators.description"),
    //   features: [
    //     t("contentCreators.feature1"),
    //     t("contentCreators.feature2"),
    //     t("contentCreators.feature3"),
    //     t("contentCreators.feature4"),
    //   ],
    // },
    {
      id: "restaurants",
      image: "/assets/img/partnerwithus/restaurants .jpg",
      title: t("restaurants.title"),
      description: t("restaurants.description"),
      infoDescription: t("restaurants.infoDescription"),
      features: [
        {
          text: t("restaurants.feature1"),
          info: t("restaurants.feature1Info"),
        },
        {
          text: t("restaurants.feature2"),
          info: t("restaurants.feature2Info"),
        },
        {
          text: t("restaurants.feature3"),
          info: t("restaurants.feature3Info"),
        },
        {
          text: t("restaurants.feature4"),
          info: t("restaurants.feature4Info"),
        },
      ],
    },
  ];

  return (
    <div className="container">
      <div className="block sm:hidden">
        <EarningsCalculator />
      </div>
      <div className="row justify-content-center">
        <div className="col-lg-10">
          <div className="text-center mb-5">
            <h1 className="mb-3">{t("title")}</h1>
            <p className="text-muted fs-5">{t("subtitle")}</p>
          </div>
        </div>
      </div>

      <div className="row g-4">
        {partners.map((partner, index) => (
          <div key={partner.id} className="col-lg-4 col-md-6 col-12">
            <div id={partner.id} className="card h-100 shadow-sm border-0" style={{ scrollMarginTop: '20px' }}>
              <div className="position-relative" style={{ height: "250px", overflow: "hidden" }}>
                <img
                  src={partner.image}
                  alt={partner.title}
                  className="w-100 h-100"
                  style={{ objectFit: "cover" }}
                />
              </div>
              <div className="card-body p-4 d-flex flex-column">
                <h3 className="card-title mb-3">{partner.title}</h3>
                <p className="card-text text-muted mb-4">{partner.description}</p>
                <ul className="list-unstyled mb-4">
                  {partner.features.map((feature, idx) => (
                    <li key={idx} className="mb-2 d-flex align-items-start">
                      <i className="fa fa-check-circle text-success me-2 mt-1 flex-shrink-0" aria-hidden="true"></i>
                      <span 
                        className="underline cursor-pointer flex-grow-1" 
                        onClick={() => setSelectedFeature({ partner, feature, featureIndex: idx })}
                      >
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="mt-auto">
                  <Link
                    href="/register"
                    className="custom_btn_solid d-inline-block text-center w-100"
                  >
                    Get Started Now
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {/* Reservation System Section */}
        <div className="col-lg-4 col-md-6 col-12">
          <div id="reservation-system" className="card h-100 shadow-sm border-0" style={{ scrollMarginTop: '20px' }}>
            <div className="position-relative" style={{ height: "250px", overflow: "hidden" }}>
              <img
                src="/assets/img/partnerwithus/calander.jpeg"
                alt={t("reservationSystem.title")}
                className="w-100 h-100"
                style={{ objectFit: "cover" }}
              />
            </div>
            <div className="card-body p-4 d-flex flex-column">
              <h3 className="card-title mb-3">{t("reservationSystem.title")}</h3>
              <p className="card-text text-muted mb-4">{t("reservationSystem.description")}</p>
              <ul className="list-unstyled mb-4">
                {[
                  { text: t("reservationSystem.feature1"), info: t("reservationSystem.feature1Info") },
                  { text: t("reservationSystem.feature2"), info: t("reservationSystem.feature2Info") },
                  { text: t("reservationSystem.feature3"), info: t("reservationSystem.feature3Info") },
                  { text: t("reservationSystem.feature5"), info: t("reservationSystem.feature5Info") },
                ].map((feature, idx) => (
                  <li key={idx} className="mb-2 d-flex align-items-start">
                    <i className="fa fa-check-circle text-success me-2 mt-1 flex-shrink-0" aria-hidden="true"></i>
                    <span 
                      className="underline cursor-pointer flex-grow-1" 
                      onClick={() => setSelectedFeature({ partner: { title: t("reservationSystem.title") }, feature, featureIndex: idx })}
                    >
                      {feature.text}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-auto">
                <Link
                  href="/register"
                  className="custom_btn_solid d-inline-block text-center w-100"
                >
                 Get Started Now
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Earnings Calculator */}
      <div className="hidden sm:block">
        <EarningsCalculator />
      </div>
      <div className="row mt-5">
        <div className="col-lg-8 mx-auto">
          <div className="card bg-light border-0">
            <div className="card-body p-5 text-center">
              <h4 className="mb-3">{t("cta.title")}</h4>
              <p className="text-muted mb-4">{t("cta.description")}</p>
              <Link
                href="/register"
                className="custom_btn_solid"
              >
                {t("cta.button")}
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Info Modal */}
      {selectedFeature && (
        <InfoModal
          isOpen={!!selectedFeature}
          onClose={() => setSelectedFeature(null)}
          title={selectedFeature.feature.text}
          message={selectedFeature.feature.info}
        />
      )}
    </div>
  );
}

