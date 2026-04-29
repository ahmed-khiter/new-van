"use client";
import { useState, useRef } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { FaSearch, FaStar, FaGamepad, FaPalette, FaBriefcase } from "react-icons/fa";
import { FiCheckSquare, FiMessageCircle, FiMap, FiGrid } from "react-icons/fi";
import { HiClipboardDocumentList } from "react-icons/hi2";
import { HiOutlinePuzzle } from "react-icons/hi";
import InfoModal from "@/components/Modals/InfoModal";

export default function MiniAppsPage() {
  const t = useTranslations("PublicPages.home.miniApps");
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedApp, setSelectedApp] = useState(null);
  const [showComingSoon, setShowComingSoon] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const categoryAppsRef = useRef(null);

  const apps = [
    {
      id: "swipped-workforce",
      nameKey: "swippedWorkforce",
      name: "Swipped Workforce",
      description: "Hire per day",
      image: "/assets/img/mini-apps/workforce.png",
    },
    {
      id: "swipped-connect",
      nameKey: "swippedConnect",
      name: "Swipped Connect",
      description: "Real People, Real Connections",
      image: "/assets/img/mini-apps/heart.png",
    },
    {
      id: "digital-land-exchange",
      nameKey: "digitalLandExchange",
      name: "Virtual land Exchange",
      description: "Buy, Sell and trade",
      image: "/assets/img/mini-apps/earth.png",
    },
    // {
    //   id: "invoice-generator",
    //   nameKey: "invoiceGenerator",
    //   name: "Invoice Generator",
    //   description: "Create invoices",
    //   image: "/assets/img/mini-apps/invoice_generator.png",
      
    // },
    {
      id: "swipped-gaming-arena",
      nameKey: "swippedGamingArena",
      name: "Swipped Gaming Arena",
      description: "Compete, stream, and earn",
      image: "/assets/img/mini-apps/gaming_arena.png",
    
    },
    {
      id: "swipped-skill-trade",
      nameKey: "swippedSkillTrade",
      name: "Swipped Skill Trade",
      description: "Trade your skills for real value",
      image: "/assets/img/mini-apps/skill_for_skill.png",
    },
    {
      id: "swipped-live-streaming",
      nameKey: "swippedLiveStreaming",
      image: "/assets/img/mini-apps/streaming.png",
      description: "Watch, Share and Stream",
    },
    {
      id: "swipped-virtual-world",
      nameKey: "swippedVirtualWorld",
      image: "/assets/img/mini-apps/virtual-world.png",
      description: "Connect, build and earn",
    },
    {
      id: "charity-donations",
      nameKey: "charityDonations",
      image: "/assets/img/mini-apps/charity.png",
      description: "Make a Positive Impact",
    },
  ];

  const suggestedApps = apps.slice(0, 3);

  const browseCategories = [
    {
      id: "top-mini-apps",
      name: "All Mini Apps",
      icon: (
        <div className="relative">
          <div className="flex gap-1">
            <div className="w-3 h-8 bg-blue-500 rounded"></div>
            <div className="w-3 h-6 bg-blue-500 rounded"></div>
            <div className="w-3 h-10 bg-blue-500 rounded"></div>
          </div>
          <FaStar className="absolute -top-1 -right-1 text-yellow-400 text-sm" />
        </div>
      ),
    },
    {
      id: "work",
      name: "Work",
      icon: <HiClipboardDocumentList className="text-blue-500 text-2xl" />,
    },
    {
      id: "gaming",
      name: "Gaming",
      icon: <FaGamepad className="text-blue-500 text-2xl" />,
    },
    {
      id: "tools",
      name: "Tools",
      icon: <FaPalette className="text-blue-500 text-2xl" />,
    },
  ];

  const handleAppClick = (app) => {
    // Route to virtual world page if it's the virtual world app
    if (app.id === "swipped-virtual-world") {
      router.push("/mini-apps/digital-land");
      return;
    }

    // Route to swipped connect page if it's the swipped connect app
    if (app.id === "swipped-connect") {
      router.push("/mini-apps/swipped-dating");
      return;
    }

    // Route to swipped dating page if it's the swipped dating app
    if (app.id === "swipped-dating") {
      router.push("/mini-apps/swipped-dating");
      return;
    }

    // Route to digital land exchange page if it's the digital land exchange app
    if (app.id === "digital-land-exchange") {
      router.push("/mini-apps/digital-land-exchange");
      return;
    }

    // Route to digital land page if it's the digital land app
    if (app.id === "digital-land") {
      router.push("/mini-apps/digital-land");
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

    // Route to swipped skill trade page
    if (app.id === "swipped-skill-trade") {
      router.push("/mini-apps/swipped-skill-trade");
      return;
    }

    // Show coming soon modal for other apps
    setSelectedApp(app);
    setShowComingSoon(true);
  };

  const handleCategoryClick = (categoryId) => {
    // Toggle category selection - if clicking the same category, clear it
    if (selectedCategory === categoryId) {
      setSelectedCategory(null);
    } else {
      setSelectedCategory(categoryId);
      // Scroll to the filtered apps section after state update
      setTimeout(() => {
        categoryAppsRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }, 100);
    }
    setSearchQuery(""); // Clear search when selecting a category
  };

  // Get apps filtered by category
  const getCategoryApps = (categoryId) => {
    if (categoryId === "top-mini-apps") {
      return apps; // Show all apps
    } else if (categoryId === "work") {
      return apps.filter(app => 
        app.id === "swipped-workforce" || app.id === "invoice-generator"
      );
    } else if (categoryId === "gaming") {
      return apps.filter(app => 
        app.id === "swipped-gaming-arena" || app.id === "swipped-virtual-world"
      );
    } else if (categoryId === "tools") {
      return apps.filter(app => 
        app.id === "invoice-generator"
      );
    }
    return apps;
  };

  // Get count of apps in a category
  const getCategoryCount = (categoryId) => {
    return getCategoryApps(categoryId).length;
  };

  const categoryApps = selectedCategory ? getCategoryApps(selectedCategory) : [];

  // Filter apps based on search query
  const filteredApps = apps.filter((app) => {
    const appName = app.name || t(`apps.${app.nameKey}`).toLowerCase();
    return appName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="min-h-screen">
      <div className="container pt-[20px] sm:pt-[40px] pb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-black mb-6 inline-flex items-center gap-2">
          <HiOutlinePuzzle className="text-purple-500" style={{ fontSize: '24px', opacity: 0.85 }} />
          Mini Apps
        </h1>
     
        {/* Search Bar */}
        <div className="relative mb-8">
          <input
            type="text"
            className="w-full px-4 py-2.5 pr-10 text-base border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <FaSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl pointer-events-none" />
        </div>

        {/* Description Text Box */}


        {/* Browse Section */}
        {!searchQuery && (
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-black mb-6 inline-flex items-center gap-2">
              <FiGrid className="text-green-500" style={{ fontSize: '18px', opacity: 0.85 }} />
              Browse
            </h1>
            <div className="grid grid-cols-2 gap-4 mb-6 ">
              {browseCategories.map((category, index) => (
                <button
                  key={index}
                  onClick={() => handleCategoryClick(category.id)}
                  className={`rounded-xl box-shadow-sm  p-6 flex flex-col items-center justify-center min-h-[120px] 
                  `}
                  style={{background: "linear-gradient(135deg, #5F9AE1 0%, #7BB3F0 100%)"}}
                >
                  <div className="mb-3">
                    {category.id === "top-mini-apps" ? (
                      <div className="w-16 h-16 rounded-lg flex items-center justify-center bg-app-icon">
                        <div className="flex gap-1">
                          <div className={`w-3 h-8 bg-blue-500  rounded`}></div>
                          <div className={`w-3 h-6 bg-blue-500 rounded`}></div>
                          <div className={`w-3 h-10 bg-blue-500 rounded`}></div>
                        </div>
                      </div>
                    ) : (
                      <div className="w-16 h-16 bg-blue-500 rounded-lg flex items-center justify-center bg-app-icon ">
                        <div className={selectedCategory === category.id ? "text-blue-500" : "text-white"}>
                          {category.icon}
                        </div>
                      </div>
                    )}
                  </div>
                  <span className={`font-bold   text-white capitalize`}>
                    {category.name}
                  </span>
                 
                </button>
              ))}
            </div>

            {/* Show filtered apps when a category is selected */}
            {selectedCategory && categoryApps.length > 0 && (() => {
              const selectedCat = browseCategories.find(cat => cat.id === selectedCategory);
              return (
                <div ref={categoryAppsRef} className="mt-6">
                  <h3 className="text-lg font-semibold text-black mb-2 inline-flex items-center gap-2">
                    {selectedCat?.icon && (
                      <span className="flex items-center scale-75">
                        {selectedCat.icon}
                      </span>
                    )}
                    {selectedCat?.name} <span className="font-normal text-gray-500">({getCategoryCount(selectedCategory)} Available)</span>
                  </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {categoryApps.map((app, index) => {
                    const appName = app.name || t(`apps.${app.nameKey}`);
                    return (
                      <button
                        key={index}
                        onClick={() => handleAppClick({ ...app, name: appName })}
                        className="bg-white box-shadow-sm border-gray-200 rounded-xl pb-4 pt-4 pl-2 pr-2 flex flex-col items-center text-center h-full"
                      >
                    <div className="flex-shrink-0 w-16 h-16 rounded-lg flex items-center justify-center bg-app-icon">
                      {app.icon || (
                        <img
                          src={app.image}
                          alt={appName}
                          className="w-12 h-12 object-contain"
                        />
                      )}
                    </div>
                        <div className="text-black capitalize font-bold">
                          {(() => {
                            const words = appName.split(' ');
                            if (words.length <= 1) {
                              return <span>{appName}</span>;
                            }
                            const midPoint = Math.ceil(words.length / 2);
                            const firstLine = words.slice(0, midPoint).join(' ');
                            const secondLine = words.slice(midPoint).join(' ');
                            return (
                              <>
                                <div>{firstLine}</div>
                                <div>{secondLine}</div>
                              </>
                            );
                          })()}
                        </div>
                        <hr className="w-full border-gray-600 my-2" />
                        {app.description && (
                          <p className="text-xs text-gray-600 mt-1">{app.description}</p>
                        )}
                        <div className="mt-auto px-3 py-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg text-xs font-medium shadow-md opacity-90 hover:opacity-100 transition-opacity">
                          Free
                        </div>
                      </button>
                    );
                  })}
                </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* All Apps / Search Results */}
        {searchQuery && (
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-black mb-6 inline-flex items-center gap-2">
              <FaSearch className="text-green-500" style={{ fontSize: '18px', opacity: 0.85 }} />
              Search Results
            </h1>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {filteredApps.length > 0 ? (
                filteredApps.map((app, index) => {
                  const appName = app.name || t(`apps.${app.nameKey}`);
                  return (
                    <button
                      key={index}
                      onClick={() => handleAppClick({ ...app, name: appName })}
                      className="bg-white border-gray-200 rounded-xl p-4 flex flex-col items-center text-center"
                    >
                      <div className="mb-3">
                      
                          <img
                            src={app.image}
                            alt={appName}
                            className="w-16 h-16 object-contain mx-auto bg-app-icon"
                          />
                        
                      </div>
                      <span className="text-black font-medium text-sm capitalize">{appName}</span>
                      {/* {app.description && (
                        <p className="text-xs text-gray-600 mt-1">{app.description}</p>
                      )} */}
                    </button>
                  );
                })
              ) : (
                <div className="col-span-full text-center py-8">
                  <p className="text-gray-600">No mini apps found matching your search.</p>
                </div>
              )}
            </div>
          </div>
        )}

            {/* Suggested Section */}
            {!searchQuery && (
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-black mb-6 inline-flex items-center gap-2">
              <FaStar className="text-yellow-500" style={{ fontSize: '18px', opacity: 0.85 }} />
              Suggested
            </h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {suggestedApps.map((app, index) => {
                const appName = app.name || t(`apps.${app.nameKey}`);
                return (
                  <button
                    key={index}
                    onClick={() => handleAppClick({ ...app, name: appName })}
                    className="bg-white border-gray-200 rounded-xl p-4 flex items-start gap-3 text-left w-full h-full"
                  >
                    <div className="flex-shrink-0 w-16 h-16 rounded-lg flex items-center justify-center bg-app-icon">
                      {app.icon || (
                        <img
                          src={app.image}
                          alt={appName}
                          className="w-12 h-12 object-contain"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col">
                      <h3 className="font-semibold text-black mb-1">{appName}</h3>
                      <hr className="w-full border-gray-600 my-2" />
                      <p className="text-sm text-gray-600 whitespace-nowrap">{app.description}</p>
                    </div>
                    <div className="self-start px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg text-sm font-medium shadow-md opacity-90 hover:opacity-100 transition-opacity whitespace-nowrap">
                     Free
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Coming Soon Modal */}
      <InfoModal
        isOpen={showComingSoon}
        onClose={() => {
          setShowComingSoon(false);
          setSelectedApp(null);
        }}
        title={t("comingSoon.title")}
        message={t("comingSoon.message", {
          appName: selectedApp?.name || t("comingSoon.defaultAppName"),
        })}
        icon="fa-hourglass-half"
        showComingSoonIcon={true}
      />
    </div>
  );
}

