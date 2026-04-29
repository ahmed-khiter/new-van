"use client";
import dynamic from "next/dynamic";
import { useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { useState } from "react";
import AppDownloadModal from "@/components/Modals/AppDownloadModal";

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

// Slides data will be generated using translations in the component

export default function PromotionalSlider() {
  const router = useRouter();
  const t = useTranslations("PublicPages.home.promotional_slider");
  const [showDownloadModal, setShowDownloadModal] = useState(false);

  const slides = [
    {
      id: 7,
      title: t("slide7.title"),
      img: "/assets/img/slider/swipped_07.jpg",
      desc: t("slide7.desc"),
      route: "/mini-apps/virtual-world",
    },
    {
      id: 8,
      title: t("slide8.title"),
      img: "/assets/img/slider/swipped_08.jpg",
      desc: t("slide8.desc"),
      route: "/invest",
    },
    {
      id: 1,
      title: t("slide1.title"),
      img: "/assets/img/slider/swipped_03.jpg",
      desc: t("slide1.desc"),
      route: "/business-account",
    },
    {
      id: 6,
      title: t("slide6.title"),
      img: "/assets/img/slider/swipped_06.jpg",
      desc: t("slide6.desc"),
      route: null, // No route, will open modal instead
      isDownloadApp: true, // Flag to identify this slide
    },
    {
      id: 2,
      title: t("slide2.title"),
      img: "/assets/img/slider/swipped_02.jpg",
      desc: t("slide2.desc"),
      route: "/register",
    },
    {
      id: 3,
      title: t("slide3.title"),
      img: "/assets/img/slider/swipped_04.jpg",
      desc: t("slide3.desc"),
      route: "/partner-with-us",
    },
    {
      id: 4,
      title: t("slide4.title"),
      img: "/assets/img/slider/swipped_01.jpg",
      desc: t("slide4.desc"),
      route: "/",
    },
    {
      id: 5,
      title: t("slide5.title"),
      img: "/assets/img/slider/swipped_05.jpg",
      desc: t("slide5.desc"),
      route: "/fulfilment",
    },
  ];

  const handleSlideClick = (slide) => {
    if (slide.isDownloadApp) {
      setShowDownloadModal(true);
    } else if (slide.route) {
      router.push(slide.route);
    }
  };

  return (
    <>
      <section>
        <div className="custom_slider_wrapp ">
          <div className="container">
            <OwlCarousel className="owl-theme" {...options}>
              {slides.map((slide, index) => (
                <div
                  key={`${slide.id}-${index}`}
                  className="promo-slide group cursor-pointer"
                  onClick={() => handleSlideClick(slide)}
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
      </section>
      <AppDownloadModal
        isOpen={showDownloadModal}
        onClose={() => setShowDownloadModal(false)}
      />
    </>
  );
}

