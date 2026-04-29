"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter, Link } from "@/i18n/routing";
import InfoModal from "@/components/Modals/InfoModal";
import { FaPlus } from "react-icons/fa";

const MiniApps = ({ className = "", scrollable = false, setMiniAppCount }) => {
  const t = useTranslations("PublicPages.home.miniApps");
  const router = useRouter();
  const [selectedApp, setSelectedApp] = useState(null);
  const [showComingSoon, setShowComingSoon] = useState(false);

  const apps = [
    {
      id: "digital-land-exchange",
      nameKey: "digitalLandExchange",
      image: "/assets/img/mini-apps/earth.png",
    },
    {
      id: "swipped-workforce",
      nameKey: "swippedWorkforce",
      image: "/assets/img/mini-apps/workforce.png",
    },
    {
      id: "swipped-connect",
      nameKey: "swippedConnect",
      image: "/assets/img/mini-apps/heart.png",
    },
    {
      id: "swipped-live-streaming",
      nameKey: "swippedLiveStreaming",
      image: "/assets/img/mini-apps/streaming.png",
    },
    {
      id: "swipped-virtual-world",
      nameKey: "swippedVirtualWorld",
      image: "/assets/img/mini-apps/virtual-world.png",
    },
    {
      id: "charity-donations",
      nameKey: "charityDonations",
      image: "/assets/img/mini-apps/charity.png",
    },
  ];

  useEffect(()=>{
    setMiniAppCount(apps?.length)
  },[])
  const handleAppClick = (app) => {
    // Route to virtual world page if it's the virtual world app
    if (app.id === "swipped-virtual-world") {
      router.push("/mini-apps/virtual-world");
      return;
    }

    // Route to swipped connect page if it's the swipped connect app
    if (app.id === "swipped-connect") {
      router.push("/swipped-connect");
      return;
    }

    // Route to digital land exchange page if it's the digital land exchange app
    if (app.id === "digital-land-exchange") {
      router.push("/mini-apps/digital-land-exchange");
      return;
    }

    // Route to invoice generator page
    if (app.id === "invoice-generator") {
      router.push("/mini-apps/invoice-generator");
      return;
    }

    // Route to swipped gaming arena page
    if (app.id === "swipped-gaming-arena") {
      router.push("/mini-apps/swipped-gaming-arena");
      return;
    }

    // Show coming soon modal for other apps
    setSelectedApp(app);
    setShowComingSoon(true);
  };

  const AppCard = ({ app, index }) => {
    const appName = t(`apps.${app.nameKey}`);
    return (
      <button
        key={index}
        className={`category-card text-center flex flex-col items-center justify-center`}
        onClick={() => handleAppClick({ ...app, name: appName })}
        style={!scrollable ? { width: "auto", flexShrink: 0 } : {}}
      >
        <div className="services-icon">
          <img
            src={app.image}
            alt={appName}
            style={{
              width: "50px",
              height: "50px",
              objectFit: "contain",
            }}
          />
        </div>
        <span className="category-text capitalize">{appName}</span>
      </button>
    );
  };

  const ViewAllCard = () => {
    return (
      <Link
        href="/mini-apps"
        className={`text-center items-center justify-center p-2 bg-[#e7f1f4]  rounded-xl`}
      >
        <div className="!bg-white px-[13px] py-2 rounded-xl">
          <FaPlus className="text-gray-400" size={40} />
        <span className="category-text capitalize !py-[10px]">{t("add")}</span>

        </div>
      </Link>
    );
  };

  if (scrollable) {
    return (
      <>
        <div
          className={`d-flex overflow-x-auto category-scroll-container items-start  ${className}`}
        >
          {apps.map((app, index) => (
            <AppCard key={index} app={app} index={index} />
          ))}
        </div>
        <InfoModal
          isOpen={showComingSoon}
          onClose={() => setShowComingSoon(false)}
          title={t("comingSoon.title")}
          message={t("comingSoon.message", {
            appName: selectedApp?.name || t("comingSoon.defaultAppName"),
          })}
          icon="fa-hourglass-half"
          showComingSoonIcon={true}
        />
      </>
    );
  }

  return (
    <>
      <div
        className={`d-flex flex-wrap align-items-start sm:justify-start pb-2 pt-2 rounded-xl  ${className}`}
        style={{ gap: "0.45rem",  }}
      >
        {apps.map((app, index) => (
          <AppCard key={index} app={app} index={index} />
        ))}
        <ViewAllCard />
        <ViewAllCard />

      </div>
      <InfoModal
        isOpen={showComingSoon}
        onClose={() => setShowComingSoon(false)}
        title={t("comingSoon.title")}
        message={t("comingSoon.message", {
          appName: selectedApp?.name || t("comingSoon.defaultAppName"),
        })}
        icon="fa-hourglass-half"
        showComingSoonIcon={true}
      />
    </>
  );
};

export default MiniApps;

