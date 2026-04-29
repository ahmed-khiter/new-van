"use client";
import CustomIllustration from "@/components/CustomIllustration";
import ConfirmationDialog from "@/components/Modals/ConfirmationModal";
import { useRouter } from "@/i18n/routing";
import {
  getStatusBadge,
  formatAmountToCurrency,
  getJobDateBadge,
  formatDistanceToNow,
} from "@/utils/helper";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, useMemo } from "react";
import toast from "react-hot-toast";
import { FiClock } from "react-icons/fi";
import ServiceSelectionModal from "@/components/Modals/ServiceSelectionModal";
import FeedbackRating from "@/components/FeedbackRating";
import CheckoutModal from "@/components/Modals/CheckoutModal";
import JobCTA from "@/components/JobCTA";
import ServicesFilter from "@/components/ServicesFilter";
import ReservationComponent from "@/components/ReservationComponent";
import useServicesCatalog from "@/lib/hooks/useServicesCatalog";

export default function VisitorJobsPage() {
  // List of all reservation-related categories that should show ReservationComponent
  const RESERVATION_CATEGORIES = [
    "Book a Table",
    "MOT & Repairs",
    "Shisha lounges",
    "Spa",
    "Beauty",
    "Healthcare",
    "Events",
    "Entertainment"
  ];

  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("VisitorPages.jobs");
  const [isLoading, setIsLoading] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [activeTab, setActiveTab] = useState("open");
  const [apiMessage, setApiMessage] = useState(null);
  const [showAlert, setShowAlert] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(null);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [jobToDelete, setJobToDelete] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingJobId, setDeletingJobId] = useState(null);
  const [cancellingJobId, setCancellingJobId] = useState(null);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [checkoutJobData, setCheckoutJobData] = useState(null);
  const [selectedCategories, setSelectedCategories] = useState(["All"]);
  const [jobToCancel, setJobToCancel] = useState(null);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [renderKey, setRenderKey] = useState(0);
  const { servicesCatalog, serviceMap } = useServicesCatalog();

  // Helper to resolve job price, including fallback for Luggage Storage / Dry Cleaning Pick-Up
  const getJobDisplayPrice = useCallback((job) => {
    if (job.price != null && job.price !== undefined) return job.price;
    // Fallback: extract total from notes JSON for luggage/cleaning bookings
    if ((job.category === "Luggage Storage" || job.category === "Dry Cleaning Pick-Up") && job.notes) {
      try {
        const notesData = JSON.parse(job.notes);
        if (notesData.luggageItems && Array.isArray(notesData.luggageItems)) {
          const total = notesData.luggageItems.reduce(
            (sum, item) => sum + ((item.price || 0) * (item.quantity || 0)),
            0
          );
          if (total > 0) return total;
        }
      } catch (e) {
        // notes is not valid JSON, ignore
      }
    }
    return null;
  }, []);

  // Handle payment success/cancel messages
  useEffect(() => {
    const payment = searchParams.get("payment");
    const jobId = searchParams.get("jobId");

    if (payment === "success" && jobId) {
      toast.success(
        "Payment successful! Your job is now active and ready for providers."
      );
      // Clean up URL parameters
      const newUrl = new URL(window.location);
      newUrl.searchParams.delete("payment");
      newUrl.searchParams.delete("jobId");
      window.history.replaceState({}, "", newUrl.toString());
    } else if (payment === "cancelled" && jobId) {
      toast.error("Payment was cancelled. Your job is still in draft status.");
      // Clean up URL parameters
      const newUrl = new URL(window.location);
      newUrl.searchParams.delete("payment");
      newUrl.searchParams.delete("jobId");
      window.history.replaceState({}, "", newUrl.toString());
    }
  }, [searchParams]);

  // Handle tab parameter from URL
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab && ["all", "open", "completed", "cancelled", "draft"].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchJobs = useCallback(async (search = "") => {
    setIsLoading(true);
    try {
      let queryParams = [];

      if (search.trim()) {
        queryParams.push(`title=${encodeURIComponent(search.trim())}`);
      }

      const query = queryParams.length ? `?${queryParams.join("&")}` : "";
      const response = await fetch(`/api/jobs${query}`);
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
      setApiMessage(
        "An error occurred while fetching jobs. Please try again later."
      );
      setShowAlert(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs(debouncedSearch);
  }, [debouncedSearch, fetchJobs]);

  // Force re-render for Safari when dropoff data becomes available
  useEffect(() => {
    if (jobs.length > 0 && !isLoading) {
      // Check if any jobs have dropoff locations
      const hasDropoffData = jobs.some(job => {
        const servicesWithDropoff = ["shop", "restaurant", "supermarket", "Recovery", "Van", "Click & Collect", "Luggage Storage", "Dry Cleaning Pick-Up"];
        const hasDropoff = servicesWithDropoff.includes(job.category);
        const dropoffLocation = job.dropOffAddressLine1 || job.dropOffPostCode;
        return hasDropoff && dropoffLocation;
      });

      if (hasDropoffData) {
        // Use requestAnimationFrame with a small delay to ensure Safari processes the DOM update
        requestAnimationFrame(() => {
          setTimeout(() => {
            setRenderKey(prev => prev + 1);
          }, 0);
        });
      }
    }
  }, [jobs, isLoading]);

  // Filter jobs by status tab and category
  useEffect(() => {
    let filtered = jobs;

    // Filter by status tab
    if (activeTab !== "all") {
      if (activeTab === "open") {
        // Include active, open, and pending jobs under "In Progress"
        filtered = filtered.filter((job) =>
          job.status === "active" || job.status === "open" || job.status === "pending"
        );
      } else {
        filtered = filtered.filter((job) => job.status === activeTab);
      }
    }

    // Filter by category (ServicesFilter)
    if (!(selectedCategories.length === 1 && selectedCategories.includes("All"))) {
      const selectedCategory = selectedCategories[0];

      // Special handling for shop, restaurant, and reservation categories
      if (selectedCategory === "shop") {
        // Filter for shop orders: only jobs with category "shop" (exclude restaurant)
        filtered = filtered.filter((job) =>
          job.category === "shop"
        );
      } else if (selectedCategory === "restaurant") {
        // Filter for restaurant orders: only jobs with category "restaurant" (exclude shop)
        filtered = filtered.filter((job) =>
          job.category === "restaurant"
        );
      } else if (RESERVATION_CATEGORIES.includes(selectedCategory)) {
        // For all reservation categories, show reservations instead of jobs
        // This will be handled by showing the ReservationComponent component
        filtered = [];
      } else {
        // Standard category filtering
        filtered = filtered.filter((job) =>
          selectedCategories.includes(job.category)
        );
      }
    }

    setFilteredJobs(filtered);
  }, [jobs, activeTab, selectedCategories]);

  const handleViewJob = (job) => {
    router.push(`/customer/jobs/view/${job.id}`);
  };

  const handleReportIssue = (job) => {
    // TODO: Implement report issue functionality
    toast("Report issue feature coming soon");
  };

  const handleChat = (job) => {
    if (job?.status === "open" && job?.chatId) {
      router.push(`/customer/chats?chatId=${job.chatId}`);
    }
  };

  const handleTrackJob = (job) => {
    // If job is linked to a product order, navigate to order track page
    if (job.deliveryOrderId) {
      router.push(`/customer/orders/${job.deliveryOrderId}/track`);
      return;
    }

    // For regular service jobs - navigate to job tracking page
    // This works for both jobs with accepted providers and jobs still searching
    router.push(`/customer/jobs/${job.id}/track`);
  };

  const handleDeleteJob = (job) => {
    setJobToDelete(job);
    setIsDeleteModalOpen(true);
  };

  const handleCancelJob = (job) => {
    setJobToCancel(job);
    setIsCancelModalOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (!jobToCancel) return;
    setIsCancelModalOpen(false);
    setCancellingJobId(jobToCancel.id);
    try {
      const response = await fetch(`/api/jobs/${jobToCancel.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "cancelled",
        }),
      });

      if (response.ok) {
        setJobs((prevJobs) =>
          prevJobs.map((job) =>
            job.id === jobToCancel.id ? { ...job, status: "cancelled" } : job
          )
        );
        toast.success("Job cancelled successfully");
      } else {
        const { error } = await response.json();
        toast.error(error || "Failed to cancel job");
      }
    } catch (error) {
      console.error("Error cancelling job:", error);
      toast.error(error.message || "Failed to cancel job. Please try again.");
    } finally {
      setCancellingJobId(null);
      setJobToCancel(null);
    }
  };

  const handleCloseCancelModal = () => {
    setIsCancelModalOpen(false);
    setJobToCancel(null);
  };

  const handleConfirmDelete = async () => {
    if (!jobToDelete) return;
    setIsDeleteModalOpen(false);
    setDeletingJobId(jobToDelete.id);
    try {
      const response = await fetch(`/api/jobs/${jobToDelete.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        const result = await response.json();
        setJobs((prevJobs) =>
          prevJobs.filter((job) => job.id !== jobToDelete.id)
        );
        toast.success("Job deleted successfully");
      } else {
        const { error } = await response.json();
        toast.error(error || "Failed to delete job");
      }
    } catch (error) {
      console.error("Error deleting job:", error);
      toast.error(error.message || "Failed to delete job. Please try again.");
    } finally {
      setDeletingJobId(null);
      setJobToDelete(null);
    }
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setJobToDelete(null);
  };

  const handlePayment = async (job) => {
    setProcessingPayment(job.id);
    try {
      const response = await fetch("/api/jobs/payment-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ jobId: job.id }),
      });

      const data = await response.json();

      if (response.ok) {
        // Open checkout modal instead of redirecting
        setCheckoutJobData({
          jobId: job.id,
          job: job,
          amount: data.amount || job.price,
        });
        setShowCheckoutModal(true);
      } else {
        toast.error(data.error || "Failed to create payment session");
      }
    } catch (error) {
      console.error("Payment error:", error);
      toast.error("Failed to process payment");
    } finally {
      setProcessingPayment(null);
    }
  };

  const handleCategoryChange = (categoryValue) => {
    // Filter orders by category instead of navigating
    // Only allow one category to be selected at a time
    setSelectedCategories([categoryValue]);
  };

  const getCount = (status) => {
    let filtered = jobs;

    // Apply category filter first (same logic as in useEffect)
    if (!(selectedCategories.length === 1 && selectedCategories.includes("All"))) {
      const selectedCategory = selectedCategories[0];

      // Special handling for shop, restaurant, and reservation categories
      if (selectedCategory === "shop") {
        filtered = filtered.filter((job) =>
          job.deliveryOrderId &&
          (
            (job.notes && job.notes.toLowerCase().includes("products")) ||
            (job.title && job.title.toLowerCase().includes("product"))
          )
        );
      } else if (selectedCategory === "restaurant") {
        filtered = filtered.filter((job) =>
          job.deliveryOrderId &&
          (
            (job.notes && job.notes.toLowerCase().includes("menu items")) ||
            (job.title && job.title.toLowerCase().includes("restaurant"))
          )
        );
      } else if (RESERVATION_CATEGORIES.includes(selectedCategory)) {
        // For reservation categories, return 0 as they show reservations instead
        return 0;
      } else {
        // Standard category filtering
        filtered = filtered.filter((job) =>
          selectedCategories.includes(job.category)
        );
      }
    }

    // Then filter by status
    if (Array.isArray(status)) {
      return filtered.filter((j) => status.includes(j.status)).length;
    }
    if (status === "open") {
      // Count active, open, and pending jobs for "In Progress" tab
      return filtered.filter((j) =>
        j.status === "active" || j.status === "open" || j.status === "pending"
      ).length;
    }
    return filtered.filter((j) => j.status === status).length;
  };

  const getIllustrationMessage = () => {
    if (showAlert && apiMessage) {
      return apiMessage;
    }

    switch (activeTab) {
      case "all":
        return "No jobs found. Click 'Add Job' to create your first service request!";
      case "open":
        return "No jobs in progress found. This includes jobs that are searching for providers, pending provider acceptance, or currently being worked on.";
      case "completed":
        return "No completed jobs found. Completed jobs will appear here once providers finish your service requests.";
      case "cancelled":
        return "No cancelled jobs found. Cancelled jobs will appear here if any of your service requests are cancelled.";
      case "draft":
        return "No draft jobs found. Draft jobs are created but not yet paid. Click 'Pay Now' on any draft job to activate it.";
      default:
        return "No jobs found. Click 'Add Job' to create your first service request!";
    }
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
                key={`dropoff-${job.id}-${renderKey}`}
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
  }, [renderKey]);

  return (
    <>
      <div className="pagetitle mb-0">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <div>
            <h1>My Activity</h1>

          </div>
          {/* Add Job Button */}
          <button
            className="btn btn-primary d-flex align-items-center gap-2"
            onClick={() => router.push("/")}
          >
            <i className="bi bi-plus-circle"></i>
            Add Job
          </button>
        </div>
      </div>

      <ServicesFilter
        selectedService={selectedCategories}
        onServiceChange={handleCategoryChange}
        servicesCatalog={servicesCatalog}
        className="mb-2"
        scrollable={true}
        showSupermarket={false}
        showShopNow={false}
        showRestaurant={true}
        multiSelect={false}
        // excludeServices={["Luggage Storage", "Dry Cleaning Pick-Up"]}
        showAllOption={true}
      />

      {/* Show Reservations when any reservation category is selected */}
      {selectedCategories.some(cat => RESERVATION_CATEGORIES.includes(cat)) && (
        <ReservationComponent
          reservationType={selectedCategories.find(cat => RESERVATION_CATEGORIES.includes(cat)) || null}
        />
      )}

      {/* Only show search, tabs, and job cards when no reservation category is selected */}
      {!selectedCategories.some(cat => RESERVATION_CATEGORIES.includes(cat)) && (
        <>
          <div className="flex flex-col-reverse sm:flex-row items-center justify-between pt-[5px] pb-[10px] gap-2 flex-wrap">
            {/* Search Bar */}
            <div className="max-w-[700px] w-full">
              <input
                type="text"
                placeholder="Search jobs by title..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full border border-gray-300 !rounded-[10px] px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Status Tabs */}
          <div
            className="
    flex bg-white p-2 rounded-[10px] gap-2 mb-4 shadow-sm 
    overflow-x-auto lg:overflow-x-hidden 
    snap-x snap-mandatory 
    lg:justify-between 
    vistor_jobs_tabs
  "
          >

            <div
              className={`flex-shrink-0 min-w-[170px] lg:flex-1 snap-start 
      text-center py-2 rounded-[8px] font-medium cursor-pointer 
      transition-all duration-200 text-sm lg:text-base ${activeTab === "open"
                  ? "bg-green-500 text-white shadow-md"
                  : "bg-gray-100 text-gray-700 hover:bg-blue-100"
                }`}
              onClick={() => setActiveTab("open")}
            >
              In Progress ({getCount("open")})
            </div>

            <div
              className={`flex-shrink-0 min-w-[170px] lg:flex-1 snap-start 
      text-center py-2 rounded-[8px] font-medium cursor-pointer 
      transition-all duration-200 text-sm lg:text-base ${activeTab === "completed"
                  ? "bg-blue-500 text-white shadow-md"
                  : "bg-gray-100 text-gray-700 hover:bg-blue-100"
                }`}
              onClick={() => setActiveTab("completed")}
            >
              Completed ({getCount("completed")})
            </div>

            <div
              className={`flex-shrink-0 min-w-[170px] lg:flex-1 snap-start 
      text-center py-2 rounded-[8px] font-medium cursor-pointer 
      transition-all duration-200 text-sm lg:text-base ${activeTab === "cancelled"
                  ? "bg-red-500 text-white shadow-md"
                  : "bg-gray-100 text-gray-700 hover:bg-red-100"
                }`}
              onClick={() => setActiveTab("cancelled")}
            >
              Cancelled ({getCount("cancelled")})
            </div>

            <div
              className={`flex-shrink-0 min-w-[170px] lg:flex-1 snap-start 
      text-center py-2 rounded-[8px] font-medium cursor-pointer 
      transition-all duration-200 text-sm lg:text-base ${activeTab === "draft"
                  ? "bg-orange-500 text-white shadow-md"
                  : "bg-gray-100 text-gray-700 hover:bg-orange-100"
                }`}
              onClick={() => setActiveTab("draft")}
            >
              Draft ({getCount("draft")})
            </div>
          </div>

          {/* Job Cards */}
          {isLoading ? (
            <div className="text-center mt-4">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : filteredJobs.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredJobs.map((job, index) => {
                return (
                  <div
                    key={index}
                    className="bg-white rounded-xl shadow-md !p-4 w-full"
                  >
                    <div className="d-flex justify-content-between align-items-start">
                      <h4
                        className="font-semibold text-[20px] line-clamp-2 cursor-pointer max-w-[90%]"
                        onClick={() => handleTrackJob(job)}
                      >
                        {/* {job.title} */}
                        {/* Pickup and Dropoff Information */}
                        {renderPickupDropoffInfo(job)}
                      </h4>
                      <div className="">
                        <JobCTA
                          job={job}
                          // onViewClick={() => handleViewJob(job)}
                          onReportClick={() => handleReportIssue(job)}
                          onPayClick={() => handlePayment(job)}
                          onTrackClick={() => handleTrackJob(job)}
                          onDeleteClick={() => handleDeleteJob(job)}
                          onChatClick={() => handleChat(job)}
                          onCancelClick={() => handleCancelJob(job)}
                          enableView={true}
                          enableReport={true}
                          enablePay={job.status === "draft"}
                          enableTrack={
                            job.deliveryOrderId || // Show track for jobs with delivery orders (any status)
                            job.status === "active" ||
                            job.status === "open" ||
                            job.status === "pending"
                          }
                          enableDelete={job.status === "draft"}
                          enableChat={job?.status === "open" && job?.chatId}
                          enableComplete={false}
                          enableCancel={
                            job.status === "active" ||
                            job.status === "open" ||
                            job.status === "pending"
                          }
                          isDisabled={
                            deletingJobId === job.id ||
                            processingPayment === job.id ||
                            cancellingJobId === job.id
                          }
                          isPaying={processingPayment === job.id}
                          isDeleting={deletingJobId === job.id}
                          isCancelling={cancellingJobId === job.id}
                          chatLabel="Message provider"
                        />
                      </div>
                    </div>
                    <div
                      className="cursor-pointer"
                    >
                      <div className="my-3"
                      >
                        {(() => {
                          const service = serviceMap[job.category];
                          const serviceName = service?.name || job.category;
                          const serviceImg = service?.images?.list_service_img;
                          return (
                        <div className="flex items-center gap-2 text-gray-500 text-[16px] mb-2 fw-bold">
                          {serviceImg ? (
                            <img
                              src={serviceImg}
                              alt={serviceName}
                              className="w-4 h-4 rounded-full object-cover"
                            />
                          ) : (
                            <i className="bi bi-grid-3x3-gap-fill text-[14px]" />
                          )}
                          {serviceName}
                        </div>
                          );
                        })()}

                        <span className="flex items-center text-xs font-medium text-gray-500 mb-2 justify-between">
                          <span className="flex items-center">
                            <FiClock className="mr-2" size={15} color="grey" />
                            {formatDistanceToNow(job.createdAt)}, {new Date(job.createdAt).toLocaleDateString('en-GB', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric'
                            })}
                          </span>
                          <span className="flex flex-col gap-2">
   
                            {job.category === "Luggage Storage" &&
                              job.deliveryMethod && (
                                <span className="inline-flex items-center ml-2 bg-blue-50 text-blue-700 rounded-md text-xs font-medium px-3 py-1">
                                  {job.deliveryMethod === "dropoff"
                                    ? "Drop Off"
                                    : job.deliveryMethod === "collection"
                                      ? "Home Collection"
                                      : job.deliveryMethod}
                                </span>
                              )}
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
                          </span>
                        </span>



                        {/* Feedback Rating for Completed Jobs */}
                        {job.status === "completed" && (
                          <div className="mt-2">
                            <FeedbackRating
                              rating={
                                typeof job.rating === "number" ? job.rating : null
                              }
                              size="sm"
                              className="justify-start"
                              showAverage={false}
                              showCount={false}
                            />
                          </div>
                        )}
                      </div>
                      <div className="pt-3 border-top d-flex align-items-center justify-content-between">
                        <p className="text-gray-700 font-bold  mb-0">
                          Price:{" "}
                          {(() => {
                            const displayPrice = getJobDisplayPrice(job);
                            return displayPrice != null
                              ? formatAmountToCurrency(displayPrice)
                              : "N/A";
                          })()}
                        </p>
                        <span className="flex items-center gap-2">
                          {/* Delivery Method for Luggage Bookings */}

                          {(job.status === "active" || job.status === "open" || (job.status === "completed" && job.deliveryOrderId)) && (
                            <button
                              onClick={() => handleTrackJob(job)}
                              className="inline-flex items-center rounded-md text-xs font-medium px-3 py-1 !border !border-[#3B82F6] !text-[#0D6EFD] bg-blue-200 capitalize text-center"
                            >
                              Track
                            </button>
                          )}
                          {getStatusBadge(job.status)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="w-100">
              <CustomIllustration
                page="jobs"
                illustrationHelperText={getIllustrationMessage()}
              />
            </div>
          )}
        </>
      )}

      <ServiceSelectionModal
        isOpen={showServiceModal}
        onClose={() => setShowServiceModal(false)}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationDialog
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        handleConfirm={handleConfirmDelete}
        alertMessage={"Are you sure you want to delete this job?"}
      />

      {/* Cancel Confirmation Modal */}
      <ConfirmationDialog
        isOpen={isCancelModalOpen}
        onClose={handleCloseCancelModal}
        handleConfirm={handleConfirmCancel}
        alertMessage={"Are you sure you want to cancel this job?"}
      />

      {/* Checkout Modal */}
      {showCheckoutModal && checkoutJobData && (
        <CheckoutModal
          isOpen={showCheckoutModal}
          onClose={() => {
            setShowCheckoutModal(false);
            setCheckoutJobData(null);
          }}
          type="job"
          data={checkoutJobData}
        />
      )}

    </>
  );
}
