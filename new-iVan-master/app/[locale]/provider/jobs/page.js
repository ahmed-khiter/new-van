"use client";
import { formatAmountToCurrency, getServiceName, getServiceIconPath, getJobDateBadge, formatDistanceToNow } from "@/utils/helper";
import { useRouter } from "@/i18n/routing";
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { FiClock, FiGrid, FiMap } from "react-icons/fi";
import CustomIllustration from "@/components/CustomIllustration";
import { useTranslations } from "next-intl";
import ServicesFilter from "@/components/ServicesFilter";
import FeedbackRating from "@/components/FeedbackRating";
import JobsMapView from "@/components/JobsMapView";
import { AppContext } from "@/lib/contexts/context";

export default function Page() {
    const router = useRouter();
    const { subscription } = useContext(AppContext);
    const isActiveSubscription = subscription && subscription.status === "active";
    const t = useTranslations("ProviderPages.jobs");
    const [isLoading, setIsLoading] = useState(false);
    const [jobs, setJobs] = useState([]);
    const [selectedCategories, setSelectedCategories] = useState(["All"]);
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [apiMessage, setApiMessage] = useState(null);
    const [showAlert, setShowAlert] = useState(false);
    const [viewMode, setViewMode] = useState("card"); // "card" or "map"

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const fetchJobs = useCallback(async (filters = [], search = "") => {
        setIsLoading(true);
        try {
            let queryParams = [];

            if (!(filters.length === 1 && filters.includes("All"))) {
                queryParams.push(`categories=${filters.map(f => encodeURIComponent(f)).join(",")}`);
            }
            if (search.trim()) {
                queryParams.push(`title=${encodeURIComponent(search.trim())}`);
            }

            // Add max distance parameter (in kilometers)
            queryParams.push(`maxDistance=50`); // Default 50 miles radius

            const query = queryParams.length ? `?${queryParams.join("&")}` : "";
            const response = await fetch(`/api/jobs/nearby${query}`);
            const data = await response.json();

            if (data.message) {
                setApiMessage(data.message);
                setShowAlert(true);
            } else {
                setShowAlert(false);
            }

            setJobs(Array.isArray(data.jobs) ? data.jobs : []);
        } catch (error) {
            console.error("Error fetching jobs:", error);
            setApiMessage("An error occurred while fetching jobs. Please try again later.");
            setShowAlert(true);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (isActiveSubscription) {
            fetchJobs(selectedCategories, debouncedSearch);
        }
    }, [selectedCategories, debouncedSearch, fetchJobs, isActiveSubscription]);

    const handleCategoryChange = (categoryValue) => {
        // Only allow one category to be selected at a time
        setSelectedCategories([categoryValue]);
    };

    const clearFilters = () => {
        if (selectedCategories.length === 1 && selectedCategories.includes("All") && !searchTerm) return;
        setSelectedCategories(["All"]);
        setSearchTerm("");
    };

    const handleEditJob = (job) => {
        router.push(`/provider/jobs/${job.id}`);
    };

    const renderPickupDropoffInfo = useMemo(() => {
        return (job) => {
          const servicesWithDropoff = ["shop", "restaurant", "supermarket", "Recovery", "Van", "Click & Collect", "Luggage Storage", "Dry Cleaning Pick-Up"];
          const servicesWithPickupOnly = ["Locksmith", "Car Key Replacement", "Removals", "Cleaning"];
          const servicesWithLocationLabel = ["Locksmith", "Car Key Replacement", "Removals", "Cleaning"];
    
          const hasDropoff = servicesWithDropoff.includes(job.category);
          const hasPickupOnly = servicesWithPickupOnly.includes(job.category);
          const useLocationLabel = servicesWithLocationLabel.includes(job.category);
    
          // Get pickup location: postcode first, then street name
          const pickupLocation = job.pickupPostCode 
            ? `${job.pickupPostCode}${job.pickupAddressLine1 ? `, ${job.pickupAddressLine1}` : ''}`
            : job.pickupAddressLine1;
    
          // Get dropoff location: postcode first, then street name
          const dropoffLocation = job.dropOffPostCode 
            ? `${job.dropOffPostCode}${job.dropOffAddressLine1 ? `, ${job.dropOffAddressLine1}` : ''}`
            : job.dropOffAddressLine1;
    
          if ((hasDropoff || hasPickupOnly) && pickupLocation) {
            // Explicitly check for dropoff to ensure Safari renders it properly
            const shouldShowDropoff = Boolean(hasDropoff && dropoffLocation);
            
            return (
              <div className="mt-1 sm:mt-2 mb-1 sm:mb-2 space-y-0.5 sm:space-y-1">
                <div
                  className="text-sm sm:text-base font-semibold text-gray-900  min-w-0  flex items-center gap-1.5"
                  title={pickupLocation ? `${useLocationLabel ? 'Location' : 'Pick-up'}: ${pickupLocation}` : undefined}
                >
                  <p className="font-normal max-w-[280px] sm:max-w-[350px] mb-0 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-left" style={{ direction: 'ltr' }}>📍 {useLocationLabel ? 'Location' : 'Pick-up'}: {pickupLocation}</p>
                </div>
                {shouldShowDropoff && (
                  <div
                    key={`dropoff-${job.id}`}
                    className="text-sm sm:text-base font-semibold text-gray-900 min-w-0  flex items-center gap-1.5"
                    title={dropoffLocation ? `Drop-off: ${dropoffLocation}` : undefined}
                  >
                    <p className="font-normal max-w-[280px] sm:max-w-[350px] mb-0 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-left" style={{ direction: 'ltr' }}>
                    🏁 Drop-off: {dropoffLocation}
                    </p>
                  </div>
                )}
                {hasDropoff && job.howManyItems && (
                  <div className="text-sm sm:text-base font-bold text-gray-900">
                    {job.howManyItems} {job.howManyItems === 1 ? 'item' : 'items'} to pick up
                  </div>
                )}
              </div>
            );
          }
          return null;
        };
      }, []);

    return (
        <>
            {/* Search Bar */}
            <div className="mb-4">
                <input
                    type="text"
                    placeholder={t("search_placeholder")}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full border border-gray-300 !rounded-[25px] px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>

            {/* Filter Tabs */}
            <div className="mb-4">
                <ServicesFilter
                    selectedService={selectedCategories}
                    onServiceChange={handleCategoryChange}
                    className="mb-4"
                    scrollable={true}
                    showSupermarket={false}
                    showShopNow={false}
                    showRestaurant={false}
                    multiSelect={false}
                    showAllOption={true}
                    excludeServices={["Luggage Storage", "Dry Cleaning Pick-Up", "shop", "restaurant", "supermarket", "Book a Table", "MOT & Repairs", "Shisha lounges", "Spa", "Beauty", "Healthcare", "Events", "Entertainment", "Taxi Rides",]}
                />
            </div>

            {/* Count + View Toggle */}
            <div className="flex justify-between items-center mb-4">
                <h2 className="font-bold text-lg">
                    {t("count_label", { count: jobs.length })}
                </h2>
                <div className="flex items-center gap-3">
                    {/* View Toggle */}
                    <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                        <button
                            onClick={() => setViewMode("card")}
                            className={`flex items-center justify-center px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                                viewMode === "card"
                                    ? "bg-white text-blue-600 shadow-sm"
                                    : "text-gray-600 hover:text-gray-900"
                            }`}
                            title="Card View"
                        >
                            <FiGrid size={16} />
                        </button>
                        <button
                            onClick={() => setViewMode("map")}
                            className={`flex items-center justify-center px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                                viewMode === "map"
                                    ? "bg-white text-blue-600 shadow-sm"
                                    : "text-gray-600 hover:text-gray-900"
                            }`}
                            title="Map View"
                        >
                            <FiMap size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Job Cards or Map View */}
            {isLoading ? (
                <div className="text-center mt-4">
                    <div className="spinner-border" role="status">
                        <span className="visually-hidden">{t("loading")}</span>
                    </div>
                </div>
            ) : jobs.length > 0 ? (
                viewMode === "map" ? (
                    <JobsMapView jobs={jobs} onJobClick={handleEditJob} />
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {jobs.map((job, index) => {
                            return (
                                <div
                                    key={index}
                                    className="bg-white rounded-xl shadow-md p-4 w-full"
                                >
                                    {/* <h4 className="font-semibold text-[20px] line-clamp-2">{job.title}</h4> */}
                                    {/* Pickup and Dropoff Information */}
                                    {renderPickupDropoffInfo(job)}
                                    <div className="flex items-center gap-2 text-gray-500 text-[16px]">
                                        <img
                                            src={getServiceIconPath(job.category)}
                                            alt={getServiceName(job.category)}
                                            className="w-4 h-4 object-contain"
                                        />
                                        {getServiceName(job.category)}
                                    </div>
                                    <span className="flex items-center text-xs font-medium text-gray-500">
                                        <FiClock className="mr-2" size={15} color="grey" />
                                        {formatDistanceToNow(job.createdAt)}
                                    </span>
                                    <p className="text-gray-700 font-bold mt-2 mb-0">
                                        {t("price_label", { amount: job.price ? formatAmountToCurrency(job.price) : "N/A" })}
                                    </p>
                                    <p className="text-gray-500 text-sm mb-0">
                                        {t("from_label", { city: job.pickupCity || "N/A" })}
                                    </p>
                                    {(() => {
                                        const badge = getJobDateBadge(job.pickupDate);
                                        return badge ? (
                                            <span className={`inline-flex items-center rounded-md text-xs font-bold px-3 py-1 uppercase shadow-sm ${
                                                badge.type === 'today' ? "bg-red-500 text-white" : "bg-blue-500 text-white"
                                            }`}>
                                                {badge.label}
                                            </span>
                                        ) : null;
                                    })()}
                                    {/* Rating for completed jobs */}
                                    {job.status === "completed" && (
                                        <div className="mt-2">
                                            <FeedbackRating 
                                                rating={typeof job.rating === 'number' ? job.rating : null}
                                                size="sm"
                                                className="justify-start"
                                                showAverage={false}
                                                showCount={false}
                                            />
                                        </div>
                                    )}

                                    <div className="flex gap-2 mt-3">
                                        <button
                                            className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
                                            onClick={() => handleEditJob(job)}
                                        >
                                            {t("view_book")}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )
            ) : (
                <div className="w-full">
                    <CustomIllustration
                        page="jobs"
                        illustrationHelperText={apiMessage ? apiMessage : t("empty")}
                     {...(!isActiveSubscription && { subscriptionMessage: t("subscription_required") })}
                     {...(!isActiveSubscription && { buttonText: t("upgrade_plan") })}
                     {...(!isActiveSubscription && { onClick: () => router.push("/provider/pricing") })}
                    />
                </div>
            )}
        </>
    );
}

