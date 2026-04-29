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

/* ─── Configuration ─── */

const PAGINATION_LIMIT = 16;
const DEFAULT_RADIUS = 10;
const SEARCH_DEBOUNCE_MS = 500;
const RESTAURANT_SEARCH_PHRASES = [
  "Search for restaurants near you",
  "Search for pizza, sushi or burgers",
  "Search for brunch, dinner or late-night food",
];

const CATEGORY_IMAGE_MAP = {
  All: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=200&h=200&q=80",
  Breakfast: "https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?auto=format&fit=crop&w=200&h=200&q=80",
  Burgers: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=200&h=200&q=80",
  Pizza: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=200&h=200&q=80",
  Sushi: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=200&h=200&q=80",
  Indian: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=200&h=200&q=80",
  Chinese: "https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=200&h=200&q=80",
  Coffee: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=200&h=200&q=80",
  Desserts: "https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=200&h=200&q=80",
  Healthy: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=200&h=200&q=80",
  "Asian Fusion": "https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=200&h=200&q=80",
  Turkish: "https://images.unsplash.com/photo-1561626423-3c28b2f8bb78?auto=format&fit=crop&w=200&h=200&q=80",
  Mexican: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=200&h=200&q=80",
  Caribbean: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=200&h=200&q=80",
  "Italian Cuisine": "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=200&h=200&q=80",
  Dessert: "https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=200&h=200&q=80",
};

/* ─── Utilities ─── */

const isAllCategory = (category) =>
  String(category?.name || "")
    .trim()
    .toLowerCase() === "all";

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

const normalizeRestaurantForCard = (restaurant = {}) => {
  const galleryImage = restaurant?.gallery?.[0]?.imageUrl || restaurant?.gallery?.[0]?.image || "";

  return {
    ...restaurant,
    image: resolveImageUrl(restaurant.image || galleryImage),
    distance: parseOptionalNumber(restaurant.distance),
    rating: parseOptionalNumber(restaurant.rating),
    reviewCount: parseOptionalNumber(restaurant.reviewCount) ?? 0,
  };
};

const getRestaurantFallbackImage = (restaurant = {}) => {
  const cuisine = String(restaurant.cuisine || restaurant.categoryname || restaurant.category || "")
    .trim();

  return CATEGORY_IMAGE_MAP[cuisine] || CATEGORY_IMAGE_MAP.All;
};

const buildLocationKey = (filter) => {
  if (!filter?.location?.lat || !filter?.location?.lng || !filter?.radius) return null;
  return [filter.location.lat, filter.location.lng, filter.radius, filter.location.postCode || ""].join("-");
};

const buildLocationFilterFromSelection = (location) => {
  const data = getLocationOptions(location?.id);
  if (!data) return null;
  return {
    location: { lat: data.lat, lng: data.lng, address: data.address, postCode: data.postCode },
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

/* ─── Hooks ─── */

const useRestaurantFetcher = (paginationLimit) => {
  const [restaurants, setRestaurants] = useState([]);
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
  const lastFetchParams = useRef({ category: null, search: null, page: null, locationKey: null });

  const fetchRestaurants = useCallback(
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

      if (isFetching.current) return;

      try {
        isFetching.current = true;
        setIsLoading(true);

        const params = new URLSearchParams({
          page: page.toString(),
          limit: paginationLimit.toString(),
          type: "restaurant",
          status: "active",
          ...(search && { search }),
          ...(category && { category }),
          ...(filterParams?.location?.lat &&
            filterParams?.location?.lng &&
            filterParams?.radius && {
              lat: filterParams.location.lat.toString(),
              lng: filterParams.location.lng.toString(),
              radius: filterParams.radius.toString(),
              ...(filterParams.location.postCode && { postCode: filterParams.location.postCode }),
            }),
        });

        const response = await fetch(`/api/shops/public?${params.toString()}`);
        const data = await response.json();

        if (response.ok) {
          setRestaurants((data.shops || []).map(normalizeRestaurantForCard));
          setPagination((prev) => ({ ...prev, ...(data.pagination || {}), limit: paginationLimit }));
        } else {
          toast.error(data.error || errorMessages.failed || "Failed to fetch restaurants");
        }
      } catch (error) {
        console.error("Error fetching restaurants:", error);
        toast.error(error.message || errorMessages.error || "Error fetching restaurants");
      } finally {
        setIsLoading(false);
        isFetching.current = false;
      }
    },
    [paginationLimit]
  );

  return { restaurants, isLoading, pagination, setPagination, fetchRestaurants };
};

const useCategoryUrlSync = (categories, categoriesLoading) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedService, setSelectedService] = useState(null);
  const isManualCategoryUpdate = useRef(false);

  useEffect(() => {
    if (categoriesLoading || isManualCategoryUpdate.current) {
      if (isManualCategoryUpdate.current) {
        setTimeout(() => { isManualCategoryUpdate.current = false; }, 0);
      }
      return;
    }

    const categoryParam = searchParams?.get("category");
    if (categoryParam && categories.length > 0) {
      const matched = categories.find(
        (c) => c.name.toLowerCase() === categoryParam.toLowerCase()
      );

      if (matched) {
        const categoryId = String(matched.id);
        if (selectedCategory !== categoryId) {
          setSelectedCategory(categoryId);
          setSelectedService({ id: categoryId, name: matched.name, categoryId: matched.id });
        }
      }
    } else if (!categoryParam && selectedCategory) {
      setSelectedCategory("");
      setSelectedService(null);
    }
  }, [searchParams, categories, categoriesLoading, selectedCategory]);

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
    [router]
  );

  const handleCategorySelection = useCallback(
    (service) => {
      if (!service) {
        setSelectedService(null);
        setSelectedCategory("");
        updateCategoryInUrl(null);
        return;
      }
      const categoryId = service?.categoryId ? String(service.categoryId) : "";
      setSelectedService(service);
      setSelectedCategory(categoryId);
      updateCategoryInUrl(service?.name || null);
    },
    [updateCategoryInUrl]
  );

  return { selectedCategory, selectedService, handleCategorySelection };
};

/* ─── Page component ─── */

export default function RestaurantsPage() {
  const router = useRouter();
  const t = useTranslations("RestaurantsPage");
  const { categories, loading: categoriesLoading } = useCategories("restaurant");
  const { registerOpener } = useLocationModal();

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isLocationSelectorOpen, setIsLocationSelectorOpen] = useState(false);
  const [isDeliveryAreaModalOpen, setIsDeliveryAreaModalOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);

  const { locationFilter, setLocationFilter, isLoading: isLocationFilterLoading } =
    useLocationFilter();
  const { savedLocation, savedLocationFilter } = useSavedLocation();

  const filteredCategories = useMemo(
    () => (categories || []).filter((category) => !isAllCategory(category)),
    [categories],
  );

  const { selectedCategory, selectedService, handleCategorySelection } = useCategoryUrlSync(
    filteredCategories,
    categoriesLoading
  );

  const { restaurants, isLoading, pagination, setPagination, fetchRestaurants } =
    useRestaurantFetcher(PAGINATION_LIMIT);

  const errorMessages = useMemo(
    () => ({ failed: t("failed_fetch_restaurants"), error: t("error_fetching_restaurants") }),
    [t]
  );

  const activeLocationFilter = useMemo(
    () => locationFilter || savedLocationFilter || null,
    [locationFilter, savedLocationFilter]
  );

  const activeLocationKey = useMemo(() => buildLocationKey(activeLocationFilter), [activeLocationFilter]);

  const previousFetchRef = useRef({ category: null, search: null, page: null, locationKey: null });

  useEffect(() => {
    registerOpener(() => setIsLocationSelectorOpen(true));
    return () => registerOpener(null);
  }, [registerOpener]);

  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearchQuery(searchQuery.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(id);
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
    // fetch without a filter immediately (returns all restaurants), then re-fetch
    // when activeLocationKey changes once location resolves.
    if (categoriesLoading) return;

    const next = {
      category: selectedCategory,
      search: debouncedSearchQuery,
      page: 1,
      locationKey: activeLocationKey,
    };

    if (
      previousFetchRef.current.category === next.category &&
      previousFetchRef.current.search === next.search &&
      previousFetchRef.current.page === next.page &&
      previousFetchRef.current.locationKey === next.locationKey
    ) {
      return;
    }

    previousFetchRef.current = next;
    fetchRestaurants(1, debouncedSearchQuery, selectedCategory, activeLocationFilter || {}, errorMessages);
  }, [
    activeLocationFilter,
    activeLocationKey,
    categoriesLoading,
    debouncedSearchQuery,
    errorMessages,
    fetchRestaurants,
    selectedCategory,
  ]);

  const handleSearchChange = useCallback(
    (e) => {
      setSearchQuery(e.target.value);
      setPagination((prev) => ({ ...prev, currentPage: 1 }));
    },
    [setPagination]
  );

  const handlePageChange = useCallback(
    (page) => {
      setPagination((prev) => ({ ...prev, currentPage: page }));
      previousFetchRef.current = { category: selectedCategory, search: debouncedSearchQuery, page, locationKey: activeLocationKey };
      fetchRestaurants(page, debouncedSearchQuery, selectedCategory, activeLocationFilter || {}, errorMessages);
    },
    [activeLocationFilter, activeLocationKey, debouncedSearchQuery, errorMessages, fetchRestaurants, selectedCategory, setPagination]
  );

  const handleLocationChange = useCallback(
    (location) => {
      setSelectedLocation(location);
      const filter = buildLocationFilterFromSelection(location);
      if (filter) setLocationFilter(filter);
      setPagination((prev) => ({ ...prev, currentPage: 1 }));
    },
    [setLocationFilter, setPagination]
  );

  const handleLocationFilterApply = useCallback(
    (filterData) => {
      setLocationFilter(buildDeliveryAreaFilter(filterData));
      setPagination((prev) => ({ ...prev, currentPage: 1 }));
    },
    [setLocationFilter, setPagination]
  );

  const handleViewMenu = useCallback(
    (restaurant) => {
      router.push(`/restaurants/${restaurant.id}/menu`);
    },
    [router]
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
    [handleCategorySelection, setPagination]
  );

  const categoryCarouselItems = useMemo(() => {
    const live = filteredCategories.slice(0, 12).map((c) => ({
      id: String(c.id),
      name: c.name,
      categoryId: c.id,
      imageUrl: resolveImageUrl(c.image) || CATEGORY_IMAGE_MAP[c.name] || CATEGORY_IMAGE_MAP.All,
    }));

    return [
      { id: "all", name: "All", categoryId: "", imageUrl: CATEGORY_IMAGE_MAP.All },
      ...live,
    ];
  }, [filteredCategories]);

  const deliveryAreaLabel = useMemo(() => {
    return deriveDeliveryAreaLabel(activeLocationFilter);
  }, [activeLocationFilter]);

  const deliveryAreaBadgeLabel = deliveryAreaLabel
    ? `Delivering to ${deliveryAreaLabel}`
    : "Set a postcode or current location";

  return (
    <div className="min-h-screen bg-white">
      {/* ── Hero Banner ── */}
      <div className="relative h-[280px] w-full overflow-hidden sm:h-[320px] md:h-[380px]">
        <img
          src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1920&q=80"
          alt="Restaurants"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/50 to-black/80" />
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/30 to-transparent" />

        <div className="relative z-10 flex h-full flex-col justify-end px-4 pb-6 sm:px-0 sm:pb-8 md:pb-10">
          <div className="container">
            <h1 className="mb-1.5 text-[clamp(1.35rem,4vw,2.4rem)] font-bold leading-[1.15] tracking-[-0.03em] text-white">
              Order from local restaurants
            </h1>
            <p className="mb-4 max-w-[420px] text-[13px] text-white/80 sm:text-[15px]">
              Delivered to your door in under 60 minutes.
            </p>

            <div className="relative max-w-[480px]">
              <FiSearch className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[16px] text-white/50" />
              <TypewriterSearchPlaceholder
                phrases={RESTAURANT_SEARCH_PHRASES}
                isVisible={!searchQuery && !isSearchFocused}
                className="pointer-events-none absolute left-10 right-4 top-1/2 z-10 flex -translate-y-1/2 items-center gap-1 overflow-hidden whitespace-nowrap text-[14px] text-white/55"
              />
              <input
                type="text"
                className="h-[44px] w-full rounded-full border border-white/20 bg-white/15 pl-10 pr-4 text-[14px] text-white shadow-[0_8px_32px_rgba(0,0,0,0.25)] outline-none backdrop-blur-md transition placeholder:text-white/50 focus:border-white/35 focus:bg-white/25 sm:h-[48px]"
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

      {/* ── Categories ── */}
      <div className="relative">
        <div className="px-3 sm:px-0">
          <div className="container">
            <div className="py-3 sm:py-4">
              <div className="flex gap-3 overflow-x-auto scrollbar-hide sm:gap-4">
                {categoryCarouselItems.map((category) => {
                  const categoryValue = String(category.categoryId ?? category.id ?? "");
                  const isActive =
                    category.id === "all" ? !selectedCategory : selectedCategory === categoryValue;

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
                            🍽️
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

      {/* ── Divider ── */}
      <div className="border-t border-[#f0f0ee]" />

      {/* ── Restaurant Grid ── */}
      <div className="px-3 sm:px-0">
        <div className="container">
          <div className="py-4 sm:py-5 md:py-6">
            <div className="grid grid-cols-1 gap-x-4 gap-y-5 sm:grid-cols-2 sm:gap-x-5 sm:gap-y-6 lg:grid-cols-3 xl:grid-cols-4">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="mb-3 h-[200px] rounded-xl bg-[#f0f0ee]" />
                    <div className="mb-2 h-4 w-3/5 rounded bg-[#f0f0ee]" />
                    <div className="h-3 w-2/5 rounded bg-[#f0f0ee]" />
                  </div>
                ))
              ) : restaurants.length === 0 ? (
                <div className="col-span-full py-16 text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#f5f5f3] text-xl">
                    🍽️
                  </div>
                  {debouncedSearchQuery ? (
                    <>
                      <h3 className="mb-1 text-lg font-bold text-[#1a1a2e]">{t("no_restaurants_found")}</h3>
                      <p className="text-[14px] text-[#6b7280]">{t("no_restaurants_search")}</p>
                    </>
                  ) : (
                    <>
                      <h3 className="mb-1 text-lg font-bold text-[#1a1a2e]">
                        No {getCategoryPluralForm(selectedCategory, categories, "restaurants")} nearby yet
                      </h3>
                      <p className="mb-5 text-[14px] text-[#6b7280]">
                        We&apos;re growing fast. Be the first to list here.
                      </p>
                      <div className="flex flex-col items-center gap-2.5">
                        {selectedService && (
                          <button
                            onClick={() => handleCategorySelection(null)}
                            className="inline-flex items-center gap-2 rounded-full bg-[#1a1a2e] px-5 py-2.5 text-sm font-semibold text-white transition hover:shadow-lg"
                          >
                            View all restaurants <FiArrowRight />
                          </button>
                        )}
                        <Link
                          href="/partner-with-us"
                          className="inline-flex items-center gap-2 rounded-full border border-[#d0d5de] bg-white px-5 py-2.5 text-sm font-semibold text-[#6b7280] no-underline transition hover:border-[#b0b7c3] hover:text-[#1a1a2e]"
                        >
                          List your restaurant
                        </Link>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                restaurants.map((restaurant) => {
                  const imageSrc = resolveImageUrl(restaurant.image);
                  const distanceValue = parseOptionalNumber(restaurant.distance);
                  const distanceLabel = distanceValue !== null
                    ? formatDistanceByLocation(distanceValue, selectedLocation)
                    : null;
                  const etaMinutes = parseOptionalNumber(restaurant.etaMinutes);
                  const deliveryTime = etaMinutes ?? (distanceValue !== null ? calculateDeliveryTimeMinutes(distanceValue) : restaurant.deliveryTime || null);
                  const ratingValue = Number(restaurant.rating || 0);
                  const reviewCount = Number(restaurant.reviewCount || 0);
                  const productsCount = restaurant?._count?.products || 0;
                  const categoryLabel =
                    restaurant.categoryname || restaurant.cuisine || restaurant.category || "";
                  const fallbackImage = getRestaurantFallbackImage(restaurant);

                  return (
                    <article
                      key={restaurant.id}
                      onClick={() => handleViewMenu(restaurant)}
                      className="group cursor-pointer"
                    >
                      <div className="relative mb-3 overflow-hidden rounded-xl">
                        {imageSrc ? (
                          <img
                            src={imageSrc}
                            alt={restaurant.name}
                            onError={(event) => {
                              event.currentTarget.onerror = null;
                              event.currentTarget.src = fallbackImage;
                            }}
                            className="h-[200px] w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                          />
                        ) : (
                          <div className="flex h-[200px] items-center justify-center bg-[#f0f0ee] text-3xl text-[#c2b7a8]">
                            🍽️
                          </div>
                        )}

                        {(restaurant.promoBadges || []).length > 0 ? (
                          <span className="absolute left-3 top-3 rounded-md bg-[#ff385c] px-2 py-0.5 text-[11px] font-bold text-white shadow-sm">
                            {restaurant.promoBadges[0].label}
                          </span>
                        ) : isNewItem(restaurant.createdAt) ? (
                          <span className="absolute left-3 top-3 rounded-md bg-[#1a1a2e] px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white">
                            New
                          </span>
                        ) : null}

                        {deliveryTime ? (
                          <span className="absolute bottom-3 right-3 rounded-md bg-white/90 px-2 py-1 text-[11px] font-semibold text-[#1a1a2e] backdrop-blur-sm">
                            {typeof deliveryTime === "number" ? `${deliveryTime} min` : deliveryTime}
                          </span>
                        ) : null}
                      </div>

                      <h3 className="mb-0.5 truncate text-[15px] font-semibold text-[#1a1a2e]">
                        {restaurant.name}
                      </h3>
                      <p className="mb-0 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-[13px] text-[#6b7280]">
                        <span className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-0.5">
                          {ratingValue > 0 ? (
                            <span className="inline-flex items-center gap-1">
                              <FiStar className="shrink-0 fill-[#1a1a2e] text-[#1a1a2e]" size={12} />
                              <span className="font-medium text-[#1a1a2e]">{ratingValue.toFixed(1)}</span>
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
                          {distanceLabel ? <span>{distanceLabel}</span> : null}
                        </span>
                        {categoryLabel ? (
                          <span className="inline-flex shrink-0 items-center gap-1 truncate text-right font-medium text-[#1a1a2e]">
                            <FiTag className="shrink-0 opacity-70" size={12} />
                            {categoryLabel}
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
        onApply={handleLocationFilterApply}
        currentFilter={activeLocationFilter}
        contextLabel="restaurants nearby"
        submitLabel="See restaurants nearby"
      />
    </div>
  );
}
