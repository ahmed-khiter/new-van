"use client";

import DeliveryAreaModal, { deriveDeliveryAreaLabel } from "@/components/Modals/DeliveryAreaModal";
import LocationSelectionModal from "@/components/Modals/LocationSelectionModal";
import Pagination from "@/components/Pagination";
import TypewriterSearchPlaceholder from "@/components/TypewriterSearchPlaceholder";
import { useCategories } from "@/hooks/useCategories";
import { Link, useRouter } from "@/i18n/routing";
import useSavedLocation from "@/lib/hooks/useSavedLocation";
import useLocationFilter from "@/lib/hooks/useLocationFilter";
import {
  calculateDeliveryTimeMinutes,
  formatDistanceByLocation,
  getCategoryPluralForm,
  getFileUrl,
  getLocationOptions,
  isNewItem,
} from "@/utils/helper";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FiArrowRight, FiMessageCircle, FiPackage, FiSearch, FiStar, FiTag } from "react-icons/fi";
import toast from "react-hot-toast";
import { useLocationModal } from "../location-modal-context";

const PAGINATION_LIMIT = 16;
const DEFAULT_RADIUS = 10;
const SEARCH_DEBOUNCE_MS = 500;
const SHOP_SEARCH_PHRASES = [
  "Search for groceries, gifts or essentials",
  "Search for pharmacy, beauty or tech",
  "Search for home, fashion or pet supplies",
];

const SHOP_CATEGORY_IMAGE_MAP = {
  all: "/assets/img/categories/swipped-market.jpg",
  groceries: "/assets/img/categories/supermarket-poster.jpg",
  supermarket: "/assets/img/categories/supermarket-poster.jpg",
  supermarkets: "/assets/img/categories/supermarket-poster.jpg",
  fashion: "/assets/img/categories/fashion.png",
  "fashion accessories": "/assets/img/categories/fashion.png",
  electronics: "/assets/img/categories/teck.png",
  "electronics tech": "/assets/img/categories/teck.png",
  tech: "/assets/img/categories/teck.png",
  pharmacy: "/assets/img/categories/health.png",
  pharmacies: "/assets/img/categories/health.png",
  "health beauty": "/assets/img/categories/health.png",
  "home living": "/assets/img/categories/home_living.png",
  "home and living": "/assets/img/categories/home_living.png",
  "home living stores": "/assets/img/categories/home_living.png",
  "home garden": "/assets/img/categories/home_living.png",
  gifts: "/assets/img/categories/gifts.png",
  "gifts occasions": "/assets/img/categories/gifts.png",
  "office stationery": "/assets/img/categories/office.png",
  "sports outdoors": "/assets/img/categories/sports.png",
};

const normalizeCategoryValue = (value = "") =>
  decodeURIComponent(String(value))
    .toLowerCase()
    .replace(/\+/g, " ")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const getShopCategoryImage = (name = "") =>
  SHOP_CATEGORY_IMAGE_MAP[normalizeCategoryValue(name)] || "/assets/img/categories/shop-poster.jpg";

const resolveImageUrl = (src) => {
  if (!src) return "";
  if (src.startsWith("http")) return src;
  if (src.startsWith("/")) return src;
  return getFileUrl(src) || src;
};

const parseOptionalNumber = (value) => {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : null;
};

const buildLocationKey = (filter) => {
  if (!filter?.location?.lat || !filter?.location?.lng || !filter?.radius) {
    return null;
  }

  return [filter.location.lat, filter.location.lng, filter.radius, filter.location.postCode || ""].join("-");
};

const buildLocationFilterFromSelection = (location) => {
  const locationData = getLocationOptions(location?.id);

  if (!locationData) {
    return null;
  }

  return {
    location: {
      lat: locationData.lat,
      lng: locationData.lng,
      address: locationData.address,
      postCode: locationData.postCode,
    },
    radius: DEFAULT_RADIUS,
  };
};

const buildDeliveryAreaFilter = (draftFilter) => {
  const address = String(draftFilter?.location?.address || "").trim();
  const postCode = String(draftFilter?.location?.postCode || "").trim();
  const lat = Number(draftFilter?.location?.lat);
  const lng = Number(draftFilter?.location?.lng);

  return {
    location: {
      lat: Number.isFinite(lat) ? lat : null,
      lng: Number.isFinite(lng) ? lng : null,
      address,
      postCode,
    },
    radius: draftFilter?.radius || DEFAULT_RADIUS,
    source: draftFilter?.source || "manual-entry",
  };
};

const normalizeShopForCard = (shop = {}) => {
  const galleryImage = shop?.gallery?.[0]?.imageUrl || shop?.gallery?.[0]?.image || "";
  const distance = parseOptionalNumber(shop.distance);

  return {
    ...shop,
    id: shop.id || "",
    name: shop.name || "",
    image: resolveImageUrl(shop.image || galleryImage),
    rating: typeof shop.rating === "number" ? shop.rating : shop.rating ? Number(shop.rating) : null,
    reviewCount:
      typeof shop.reviewCount === "number"
        ? shop.reviewCount
        : shop.reviewCount
        ? Number(shop.reviewCount)
        : 0,
    distance,
    category: shop.category || "",
    categoryname: shop.categoryname || shop.categoryName || "",
    createdAt: shop.createdAt || null,
    isClosed: Boolean(shop.isClosed),
    _count: {
      ...shop._count,
      products: shop?._count?.products || 0,
    },
  };
};

const getCategoryTokens = (category) =>
  new Set(
    [category?.id, category?.categoryId, category?.name, ...(category?.aliases || [])]
      .map((value) => normalizeCategoryValue(value))
      .filter(Boolean),
  );

const buildCategoryDefinitions = (liveCategories = []) => {
  const filteredLiveCategories = liveCategories.filter(
    (category) => normalizeCategoryValue(category?.name) !== "all",
  );

  const allCategory = {
    id: "all",
    name: "All",
    categoryId: "",
    imageUrl: getShopCategoryImage("all"),
    aliases: ["all"],
  };

  const liveDefinitions = filteredLiveCategories.map((category) => {
    return {
      id: String(category.id),
      name: category.name,
      categoryId: String(category.id),
      imageUrl: resolveImageUrl(category.image) || getShopCategoryImage(category.name),
      aliases: [],
    };
  });

  return [
    {
      id: "all",
      name: allCategory.name,
      categoryId: "",
      imageUrl: allCategory.imageUrl,
      aliases: allCategory.aliases,
    },
    ...liveDefinitions,
  ];
};

const buildCategoryCarouselItems = (liveCategories = [], categoryDefinitions = []) => {
  if (liveCategories.length === 0) {
    return categoryDefinitions;
  }

  const liveCategoryIds = new Set(
    liveCategories
      .filter((category) => normalizeCategoryValue(category?.name) !== "all")
      .map((category) => String(category.id)),
  );

  return categoryDefinitions.filter(
    (category) => category.id === "all" || liveCategoryIds.has(String(category.categoryId ?? category.id)),
  );
};

const matchesCategorySelection = (shop, normalizedCategory, categoryDefinitions) => {
  if (!normalizedCategory) {
    return true;
  }

  const shopTokens = new Set(
    [shop.category, shop.categorySlug, shop.categoryname, shop.categoryName]
      .map((value) => normalizeCategoryValue(value))
      .filter(Boolean),
  );

  const matchedCategory = categoryDefinitions.find((category) => getCategoryTokens(category).has(normalizedCategory));

  if (matchedCategory) {
    for (const token of getCategoryTokens(matchedCategory)) {
      if (shopTokens.has(token)) {
        return true;
      }
    }
  }

  return shopTokens.has(normalizedCategory);
};

const useShopFetcher = ({ paginationLimit }) => {
  const [shops, setShops] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    limit: paginationLimit,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const isFetching = useRef(false);
  const lastFetchParams = useRef({
    category: null,
    search: null,
    page: null,
    locationKey: null,
  });

  const fetchShops = useCallback(
    async (page = 1, search = "", category = "", filterParams = {}, errorMessages = {}) => {
      const locationKey = buildLocationKey(filterParams);
      const currentParams = { category, search, page, locationKey };

      if (
        lastFetchParams.current.category === currentParams.category &&
        lastFetchParams.current.search === currentParams.search &&
        lastFetchParams.current.page === currentParams.page &&
        lastFetchParams.current.locationKey === currentParams.locationKey
      ) {
        return;
      }

      lastFetchParams.current = currentParams;

      if (isFetching.current) {
        return;
      }

      try {
        isFetching.current = true;
        setIsLoading(true);

        const params = new URLSearchParams({
          page: page.toString(),
          limit: paginationLimit.toString(),
          type: "shop",
          ...(search && { search }),
          ...(category && { category }),
          ...(filterParams?.location?.lat &&
            filterParams?.location?.lng &&
            filterParams?.radius && {
              lat: filterParams.location.lat.toString(),
              lng: filterParams.location.lng.toString(),
              radius: filterParams.radius.toString(),
              ...(filterParams.location.postCode && {
                postCode: filterParams.location.postCode,
              }),
            }),
        });

        const response = await fetch(`/api/shops/public?${params.toString()}`);
        const data = await response.json();

        if (response.ok) {
          setShops((data.shops || []).map(normalizeShopForCard));
          setPagination((prev) => ({
            ...prev,
            ...(data.pagination || {}),
            limit: paginationLimit,
          }));
        } else {
          toast.error(data.error || errorMessages.failed || "Failed to fetch shops");
        }
      } catch (error) {
        console.error("Error fetching shops:", error);
        toast.error(error.message || errorMessages.error || "Error fetching shops");
      } finally {
        setIsLoading(false);
        isFetching.current = false;
      }
    },
    [paginationLimit],
  );

  return { shops, isLoading, pagination, setPagination, fetchShops };
};

const useCategoryUrlSync = ({ categoryDefinitions, categoriesLoading }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedService, setSelectedService] = useState(null);
  const isManualCategoryUpdate = useRef(false);

  useEffect(() => {
    if ((categoriesLoading && categoryDefinitions.length === 0) || isManualCategoryUpdate.current) {
      if (isManualCategoryUpdate.current) {
        setTimeout(() => {
          isManualCategoryUpdate.current = false;
        }, 0);
      }
      return;
    }

    const categoryParam = searchParams?.get("category");

    if (!categoryParam) {
      if (selectedCategory) {
        setSelectedCategory("");
        setSelectedService(null);
      }
      return;
    }

    const normalizedParam = normalizeCategoryValue(categoryParam);

    if (normalizedParam === "all") {
      if (selectedCategory) {
        setSelectedCategory("");
        setSelectedService(null);
      }
      return;
    }

    const matchedCategory = categoryDefinitions.find((category) => getCategoryTokens(category).has(normalizedParam));

    if (!matchedCategory) {
      if (selectedCategory) {
        setSelectedCategory("");
        setSelectedService(null);
      }
      return;
    }

    const categoryId = String(matchedCategory.categoryId ?? matchedCategory.id ?? "");

    if (selectedCategory !== categoryId) {
      setSelectedCategory(categoryId);
      setSelectedService({
        id: categoryId,
        name: matchedCategory.name,
        categoryId,
      });
    }
  }, [categoriesLoading, categoryDefinitions, searchParams, selectedCategory]);

  const updateCategoryInUrl = useCallback(
    (categoryName) => {
      isManualCategoryUpdate.current = true;
      const currentUrl = new URL(window.location.href);

      if (categoryName) {
        currentUrl.searchParams.set("category", categoryName.toLowerCase());
      } else {
        currentUrl.searchParams.delete("category");
      }

      router.replace(currentUrl.pathname + currentUrl.search, { scroll: false });
    },
    [router],
  );

  const handleCategorySelection = useCallback(
    (service) => {
      if (!service) {
        setSelectedService(null);
        setSelectedCategory("");
        updateCategoryInUrl(null);
        return;
      }

      const categoryId = String(service.categoryId ?? service.id ?? "");

      if (selectedService?.categoryId === categoryId) {
        setSelectedService(null);
        setSelectedCategory("");
        updateCategoryInUrl(null);
        return;
      }

      setSelectedService({
        id: categoryId,
        name: service.name,
        categoryId,
      });
      setSelectedCategory(categoryId);
      updateCategoryInUrl(service.name || null);
    },
    [selectedService, updateCategoryInUrl],
  );

  return {
    selectedCategory,
    selectedService,
    handleCategorySelection,
  };
};

export default function ShopPage() {
  const router = useRouter();
  const t = useTranslations("ShopsPage");
  const { categories, loading: categoriesLoading } = useCategories("shop");
  const { registerOpener } = useLocationModal();

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isLocationSelectorOpen, setIsLocationSelectorOpen] = useState(false);
  const [isDeliveryAreaModalOpen, setIsDeliveryAreaModalOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);

  const { locationFilter, setLocationFilter, isLoading: isLocationFilterLoading } = useLocationFilter();
  const { savedLocation, savedLocationFilter } = useSavedLocation();

  const categoryDefinitions = useMemo(
    () => buildCategoryDefinitions(categories),
    [categories],
  );

  const categoryCarouselItems = useMemo(
    () => buildCategoryCarouselItems(categories, categoryDefinitions),
    [categories, categoryDefinitions],
  );

  const { selectedCategory, selectedService, handleCategorySelection } = useCategoryUrlSync({
    categoryDefinitions,
    categoriesLoading,
  });

  const { shops, isLoading, pagination, setPagination, fetchShops } = useShopFetcher({
    paginationLimit: PAGINATION_LIMIT,
  });

  const errorMessages = useMemo(
    () => ({
      failed: t("failed_fetch_shops"),
      error: t("error_fetching_shops"),
    }),
    [t],
  );

  const activeLocationFilter = useMemo(
    () => locationFilter || savedLocationFilter || null,
    [locationFilter, savedLocationFilter],
  );

  const activeLocationKey = useMemo(() => buildLocationKey(activeLocationFilter), [activeLocationFilter]);

  const pluralCategories = useMemo(
    () =>
      categoryDefinitions
        .filter((category) => category.id !== "all")
        .map((category) => ({
          id: String(category.categoryId ?? category.id),
          name: category.name,
        })),
    [categoryDefinitions],
  );

  const previousFetchRef = useRef({
    category: null,
    search: null,
    page: null,
    locationKey: null,
  });

  useEffect(() => {
    registerOpener(() => setIsLocationSelectorOpen(true));
    return () => registerOpener(null);
  }, [registerOpener]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery.trim());
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const locationInitialized = useRef(false);
  useEffect(() => {
    if (!isLocationFilterLoading && !locationInitialized.current && savedLocation) {
      setSelectedLocation(savedLocation);
      locationInitialized.current = true;
    }
  }, [isLocationFilterLoading, savedLocation]);

  useEffect(() => {
    // Don't fetch until categories are ready. Location loading is best-effort —
    // if it's still resolving we fetch without a filter (returns all shops) and
    // will re-fetch automatically once the location resolves and activeLocationKey changes.
    if (categoriesLoading) {
      return;
    }

    const nextFetchState = {
      category: selectedCategory,
      search: debouncedSearchQuery,
      page: 1,
      locationKey: activeLocationKey,
    };

    if (
      previousFetchRef.current.category === nextFetchState.category &&
      previousFetchRef.current.search === nextFetchState.search &&
      previousFetchRef.current.page === nextFetchState.page &&
      previousFetchRef.current.locationKey === nextFetchState.locationKey
    ) {
      return;
    }

    previousFetchRef.current = nextFetchState;
    fetchShops(1, debouncedSearchQuery, selectedCategory, activeLocationFilter || {}, errorMessages);
  }, [
    activeLocationFilter,
    activeLocationKey,
    categoriesLoading,
    debouncedSearchQuery,
    errorMessages,
    fetchShops,
    selectedCategory,
  ]);

  const handlePageChange = useCallback(
    (page) => {
      setPagination((prev) => ({ ...prev, currentPage: page }));
      previousFetchRef.current = {
        category: selectedCategory,
        search: debouncedSearchQuery,
        page,
        locationKey: activeLocationKey,
      };

      fetchShops(page, debouncedSearchQuery, selectedCategory, activeLocationFilter || {}, errorMessages);
    },
    [
      activeLocationFilter,
      activeLocationKey,
      debouncedSearchQuery,
      errorMessages,
      fetchShops,
      selectedCategory,
      setPagination,
    ],
  );

  const handleSearchChange = useCallback(
    (event) => {
      setSearchQuery(event.target.value);
      setPagination((prev) => ({ ...prev, currentPage: 1 }));
    },
    [setPagination],
  );

  const handleLocationChange = useCallback(
    (location) => {
      setSelectedLocation(location);
      const nextLocationFilter = buildLocationFilterFromSelection(location);

      if (nextLocationFilter) {
        setLocationFilter(nextLocationFilter);
      }

      setPagination((prev) => ({ ...prev, currentPage: 1 }));
    },
    [setLocationFilter, setPagination],
  );

  const handleCategoryClick = useCallback(
    (category) => {
      setPagination((prev) => ({ ...prev, currentPage: 1 }));

      if (category.id === "all") {
        handleCategorySelection(null);
        return;
      }

      handleCategorySelection(category);
    },
    [handleCategorySelection, setPagination],
  );

  const deliveryAreaLabel = useMemo(() => {
    return deriveDeliveryAreaLabel(activeLocationFilter);
  }, [activeLocationFilter]);

  const deliveryAreaBadgeLabel = deliveryAreaLabel
    ? `Delivering to ${deliveryAreaLabel}`
    : "Set a postcode or current location";

  const handleDeliveryAreaApply = useCallback(
    (draftFilter) => {
      setLocationFilter(buildDeliveryAreaFilter(draftFilter));
      setPagination((prev) => ({ ...prev, currentPage: 1 }));
    },
    [setLocationFilter, setPagination],
  );

  const emptyStateMessage = useMemo(() => {
    const defaultPlural = getCategoryPluralForm(selectedCategory, pluralCategories, "shops");

    if (!selectedCategory || pluralCategories.length === 0) {
      return defaultPlural;
    }

    const selectedCategoryDefinition = pluralCategories.find(
      (category) => String(category.id) === String(selectedCategory),
    );

    if (!selectedCategoryDefinition?.name) {
      return defaultPlural;
    }

    const categoryName = selectedCategoryDefinition.name.toLowerCase();
    if (categoryName.includes("supermarket") || categoryName.includes("pharmacy")) {
      return defaultPlural;
    }

    return `${defaultPlural} shops`;
  }, [pluralCategories, selectedCategory]);

  const handleShopClick = useCallback(
    (shopId) => {
      router.push(`/shops/${shopId}/products`);
    },
    [router],
  );

  return (
    <div className="min-h-screen bg-white">
      <div className="relative h-[280px] w-full overflow-hidden sm:h-[320px] md:h-[380px]">
        <img
          src="https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=1920&q=80"
          alt="Marketplace"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/50 to-black/80" />
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/30 to-transparent" />

        <div className="relative z-10 flex h-full flex-col justify-end px-4 pb-6 sm:px-0 sm:pb-8 md:pb-10">
          <div className="container">
            <h1 className="mb-1.5 text-[clamp(1.35rem,4vw,2.4rem)] font-bold leading-[1.15] tracking-[-0.03em] text-white">
              Explore Retail Stores
            </h1>
            <p className="mb-4 max-w-[420px] text-[13px] text-white/80 sm:text-[15px]">
              Browse thousands of products delivered in minutes.
            </p>

            <div className="relative max-w-[480px]">
              <FiSearch className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[16px] text-white/50" />
              <TypewriterSearchPlaceholder
                phrases={SHOP_SEARCH_PHRASES}
                isVisible={!searchQuery && !isSearchFocused}
                className="pointer-events-none absolute left-10 right-4 top-1/2 z-10 flex -translate-y-1/2 items-center gap-1 overflow-hidden whitespace-nowrap text-[14px] text-white/55"
              />
              <input
                type="text"
                className="h-[44px] w-full rounded-full border border-white/20 bg-white/15 pl-10 pr-4 text-[14px] text-white shadow-[0_8px_32px_rgba(0,0,0,0.25)] outline-none backdrop-blur-md transition focus:border-white/35 focus:bg-white/25 sm:h-[48px]"
                placeholder=""
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
              />
            </div>

            <div className="mt-3">
              <button
                type="button"
                onClick={() => setIsDeliveryAreaModalOpen(true)}
                className="delivery-area-trigger inline-flex max-w-full items-center gap-2.5 rounded-full px-3 py-1.5 text-left transition hover:translate-y-[-1px]"
              >
                <span
                  className={`delivery-area-status-dot shrink-0 ${
                    deliveryAreaLabel ? "" : "is-inactive"
                  }`}
                />
                <span className="truncate text-[12.5px] font-semibold sm:text-[13px]">
                  {deliveryAreaBadgeLabel}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="relative">
        <div className="px-3 sm:px-0">
          <div className="container">
            <div className="py-3 sm:py-4">
              <div className="flex gap-3 overflow-x-auto scrollbar-hide sm:gap-4">
                {categoryCarouselItems.map((category) => {
                  const categoryValue = String(category.categoryId ?? category.id ?? "");
                  const isActive = category.id === "all" ? !selectedCategory : selectedCategory === categoryValue;

                  return (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => handleCategoryClick(category)}
                      className="group/cat flex w-[60px] shrink-0 flex-col items-center text-center sm:w-[68px]"
                    >
                      <span
                        className={`mb-1.5 flex h-[52px] w-[52px] items-center justify-center overflow-hidden rounded-full transition duration-200 sm:h-[58px] sm:w-[58px] ${
                          isActive ? "opacity-100 shadow-md" : "opacity-85 group-hover/cat:opacity-100"
                        }`}
                      >
                        {category.id === "all" ? (
                          <span className={`flex h-full w-full items-center justify-center text-[22px] ${isActive ? "bg-[#1a1a2e] text-white" : "bg-[#f0f0ee] text-[#6b7280]"}`}>
                            🛍️
                          </span>
                        ) : (
                          <img src={category.imageUrl} alt={category.name} className="h-full w-full object-cover" />
                        )}
                      </span>
                      <span
                        className={`text-[10px] font-medium leading-tight transition sm:text-[11px] ${
                          isActive ? "text-[#1a1a2e]" : "text-[#6b7280] group-hover/cat:text-[#1a1a2e]"
                        }`}
                      >
                        {category.name}
                      </span>
                      {isActive && <span className="mt-1 h-[2px] w-5 rounded-full bg-[#1a1a2e]" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
        <div className="pointer-events-none absolute bottom-0 right-0 top-0 w-12 bg-gradient-to-l from-white to-transparent" />
      </div>

      <div className="border-t border-[#f0f0ee]" />

      <div className="px-3 sm:px-0">
        <div className="container">
          <div className="py-4 sm:py-5 md:py-6">
            <div className="grid grid-cols-1 gap-x-4 gap-y-5 sm:grid-cols-2 sm:gap-x-5 sm:gap-y-6 lg:grid-cols-3 xl:grid-cols-4">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="animate-pulse">
                    <div className="mb-3 h-[200px] rounded-xl bg-[#f0f0ee]" />
                    <div className="mb-2 h-4 w-3/5 rounded bg-[#f0f0ee]" />
                    <div className="h-3 w-2/5 rounded bg-[#f0f0ee]" />
                  </div>
                ))
              ) : shops.length === 0 ? (
                <div className="col-span-full py-16 text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#f5f5f3] text-xl">
                    🛍️
                  </div>
                  {debouncedSearchQuery ? (
                    <>
                      <h3 className="mb-1 text-lg font-bold text-[#1a1a2e]">{t("no_shops_found")}</h3>
                      <p className="text-[14px] text-[#6b7280]">{t("no_shops_search")}</p>
                    </>
                  ) : (
                    <>
                      <h3 className="mb-1 text-lg font-bold text-[#1a1a2e]">No {emptyStateMessage} nearby yet</h3>
                      <p className="mb-5 text-[14px] text-[#6b7280]">
                        We&apos;re growing fast. Be the first to list here.
                      </p>
                      <div className="flex flex-col items-center gap-2.5">
                        {selectedService && (
                          <button
                            onClick={() => handleCategoryClick({ id: "all" })}
                            className="inline-flex items-center gap-2 rounded-full bg-[#1a1a2e] px-5 py-2.5 text-sm font-semibold text-white transition hover:shadow-lg"
                          >
                            View all shops <FiArrowRight />
                          </button>
                        )}
                        <Link
                          href="/partner-with-us#shop-owners"
                          className="inline-flex items-center gap-2 rounded-full border border-[#d0d5de] bg-white px-5 py-2.5 text-sm font-semibold text-[#6b7280] no-underline transition hover:border-[#b0b7c3] hover:text-[#1a1a2e]"
                        >
                          List your shop
                        </Link>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                shops.map((shop) => {
                  const distanceValue = parseOptionalNumber(shop.distance);
                  const distanceLabel = distanceValue !== null
                    ? formatDistanceByLocation(distanceValue, selectedLocation)
                    : null;
                  const deliveryTime =
                    distanceValue !== null
                      ? calculateDeliveryTimeMinutes(distanceValue)
                      : shop.deliveryTime || null;
                  const ratingValue = Number(shop.rating || 0);
                  const rating = ratingValue > 0 ? ratingValue.toFixed(1) : "New";
                  const reviewCount = Number(shop.reviewCount || 0);
                  const productsCount = shop?._count?.products || 0;
                  const fallbackImage = getShopCategoryImage(shop.categoryname || shop.category);

                  return (
                    <article key={shop.id} onClick={() => handleShopClick(shop.id)} className="group cursor-pointer">
                      <div className="relative mb-3 overflow-hidden rounded-xl">
                        {shop.image ? (
                          <img
                            src={shop.image}
                            alt={shop.name}
                            onError={(event) => {
                              event.currentTarget.onerror = null;
                              event.currentTarget.src = fallbackImage;
                            }}
                            className="h-[200px] w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                          />
                        ) : (
                          <div className="flex h-[200px] items-center justify-center bg-[#f0f0ee] text-3xl text-[#c2b7a8]">
                            <i className="bi bi-image" />
                          </div>
                        )}

                        {isNewItem(shop.createdAt) && (
                          <span className="absolute left-3 top-3 rounded-md bg-[#1a1a2e] px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white">
                            New
                          </span>
                        )}

                        {deliveryTime ? (
                          <span className="absolute bottom-3 right-3 rounded-md bg-white/90 px-2 py-1 text-[11px] font-semibold text-[#1a1a2e] backdrop-blur-sm">
                            {typeof deliveryTime === "number" ? `${deliveryTime} min` : deliveryTime}
                          </span>
                        ) : null}
                      </div>

                      <h3 className="mb-0.5 truncate text-[15px] font-semibold text-[#1a1a2e]">{shop.name}</h3>
                      <p className="mb-0 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-[13px] text-[#6b7280]">
                        <span className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-0.5">
                          {ratingValue > 0 ? (
                            <span className="inline-flex items-center gap-1">
                              <FiStar className="shrink-0 fill-[#1a1a2e] text-[#1a1a2e]" size={12} />
                              <span className="font-medium text-[#1a1a2e]">{rating}</span>
                            </span>
                          ) : null}
                          <span className="inline-flex items-center gap-1">
                            <FiMessageCircle className="shrink-0 opacity-70" size={12} />
                            <span>{reviewCount} reviews</span>
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <FiPackage className="shrink-0 opacity-70" size={12} />
                            <span>{productsCount} items</span>
                          </span>
                          {distanceLabel ? (
                            <span>{distanceLabel}</span>
                          ) : null}
                        </span>
                        {shop.categoryname ? (
                          <span className="inline-flex shrink-0 items-center gap-1 truncate text-right font-medium text-[#1a1a2e]">
                            <FiTag className="shrink-0 opacity-70" size={12} />
                            {shop.categoryname}
                          </span>
                        ) : null}
                      </p>
                    </article>
                  );
                })
              )}
            </div>

            {pagination.totalPages > 1 ? (
              <div className="mt-6 flex justify-center">
                <Pagination
                  currentPage={pagination.currentPage}
                  totalPages={pagination.totalPages}
                  onPageChange={handlePageChange}
                  hasNextPage={pagination.hasNextPage}
                  hasPrevPage={pagination.hasPrevPage}
                />
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <LocationSelectionModal
        isOpen={isLocationSelectorOpen}
        onLocationSelect={(location) => {
          setIsLocationSelectorOpen(false);
          handleLocationChange(location);
        }}
        onCancel={() => setIsLocationSelectorOpen(false)}
        currentLocation={selectedLocation}
        presentation="page"
      />

      <DeliveryAreaModal
        isOpen={isDeliveryAreaModalOpen}
        onClose={() => setIsDeliveryAreaModalOpen(false)}
        onApply={handleDeliveryAreaApply}
        currentFilter={activeLocationFilter}
        contextLabel="shops and products nearby"
        submitLabel="See stores nearby"
      />
    </div>
  );
}
