"use client";
import { CategoryIcon, getRequiredDocumentByCategory, formatAmountToCurrency, getServiceName, formatDistanceByLocation, getJobDateBadge, formatDistanceToNow } from "@/utils/helper";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FiClock } from "react-icons/fi";
import CustomIllustration from "@/components/CustomIllustration";
import toast from "react-hot-toast";
import ConfirmationDialog from "@/components/Modals/ConfirmationModal";
import JobCompletionModal from "@/components/Modals/JobCompletionModal";
import ChatIcon from "@/components/ChatIcon";
import FeedbackRating from "@/components/FeedbackRating";
import JobCTA from "@/components/JobCTA";
import { useTranslations } from "next-intl";
import { useDeliveryNotifications } from "@/lib/hooks/useSocket";
import { useSession } from "next-auth/react";
import useSavedLocation from "@/lib/hooks/useSavedLocation";
import ServicesFilter from "@/components/ServicesFilter";
export default function Page() {
  const t = useTranslations("ProviderPages.dashboard");
  const router = useRouter();
  const { savedLocation } = useSavedLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [activeTab, setActiveTab] = useState("inprogress");
  const [selectedCategories, setSelectedCategories] = useState(["All"]);
  const [isOpenConfirmation, setIsOpenConfirmation] = useState(false)
  const [jobId, setJobId] = useState(null)
  const [showJobCompletionModal, setShowJobCompletionModal] = useState(false);
  const [completingJobs, setCompletingJobs] = useState({});
  const [cancellingJobs, setCancellingJobs] = useState({});
  
  // Delivery notifications
  const { data: session } = useSession();
  const [providerId, setProviderId] = useState(null);
  const [providerLocation, setProviderLocation] = useState(null);
  const [showDeliveryNotifications, setShowDeliveryNotifications] = useState(true);
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [jobToAccept, setJobToAccept] = useState(null);
  const [jobToDecline, setJobToDecline] = useState(null);
  const [isAccepting, setIsAccepting] = useState(false);
  const [isDeclining, setIsDeclining] = useState(false);
  const [updatingDeliveryStatus, setUpdatingDeliveryStatus] = useState({});
  const [updatingJobStatus, setUpdatingJobStatus] = useState({});
  const [providerServices, setProviderServices] = useState(null); // null = loading, [] = no services
  
  const {
    availableJobs: deliveryJobs,
    isConnected: socketConnected,
    removeJob
  } = useDeliveryNotifications(providerId, providerLocation);

  const fetchJobs = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/provider-dashboard`);
      const data = await response.json();
      setJobs(data?.jobs || []);
    } catch (error) {
      console.error("Error fetching jobs:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
  }, []);

  // Fetch provider profile for delivery notifications
  useEffect(() => {
    const fetchProviderProfile = async () => {
      try {
        const response = await fetch("/api/profile");
        if (response.ok) {
          const data = await response.json();
          if (data.profile) {
            setProviderId(data.profile.id);
            if (data.profile.latitude && data.profile.longitude) {
              setProviderLocation({
                lat: parseFloat(data.profile.latitude),
                lng: parseFloat(data.profile.longitude)
              });
            }
            // Capture provider's approved services for subscription check
            const services = data.profile?.settings?.services || [];
            const approvedServices = services
              .filter((s) => s.status === "Approved")
              .map((s) => s.name);
            setProviderServices(approvedServices);
          }
        }
      } catch (error) {
        console.error("Error fetching provider profile:", error);
      }
    };

    if (session?.status === "authenticated") {
      fetchProviderProfile();
    }
  }, [session]);

  // Request location permission
  const requestLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setProviderLocation(location);
          updateProviderLocation(location);
          toast.success("Location updated");
        },
        (error) => {
          console.error("Error getting location:", error);
          toast.error("Failed to get location");
        }
      );
    } else {
      toast.error("Geolocation is not supported by your browser");
    }
  };

  const updateProviderLocation = async (location) => {
    try {
      await fetch("/api/providers/location", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          latitude: location.lat,
          longitude: location.lng
        })
      });
    } catch (error) {
      console.error("Error updating location:", error);
    }
  };

  const handleAcceptDeliveryJob = async () => {
    if (!jobToAccept) return;

    setShowAcceptModal(false);
    setIsAccepting(true);

    try {
      const response = await fetch("/api/jobs/accept", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: jobToAccept.jobId })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success(data.message || "Delivery job accepted successfully!");
        removeJob(jobToAccept.jobId);
        setJobToAccept(null);
        fetchJobs(); // Refresh jobs list
      } else {
        toast.error(data.message || "Failed to accept delivery job");
      }
    } catch (error) {
      console.error("Error accepting delivery job:", error);
      toast.error("An error occurred while accepting the job");
    } finally {
      setIsAccepting(false);
    }
  };

  const handleDeclineDeliveryJob = async () => {
    if (!jobToDecline) return;

    setShowDeclineModal(false);
    setIsDeclining(true);

    try {
      const response = await fetch(`/api/jobs/${jobToDecline.jobId}/decline`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reason: "Declined by provider"
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success("Delivery job declined");
        removeJob(jobToDecline.jobId);
        setJobToDecline(null);
      } else {
        toast.error(data.message || "Failed to decline delivery job");
      }
    } catch (error) {
      console.error("Error declining delivery job:", error);
      toast.error("An error occurred while declining the job");
    } finally {
      setIsDeclining(false);
    }
  };

  const formatDistance = (distance) => {
    if (!distance) return "N/A";
    return formatDistanceByLocation(distance, savedLocation);
  };

  const handleEditJob = (job) => {
    router.push(`/provider/jobs/${job.id}`);
  };

  const handleTrackJob = (job) => {
    router.push(`/provider/jobs/${job.id}/track`);
  };


  const handleCloseConfirmation = () => {
    setIsOpenConfirmation(false);
    setJobId(null);
  };

  // Complete button click
  const handleCompleteJob = async (job) => {
    const requiredDocs = getRequiredDocumentByCategory(job.category);
    if (requiredDocs.length > 0) {
      setJobId(job?.id);
      setShowJobCompletionModal(true);
    } else {
      setCompletingJobs(prev => ({ ...prev, [job.id]: true }));
      try {
        const res = await fetch(`/api/jobs/${job.id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify( {status: "completed" }),
        });

        if (res.ok) {
          toast.success(t("toast_complete_success"));
          setJobs(prevJobs =>
            prevJobs.map(j => (j.id === job.id ? { ...j, status: "completed" } : j))
          );
        } else {
          const data = await res.json();
          toast.error(data.error || t("toast_complete_failed"));
        }
      } catch (err) {
        console.error(err);
        toast.error(t("toast_complete_generic"));
      } finally {
        setCompletingJobs(prev => ({ ...prev, [job.id]: false }));
      }
    }
  };

  // Cancel button click
  const handleCancelJob = (job) => {
    setIsOpenConfirmation(true);
    setJobId(job.id);
  };

  const handleConfirmCancel = async () => {
    setIsOpenConfirmation(false);
    setCancellingJobs(prev => ({ ...prev, [jobId]: true }));
    try {
      const response = await fetch(`/api/jobs/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: jobId }),
      });

      if (response.ok) {
        setJobs(prevJobs =>
          prevJobs.map(j => (j.id === jobId ? { ...j, status: "cancelled" } : j))
        );
        toast.success(t("toast_cancel_success"));
      } else {
        const { error } = await response.json();
        toast.error(error || t("toast_cancel_failed"));
      }
    } catch (error) {
      toast.error(error.message || t("toast_cancel_error"));
    } finally {
      setCancellingJobs(prev => ({ ...prev, [jobId]: false }));
    }
  };

  // Chat handler
  const handleChat = (job) => {
    const role = session?.user?.role;
    let chatPath = '/customer/chats'; // default fallback
    
    if (role === 'admin') {
      chatPath = '/admin-chats';
    } else if (role === 'provider') {
      chatPath = '/provider/chats';
    } else if (role === 'visitor') {
      chatPath = '/customer/chats';
    }
    
    if (job?.chatId) {
      router.push(`${chatPath}?chatId=${job.chatId}`);
    } else {
      toast.error("Chat not available for this job");
    }
  };

  // Report handler
  const handleReport = (job) => {
    // TODO: Implement report functionality
    toast("Report functionality coming soon");
    console.log("Report job:", job);
  };

  // Update delivery status handler
  const handleDeliveryStatusChange = async (orderId, newStatus) => {
    setUpdatingDeliveryStatus(prev => ({ ...prev, [orderId]: true }));
    try {
      const response = await fetch(`/api/orders/${orderId}/delivery-status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'user-id': session?.user?.id,
          'role': 'provider'
        },
        body: JSON.stringify({
          status: newStatus
        })
      });

      const data = await response.json();
      if (response.ok) {
        const statusMessages = {
          'in-transit': 'Order picked up! Out for delivery.',
          'delivered': 'Order delivered successfully!'
        };
        toast.success(statusMessages[newStatus] || 'Status updated successfully');
        fetchJobs(); // Refresh jobs list
      } else {
        toast.error(data.message || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error updating delivery status:', error);
      toast.error('An error occurred while updating status');
    } finally {
      setUpdatingDeliveryStatus(prev => ({ ...prev, [orderId]: false }));
    }
  };

  // Update job status handler for regular service jobs
  const handleJobStatusChange = async (jobId, newStatus) => {
    setUpdatingJobStatus(prev => ({ ...prev, [jobId]: true }));
    try {
      const response = await fetch(`/api/jobs/${jobId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'user-id': session?.user?.id
        },
        body: JSON.stringify({
          status: newStatus
        })
      });

      const data = await response.json();
      if (response.ok) {
        toast.success('Job status updated successfully');
        fetchJobs(); // Refresh jobs list
      } else {
        toast.error(data.error || 'Failed to update job status');
      }
    } catch (error) {
      console.error('Error updating job status:', error);
      toast.error('An error occurred while updating job status');
    } finally {
      setUpdatingJobStatus(prev => ({ ...prev, [jobId]: false }));
    }
  };

  // Helper: All delivery status options for dropdown
  const getDeliveryStatusOptions = () => [
    { value: 'pending', label: 'Pending' },
    { value: 'dispatched', label: 'Dispatched' },
    { value: 'in-transit', label: 'In Transit' },
    { value: 'delivered', label: 'Delivered' },
  ];

  // Helper: All job status options for dropdown
  const getJobStatusOptions = () => [
    { value: 'open', label: 'On the way' },
    { value: 'pending', label: 'Pending' },
    { value: 'inprogress', label: 'In process' },
    { value: 'completed', label: 'Job completed' },
  ];

  const handleCategoryChange = (categoryValue) => {
    // Only allow one category to be selected at a time
    setSelectedCategories([categoryValue]);
  };

  // Check if the provider is NOT subscribed to the currently selected service
  const isNotSubscribedToSelectedService = useMemo(() => {
    if (!providerServices) return false; // Still loading profile
    if (selectedCategories.includes("All")) return false; // "All" doesn't require a subscription check
    const selectedCategory = selectedCategories[0];
    return selectedCategory && !providerServices.includes(selectedCategory);
  }, [providerServices, selectedCategories]);

  const filteredJobs = jobs?.filter((job) => {
    // Filter by status (tab)
    let statusMatch = false;
    switch (activeTab) {
      case "inprogress":
        // Include regular job statuses OR delivery statuses that are in progress
        statusMatch = job.status === "open" || 
                     job.status === "pending" || 
                     job.status === "inprogress" ||
                     (job.deliveryOrder && (
                       job.deliveryOrder.deliveryStatus === "dispatched" ||
                       job.deliveryOrder.deliveryStatus === "in-transit"
                     ));
        break;
      case "completed":
        // Include completed job status OR delivered delivery status
        statusMatch = job.status === "completed" ||
                     (job.deliveryOrder && job.deliveryOrder.deliveryStatus === "delivered");
        break;
      case "cancelled":
        statusMatch = job.status === "cancelled";
        break;
      default:
        statusMatch = true;
    }

    // Filter by category (ServicesFilter)
    const categoryMatch = selectedCategories.includes("All") || 
      selectedCategories.includes(job.category);

    return statusMatch && categoryMatch;
  });

  const getCount = (status) => {
    // Helper to check category match
    const matchesCategory = (job) => 
      selectedCategories.includes("All") || selectedCategories.includes(job.category);

    if (Array.isArray(status)) {
      return jobs?.filter((j) => {
        // First check category filter
        if (!matchesCategory(j)) return false;
        
        // Check regular job status
        const regularStatusMatch = status.includes(j.status);
        // For inprogress tab, also count delivery statuses
        if (status.includes("open") || status.includes("pending")) {
          const deliveryStatusMatch = j.deliveryOrder && (
            j.deliveryOrder.deliveryStatus === "dispatched" ||
            j.deliveryOrder.deliveryStatus === "in-transit"
          );
          return regularStatusMatch || deliveryStatusMatch;
        }
        return regularStatusMatch;
      }).length || 0;
    }
    // For completed status, also count delivered delivery status
    if (status === "completed") {
      return jobs?.filter((j) => 
        matchesCategory(j) && (
          j.status === status || 
          (j.deliveryOrder && j.deliveryOrder.deliveryStatus === "delivered")
        )
      ).length || 0;
    }
    return jobs?.filter((j) => matchesCategory(j) && j.status === status).length || 0;
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
              className="text-sm sm:text-base font-semibold text-gray-900 min-w-0 flex items-center gap-2"
              title={pickupLocation ? `${useLocationLabel ? 'Location' : 'Pick-up'}: ${pickupLocation}` : undefined}
            >
              <span className="w-6 flex-shrink-0 text-left" aria-hidden>📍</span>
              <p className="font-normal max-w-[280px] sm:max-w-[350px] mb-0 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-left" style={{ direction: 'ltr' }}>{useLocationLabel ? 'Location' : 'Pick-up'}: {pickupLocation}</p>
            </div>
            {shouldShowDropoff && (
              <div
                key={`dropoff-${job.id}`}
                className="text-sm sm:text-base font-semibold text-gray-900 min-w-0 flex items-center gap-2"
                title={dropoffLocation ? `Drop-off: ${dropoffLocation}` : undefined}
              >
                <span className="w-6 flex-shrink-0 text-left" aria-hidden>🏁</span>
                <p className="font-normal max-w-[280px] sm:max-w-[350px] mb-0 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-left" style={{ direction: 'ltr' }}>Drop-off: {dropoffLocation}</p>
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
      <div className="w-full">
        {/* Delivery Job Notifications */}
        {deliveryJobs && deliveryJobs.length > 0 && showDeliveryNotifications && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 shadow-sm">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div className="d-flex align-items-center gap-2">
                <i className="bi bi-bell-fill text-primary fs-5"></i>
                <h5 className="mb-0 fw-bold">
                  New Delivery Jobs Available
                  <span className="badge bg-primary ms-2">{deliveryJobs.length}</span>
                </h5>
              </div>
              <button
                className="btn btn-sm btn-link text-muted p-0"
                onClick={() => setShowDeliveryNotifications(false)}
                title="Hide notifications"
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
            
            {!providerLocation && (
              <div className="alert alert-info d-flex align-items-center justify-content-between mb-3" role="alert">
                <span>
                  <span className="me-2">📍</span>
                  Enable location to see distance to delivery jobs
                </span>
                <button className="btn btn-sm btn-primary" onClick={requestLocation}>
                  Enable Location
                </button>
              </div>
            )}

            {socketConnected ? (
              <div className="text-success small mb-2">
                <i className="bi bi-wifi me-1"></i>
                Real-time notifications active
              </div>
            ) : (
              <div className="text-warning small mb-2">
                <i className="bi bi-wifi-off me-1"></i>
                Real-time notifications offline
              </div>
            )}

            <div className="row g-3">
              {deliveryJobs.slice(0, 3).map((job) => (
                <div key={job.jobId} className="col-md-4">
                  <div className="card border-primary h-100">
                    <div className="card-body">
                      <h6 className="card-title fw-bold">{job.title}</h6>
                      <div className="mb-2">
                        <small className="text-muted">Category:</small>
                        <span className="badge bg-secondary ms-2">{job.category}</span>
                      </div>
                      {job.distance && (
                        <div className="mb-2">
                          <span className="me-1">📍</span>
                          <strong>{formatDistance(job.distance)}</strong> away
                        </div>
                      )}
                      <div className="mb-2 small">
                        <div><strong>Pickup:</strong> {job.pickupAddress}, {job.pickupCity}</div>
                        <div><strong>Drop-off:</strong> {job.dropOffAddress}, {job.dropOffCity}</div>
                      </div>
                      {job.price && (
                        <div className="mb-2">
                          <strong className="text-success fs-5">
                            {formatAmountToCurrency(job.price)}
                          </strong>
                        </div>
                      )}
                      <div className="d-flex gap-2 mt-2">
                        <button
                          className="btn btn-sm btn-success flex-fill"
                          onClick={() => {
                            setJobToAccept(job);
                            setShowAcceptModal(true);
                          }}
                          disabled={isAccepting}
                        >
                          <i className="bi bi-check-circle me-1"></i>
                          Accept
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => {
                            setJobToDecline(job);
                            setShowDeclineModal(true);
                          }}
                          disabled={isDeclining}
                        >
                          <i className="bi bi-x-circle"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {deliveryJobs.length > 3 && (
              <div className="text-center mt-3">
                <button
                  className="btn btn-sm btn-outline-primary"
                  onClick={() => {
                    // Show all notifications in a modal or expand
                    toast(`${deliveryJobs.length - 3} more delivery jobs available`);
                  }}
                >
                  View All {deliveryJobs.length} Jobs
                </button>
              </div>
            )}
          </div>
        )}

        {/* Show notification button if notifications are hidden */}
        {deliveryJobs && deliveryJobs.length > 0 && !showDeliveryNotifications && (
          <div className="mb-3">
            <button
              className="btn btn-primary w-100"
              onClick={() => setShowDeliveryNotifications(true)}
            >
              <i className="bi bi-bell-fill me-2"></i>
              Show {deliveryJobs.length} Delivery Job{deliveryJobs.length > 1 ? 's' : ''} Available
            </button>
          </div>
        )}

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
                excludeServices={["Luggage Storage", "Dry Cleaning Pick-Up", "shop", "restaurant", "supermarket", "Book a Table", "MOT & Repairs", "Shisha lounges", "Spa", "Beauty", "Taxi Rides", "Healthcare", "Events", "Entertainment"]}
                />
        </div>

        {/* Tabs */}
        <div className="flex bg-white p-2 rounded-[8px] gap-2 mb-4 shadow-sm overflow-x-auto">
          <div
            className={`scroll_bar_hidden flex-shrink-0 sm:flex-1 sm:max-w-none max-w-[140px] w-full text-center py-2 rounded-[10px] font-medium cursor-pointer transition-all duration-200 ${
              activeTab === "inprogress"
                ? "bg-yellow-500 text-white shadow-md"
                : "bg-gray-100 text-gray-700 hover:bg-yellow-100"
            }`}
            onClick={() => setActiveTab("inprogress")}
          >
            {t("tab_inprogress", { count: getCount(["open", "pending"]) })}
          </div>

          <div
            className={`flex-shrink-0 sm:flex-1 sm:max-w-none max-w-[140px] w-full text-center py-2 rounded-[10px] font-medium cursor-pointer transition-all duration-200 ${
              activeTab === "completed"
                ? "bg-green-500 text-white shadow-md"
                : "bg-gray-100 text-gray-700 hover:bg-green-100"
            }`}
            onClick={() => setActiveTab("completed")}
          >
            {t("tab_completed", { count: getCount("completed") })}
          </div>

          <div
            className={`flex-shrink-0 sm:flex-1 sm:max-w-none max-w-[140px] w-full text-center py-2 rounded-[10px] font-medium cursor-pointer transition-all duration-200 ${
              activeTab === "cancelled"
                ? "bg-red-500 text-white shadow-md"
                : "bg-gray-100 text-gray-700 hover:bg-red-100"
            }`}
            onClick={() => setActiveTab("cancelled")}
          >
            {t("tab_cancelled", { count: getCount("cancelled") })}
          </div>
        </div>

        {/* Job Cards */}
        {isLoading ? (
          <div className="text-center mt-4">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">{t("loading")}</span>
            </div>
          </div>
        ) : filteredJobs.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 transition-all duration-300">
            {filteredJobs.map((job, index) => (
              <div
                key={index}
                className="bg-white rounded-xl shadow-md p-4 w-full hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between gap-2">
                {renderPickupDropoffInfo(job)}

                  {/* Job CTA Menu */}
                  <JobCTA
                    job={job}
                    onViewClick={() => handleEditJob(job)}
                    onCompleteClick={() => handleCompleteJob(job)}
                    onReportClick={() => handleReport(job)}
                    onCancelClick={() => handleCancelJob(job)}
                    onChatClick={() => handleChat(job)}
                    onTrackClick={() => handleTrackJob(job)}
                    enableView={true}
                    enableComplete={activeTab === "inprogress"}
                    enableReport={true}
                    enableCancel={activeTab === "inprogress"}
                    enableChat={activeTab === "inprogress" && job?.status === "open" && job?.chatId}
                    enableTrack={activeTab === "inprogress" && (job?.status === "open" || job?.status === "active")}
                    isDisabled={completingJobs[job.id] || cancellingJobs[job.id]}
                    isCompleting={completingJobs[job.id]}
                    isCancelling={cancellingJobs[job.id]}
                  />
                </div>
                {/* Category and time - aligned with pickup/dropoff icon column */}
                <div className="flex items-center gap-2 text-gray-500 text-[16px] mt-1">
                  <span className="w-6 flex-shrink-0 flex items-center justify-center">
                    <CategoryIcon className="w-4 h-4" category={job.category} />
                  </span>
                  <span className="min-w-0">{getServiceName(job.category)}</span>
                </div>
                <span className="flex items-center gap-2 text-xs font-medium text-gray-500 mt-2">
                  <span className="w-6 flex-shrink-0 flex items-center justify-center">
                    <FiClock size={15} color="grey" />
                  </span>
                  {formatDistanceToNow(job.createdAt)}
                </span>
                {(() => {
                  const badge = getJobDateBadge(job.pickupDate);
                  return badge ? (
                    <span className={`inline-flex items-center rounded-md text-xs font-bold px-3 py-1 uppercase shadow-sm mt-2 ${
                      badge.type === 'today' ? "bg-red-500 text-white" : "bg-blue-500 text-white"
                    }`}>
                      {badge.label}
                    </span>
                  ) : null;
                })()}
                <p className="text-gray-700 font-bold mt-2 mb-0">
                  {t("price_label", {
                    amount: job.price
                      ? formatAmountToCurrency(job.price)
                      : "N/A",
                  })}
                </p>
                <div className="flex items-center gap-2 mt-2 justify-between">
                  <p className="text-gray-500 text-sm mb-0 flex-shrink-0">
                    {t("from_label", { city: job.pickupCity || "N/A" })}
                  </p>
                  
                  {/* Delivery Status Dropdown - Only show for delivery orders */}
                  {job?.deliveryOrder && session?.user?.role === "provider" && job?.acceptedById === parseInt(session?.user?.id) && (() => {
                    const currentStatus = job.deliveryOrder.deliveryStatus || 'pending';
                    const availableOptions = getDeliveryStatusOptions();
                    const isUpdating = updatingDeliveryStatus[job.deliveryOrder.id];
                    const isDisabled = isUpdating || currentStatus === 'delivered';

                    return (
                      <select
                        value={currentStatus}
                        onChange={(e) => {
                          const newStatus = e.target.value;
                          if (newStatus !== currentStatus) {
                            handleDeliveryStatusChange(job.deliveryOrder.id, newStatus);
                          }
                        }}
                        disabled={isDisabled}
                        className={`w-auto min-w-[140px] px-2 py-1 rounded-md border border-gray-300 bg-white text-xs font-medium transition ${
                          isUpdating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-gray-400'
                        }`}
                      >
                        {availableOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    );
                  })()}

                  {/* Job Status Dropdown - Only show for regular service jobs (non-delivery) */}
                  {!job?.deliveryOrder && session?.user?.role === "provider" && job?.acceptedById === parseInt(session?.user?.id) && activeTab === "inprogress" && (() => {
                    const currentStatus = job.status || 'open';
                    const availableOptions = getJobStatusOptions();
                    const isUpdating = updatingJobStatus[job.id];
                    const isDisabled = isUpdating || currentStatus === 'completed' || currentStatus === 'cancelled';

                    return (
                      <select
                        value={currentStatus}
                        onChange={(e) => {
                          const newStatus = e.target.value;
                          if (newStatus !== currentStatus) {
                            handleJobStatusChange(job.id, newStatus);
                          }
                        }}
                        disabled={isDisabled}
                        className={`w-auto min-w-[140px] px-2 py-1 rounded-md border border-gray-300 bg-white text-xs font-medium transition ${
                          isUpdating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-gray-400'
                        }`}
                      >
                        {availableOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    );
                  })()}
                </div>

                {/* Feedback Rating for Completed Jobs */}
                {activeTab === "completed" && (
                    <FeedbackRating 
                      rating={typeof job.rating === 'number' ? job.rating : null}
                      size="sm" 
                      className="justify-start"
                      showAverage={false}
                      showCount={false}
                    />
                )}

                {/* View Button for Completed/Cancelled Jobs */}
                {(activeTab === "completed" || activeTab === "cancelled") && (
                  <div className="flex gap-2 mt-3">
                    <button
                      className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
                      onClick={() => handleEditJob(job)}
                    >
                      {t("btn_view")}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : isNotSubscribedToSelectedService ? (
          <CustomIllustration
            page="jobs"
            subscriptionMessage={t("upgrade_membership")}
            buttonText={t("upgrade_membership_btn")}
            onClick={() => router.push("/purchase")}
          />
        ) : (
          <CustomIllustration
            page="jobs"
            illustrationHelperText={
              activeTab === "inprogress"
                ? t("empty_inprogress")
                : activeTab === "completed"
                ? t("empty_completed")
                : t("empty_cancelled")
            }
          />
        )}
      </div>
      <ConfirmationDialog
        isOpen={isOpenConfirmation}
        onClose={handleCloseConfirmation}
        handleConfirm={handleConfirmCancel}
        alertMessage={t("confirm_cancel")}
        description={t("confirm_cancel_desc")}
      />
      {showJobCompletionModal && (
        <JobCompletionModal
          jobId={jobId}
          onClose={() => setShowJobCompletionModal(false)}
          setJobs={setJobs}
        />
      )}

      {/* Accept Delivery Job Confirmation Modal */}
      <ConfirmationDialog
        isOpen={showAcceptModal}
        onClose={() => {
          setShowAcceptModal(false);
          setJobToAccept(null);
        }}
        handleConfirm={handleAcceptDeliveryJob}
        alertMessage="Accept Delivery Job"
        description={jobToAccept ? `Accept delivery job "${jobToAccept.title}"?` : "Accept this delivery job?"}
      />

      {/* Decline Delivery Job Confirmation Modal */}
      <ConfirmationDialog
        isOpen={showDeclineModal}
        onClose={() => {
          setShowDeclineModal(false);
          setJobToDecline(null);
        }}
        handleConfirm={handleDeclineDeliveryJob}
        alertMessage="Decline Delivery Job"
        description={jobToDecline ? `Decline delivery job "${jobToDecline.title}"?` : "Decline this delivery job?"}
      />
    </>
  );
}

