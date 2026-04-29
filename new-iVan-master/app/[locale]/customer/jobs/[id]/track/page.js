"use client";
import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import Image from "next/image";
import MapComponent from "@/components/MapComponent";
import { formatAmountToCurrency, fullDateFormate, getTime, getFileUrl, typeOfKeyOptions, typeOfLockOptions, howManyItemsOptions, typeOfPlaceOptions, howManyHoursOptions, howManyRoomsOptions, howManyBathroomsOptions } from "@/utils/helper";
import { GiKnifeFork } from "react-icons/gi";
import { 
  FaCar, 
  FaThumbsUp, 
  FaBriefcase, 
  FaUser, 
  FaHandshake, 
  FaBroom,
  FaShoppingBag,
  FaTruck,
  FaTruckPickup,
  FaLock,
  FaKey,
  FaTrash
} from "react-icons/fa";
import ConfirmationDialog from "@/components/Modals/ConfirmationModal";
import ReportIssueModal from "@/components/Modals/ReportIssueModal";
import useServicesCatalog from "@/lib/hooks/useServicesCatalog";

// Card Brand Icon Component
const CardBrandIcon = ({ brand, className = "" }) => {
  const brandLower = brand?.toLowerCase() || "";
  
  if (brandLower === "visa") {
    return (
      <svg 
        className={className}
        width="36" 
        height="22" 
        viewBox="0 0 36 22" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        style={{ display: 'inline-block', verticalAlign: 'middle' }}
      >
        <rect width="36" height="22" rx="2" fill="#1434CB"/>
        <text x="18" y="15" fontSize="12" fontWeight="bold" fill="white" textAnchor="middle" fontFamily="Arial, sans-serif">VISA</text>
      </svg>
    );
  }
  
  if (brandLower === "mastercard" || brandLower === "master") {
    return (
      <svg 
        className={className}
        width="36" 
        height="22" 
        viewBox="0 0 36 22" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        style={{ display: 'inline-block', verticalAlign: 'middle' }}
      >
        <rect width="36" height="22" rx="2" fill="#EB001B"/>
        <circle cx="12" cy="11" r="6" fill="#F79E1B"/>
        <circle cx="24" cy="11" r="6" fill="#FF5F00"/>
        <path d="M18 6C16.2 7.5 15.2 8.5 15.2 11C15.2 13.5 16.2 14.5 18 16C19.8 14.5 20.8 13.5 20.8 11C20.8 8.5 19.8 7.5 18 6Z" fill="#FF5F00"/>
      </svg>
    );
  }
  
  // Default credit card icon for other brands
  return (
    <svg 
      className={className}
      width="36" 
      height="22" 
      viewBox="0 0 36 22" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'inline-block', verticalAlign: 'middle' }}
    >
      <rect width="36" height="22" rx="2" fill="#6c757d"/>
      <rect x="4" y="6" width="28" height="2" fill="white" opacity="0.3"/>
      <rect x="4" y="14" width="18" height="2" fill="white" opacity="0.3"/>
    </svg>
  );
};

export default function TrackJobPage() {
  const { id } = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [isJobDetailsOpen, setIsJobDetailsOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [selectedTipAmount, setSelectedTipAmount] = useState(10);
  const [customTipAmount, setCustomTipAmount] = useState("");
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const { serviceMap } = useServicesCatalog();

  const fetchJob = useCallback(async (showLoading = true) => {
    if (!session?.user?.id || !id) {
      return;
    }

    try {
      if (showLoading) setLoading(true);
      const response = await fetch(`/api/customer/jobs/${id}`, {
        headers: {
          "user-id": session.user.id,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setJob(data.job);
        setImageError(false); // Reset image error when job is updated
      } else {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 404) {
          toast.error(errorData.error || "Job not found. This job may have been deleted or does not exist.");
        } else if (response.status === 403) {
          toast.error("You don't have permission to view this job.");
        } else {
          toast.error(errorData.error || "Failed to load job details");
        }
        router.push("/customer/jobs");
      }
    } catch (error) {
      console.error("Error fetching job:", error);
      toast.error("Failed to load job details");
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [id, session?.user?.id, router]);

  useEffect(() => {
    if (status === "loading") {
      return; // Wait for session to load
    }

    if (status === "unauthenticated" || !session) {
      router.push("/login");
      return;
    }

    if (session?.user?.id && id) {
      fetchJob();
    }
  }, [id, session, status, fetchJob]);


  const getJobSteps = () => {
    const jobStatus = job?.status || "pending";
    const hasProvider = !!job?.acceptedById;
    const isCompleted = jobStatus === "completed";

    // Drop-off only luggage storage: 3 steps (Posted → On the way → Done)
    let isDropOffOnlyLuggageStorage = false;
    if (job?.category === "Luggage Storage" && job?.notes) {
      try {
        const d = JSON.parse(job.notes);
        isDropOffOnlyLuggageStorage = d?.type === "luggage" && d?.deliveryMethod === "dropoff";
      } catch {
        // ignore
      }
    }

    if (isDropOffOnlyLuggageStorage) {
      return {
        steps: [
          {
            label: "Posted",
            completed: jobStatus !== "draft",
            active: jobStatus === "draft",
          },
          {
            label: "Drop-off",
            completed: isCompleted,
            active: hasProvider && (jobStatus === "open" || jobStatus === "inprogress") && !isCompleted,
          },
          {
            label: "Done",
            completed: isCompleted,
            active: false,
          },
        ],
        isDropOffOnlyLuggageStorage: true,
      };
    }

    return {
      steps: [
        {
          label: "Posted",
          completed: jobStatus !== "draft",
          active: jobStatus === "draft",
        },
        {
          label: hasProvider ? "Found" : "Searching",
          completed: hasProvider,
          active: !hasProvider && (jobStatus === "active" || jobStatus === "open"),
        },
        {
          label: "On the way",
          completed: hasProvider && jobStatus !== "open",
          active: hasProvider && jobStatus === "open",
        },
        {
          label: "In Progress",
          completed: isCompleted,
          active: hasProvider && jobStatus === "inprogress" && !isCompleted,
        },
        {
          label: "Done",
          completed: isCompleted,
          active: false,
        },
      ],
      isDropOffOnlyLuggageStorage: false,
    };
  };

  const getPickupLocation = () => {
    if (job?.pickupLat && job?.pickupLng) {
      return {
        lat: job.pickupLat,
        lng: job.pickupLng,
        address: job.pickupAddressLine1 || job.pickupCity || "Pickup Location",
      };
    }
    return null;
  };

  const getDropoffLocation = () => {
    if (job?.dropOffLat && job?.dropOffLng) {
      return {
        lat: job.dropOffLat,
        lng: job.dropOffLng,
        address: job.dropOffAddressLine1 || job.dropOffCity || "Drop-off Location",
      };
    }
    return null;
  };

  const getProviderLocation = () => {
    if (job?.acceptedBy?.latitude && job?.acceptedBy?.longitude) {
      return {
        lat: job.acceptedBy.latitude,
        lng: job.acceptedBy.longitude,
        address: "Provider Location",
      };
    }
    return null;
  };

  if (!job) {
    return null;
  }

  const handleCancelJob = () => {
    setIsCancelModalOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (!job || !session?.user?.id) return;
    
    
    setIsCancelModalOpen(false);
    setIsCancelling(true);
    
    try {
      const response = await fetch(`/api/jobs/${id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "cancelled",
        }),
      });

      if (response.ok) {
        toast.success("Job cancelled successfully");
        // Refresh job data
        fetchJob();
        // Redirect to jobs page after a short delay
        setTimeout(() => {
          router.push("/customer/jobs");
        }, 1500);
      } else {
        const data = await response.json().catch(() => ({}));
        toast.error(data.error || data.message || "Failed to cancel job");
      }
    } catch (error) {
      console.error("Error cancelling job:", error);
      toast.error(error.message || "Failed to cancel job. Please try again.");
    } finally {
      setIsCancelling(false);
    }
  };

  const handleCloseCancelModal = () => {
    setIsCancelModalOpen(false);
  };

  // Handle tip confirmation
  const handleTipConfirmation = async () => {
    if (!job || !session?.user?.id) return;
    
    const finalTipAmount = customTipAmount 
      ? parseFloat(customTipAmount) 
      : selectedTipAmount;
    
    if (!finalTipAmount || finalTipAmount <= 0) {
      toast.error("Please select or enter a tip amount");
      return;
    }

    try {
      const response = await fetch(`/api/jobs/${id}/tip`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "user-id": session.user.id.toString(),
        },
        body: JSON.stringify({
          tipAmount: finalTipAmount,
        }),
      });

      if (response.ok) {
        const tipAmount = formatAmountToCurrency(finalTipAmount);
        toast.success(`Tip payment successful: ${tipAmount}`);
        // Refresh job data to show updated tip
        fetchJob(false);
        // Reset tip inputs
        setSelectedTipAmount(10);
        setCustomTipAmount("");
      } else {
        const data = await response.json().catch(() => ({}));
        toast.error(data.error || data.message || "Failed to process tip payment");
      }
    } catch (error) {
      console.error("Error processing tip payment:", error);
      toast.error(error.message || "Failed to process tip payment. Please try again.");
    }
  };

  const handleChat = () => {
    if (job?.chatId) {
      router.push(`/customer/chats?chatId=${job.chatId}`);
    }
  };

  // Function to open Google Maps with address
  const openGoogleMaps = (address) => {
    if (address) {
      const encodedAddress = encodeURIComponent(address);
      const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
      window.open(googleMapsUrl, '_blank');
    }
  };

  // Function to get "Finding..." text based on service category
  const getFindingText = (category) => {
    const findingTextMap = {
      "Cleaning": "Finding cleaner",
      "Locksmith": "Finding locksmith",
      "Van": "Finding driver",
      "Recovery": "Finding recovery",
    };
    
    return findingTextMap[category] || "Finding provider";
  };

  // Function to get service-specific icon for each step
  const getServiceStepIcon = (category, isDropOffOnlyLuggageStorage = false) => {
    const iconStyle = { fontSize: "20px" };
    const pendingStyle = { fontSize: "20px", color: "#6c757d" };

    // Drop-off only luggage storage: 3 steps — Posted, On the way, Done
    if (isDropOffOnlyLuggageStorage) {
      return {
        stepIcons: {
          0: null, // Posted - checkmark
          1: FaBriefcase, // On the way
          2: FaThumbsUp, // Done
        },
        iconStyle,
        pendingStyle,
      };
    }

    // Default icons for general services
    let stepIcons = {
      0: null, // Posted - always checkmark
      1: FaCar, // Searching - default car
      2: FaBriefcase, // Accepted - default briefcase
      3: FaCar, // In Progress - default car
      4: FaThumbsUp, // Done - always thumbs up
    };

    // Service-specific icon mappings
    const serviceIconMap = {
      "Cleaning": {
        0: null, // Posted - checkmark
        1: FaUser, // Searching - person icon 👤
        2: FaCar, // On the way - car icon
        3: FaBroom, // In Progress - broom icon 🧹
        4: FaThumbsUp, // Done - thumbs up
      },
      "Locksmith": {
        0: null, // Posted - checkmark
        1: FaUser, // Searching - person icon
        2: FaHandshake, // Accepted - handshake icon
        3: FaLock, // In Progress - lock icon
        4: FaThumbsUp, // Done - thumbs up
      },
      "Car Key Replacement": {
        0: null, // Posted - checkmark
        1: FaUser, // Searching - person icon
        2: FaHandshake, // Accepted - handshake icon
        3: FaKey, // In Progress - key icon
        4: FaThumbsUp, // Done - thumbs up
      },
      "Removals": {
        0: null, // Posted - checkmark
        1: FaUser, // Searching - person icon
        2: FaHandshake, // Accepted - handshake icon
        3: FaTrash, // In Progress - trash icon
        4: FaThumbsUp, // Done - thumbs up
      },
      "Click & Collect": {
        0: null, // Posted - checkmark
        1: FaShoppingBag, // Searching - shopping bag icon
        2: FaHandshake, // Accepted - handshake icon
        3: FaTruck, // In Progress - truck icon
        4: FaThumbsUp, // Done - thumbs up
      },
      "Van": {
        0: null, // Posted - checkmark
        1: FaTruck, // Searching - truck icon
        2: FaHandshake, // Accepted - handshake icon
        3: FaTruck, // In Progress - truck icon
        4: FaThumbsUp, // Done - thumbs up
      },
      "Recovery": {
        0: null, // Posted - checkmark
        1: FaTruckPickup, // Searching - recovery truck icon
        2: FaHandshake, // Accepted - handshake icon
        3: FaTruckPickup, // In Progress - recovery truck icon
        4: FaThumbsUp, // Done - thumbs up
      },
    };
    
    // Override with service-specific icons if available
    if (serviceIconMap[category]) {
      stepIcons = serviceIconMap[category];
    }
    
    return { stepIcons, iconStyle, pendingStyle };
  };

  const { steps, isDropOffOnlyLuggageStorage } = getJobSteps();
  const serviceMeta = serviceMap[job?.category];
  const serviceName = serviceMeta?.name || job?.category;
  const serviceImg = serviceMeta?.images?.list_service_img;
  const pickupLocation = getPickupLocation();
  const dropoffLocation = getDropoffLocation();
  const providerLocation = getProviderLocation();
  const jobDate = new Date(job.createdAt);
  const daysAgo = Math.floor((Date.now() - jobDate.getTime()) / (1000 * 60 * 60 * 24));
  const isSearching = !job.acceptedById && (job.status === "active" || job.status === "open");
  const hasProvider = !!job?.acceptedById;
  const provider = job?.acceptedBy;

  // Get service-specific icons once (3-step for drop-off only luggage, else 5-step)
  const { stepIcons, iconStyle, pendingStyle } = getServiceStepIcon(job?.category, isDropOffOnlyLuggageStorage);
  const FindingStepIcon = stepIcons[1];   // Searching step (5-step) or On the way icon (3-step overlay)
  const OnTheWayStepIcon = stepIcons[isDropOffOnlyLuggageStorage ? 1 : 2];  // On the way step
  const InProgressStepIcon = stepIcons[3]; // In progress step (5-step only)

  // Helper function to get label from option value
  const getOptionLabel = (options, value) => {
    if (!value) return null;
    const option = options.find(opt => opt.value === value || opt.value === parseInt(value));
    return option ? option.label : value;
  };

  // Helper function to format boolean values
  const formatBoolean = (value) => {
    if (value === null || value === undefined) return null;
    return value === true || value === "true" ? "Yes" : "No";
  };

  // Helper function to format van size
  const formatVanSize = (vanSize) => {
    if (!vanSize) return null;
    const sizeMap = {
      "bike": "Bike",
      "motorbike": "Motorbike",
      "car": "Car",
      "small_van": "Small van",
      "medium_van": "Medium van",
      "large_van": "Large van",
      "xl_van": "XL van"
    };
    return sizeMap[vanSize] || vanSize;
  };

  // Helper function to format payment time
  const formatPaymentTime = (paymentTime) => {
    if (!paymentTime) return null;
    return paymentTime;
  };

  return (
    <div className={`order-tracking-container ${isSearching ? 'with-bottom-button' : ''}`}>
      {/* Header */}
      <div className="order-tracking-header">
        <button
          onClick={() => router.back()}
          className="order-tracking-back-button"
          aria-label="Go back"
        >
          <i className="bi bi-arrow-left"></i>
        </button>
        <h1 className="order-tracking-title">Service Tracking</h1>
        <span className="order-tracking-id">JB-{job.id.substring(0, 6).toUpperCase()}</span>
      </div>
      <div className="tracking_container_card">
       
      {/* Progress Tracker */}
      <div className="progress-tracker-card">
        <div className="progress-tracker-wrapper">
          {steps.map((step, index) => {
            // Line is green if the current step is completed (leading to next step)
            const isLineCompleted = step.completed;
            const isPending = !step.completed && !step.active;
            
            // Define icons for each step based on service category
            const getStepIcon = () => {
              const IconComponent = stepIcons[index];
              
              if (step.completed) {
                // Completed steps show checkmark (only for Posted step)
                if (index === 0) {
                  return <i className="bi bi-check text-white" style={{ fontSize: "20px", fontWeight: "bold" }}></i>;
                }
                // Other completed steps show their icon in white
                if (IconComponent) {
                  return <IconComponent className="text-white" style={iconStyle} />;
                }
              } else if (step.active) {
                // Active step shows icon in white (blue background)
                if (index === 0) {
                  return <i className="bi bi-check text-white" style={{ fontSize: "20px", fontWeight: "bold" }}></i>;
                }
                if (IconComponent) {
                  return <IconComponent className="text-white" style={iconStyle} />;
                }
              } else {
                // Pending steps show icon in dark grey
                if (index === 0) {
                  return <i className="bi bi-check" style={pendingStyle}></i>;
                }
                if (IconComponent) {
                  return <IconComponent style={pendingStyle} />;
                }
              }
              return null;
            };
            
            return (
              <div key={index} className="progress-step">
                <div className={`progress-step-circle ${step.completed ? 'completed' : step.active ? 'active' : 'pending'}`}>
                  {getStepIcon()}
                </div>
                <p className={`progress-step-label ${step.active ? 'active' : step.completed ? 'completed' : 'pending'}`}>
                  {step.label}
                </p>
                {/* Connecting line */}
                {index < steps.length - 1 && (
                  <div className={`progress-connector-line ${isLineCompleted ? 'completed' : 'pending'}`}
                    style={{ right: index === steps.length - 2 ? "18px" : "-50%" }}
                  ></div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Map Section */}
      <div className="map-card">
        <div className="map-container">
          <MapComponent
            pickupLocation={pickupLocation}
            dropoffLocation={dropoffLocation}
            hide={{ dropoff: !dropoffLocation, clear: true, tip: true }}
            showAvailableDrivers={isSearching}
            category={job?.category}
          />
                   {pickupLocation && isSearching && (
            <>
              <div className="search-radius-overlay large"></div>
              <div className="search-radius-overlay medium"></div>
            </>
          )}


          {/* Finding Provider Card - Overlay on Map */}
          {isSearching && FindingStepIcon && (
            <div className="finding-provider-overlay-card">
              <div className="finding-provider-icon">
                <FindingStepIcon />
              </div>
              <div className="finding-provider-content">
                <p className="finding-provider-text">{getFindingText(job?.category)}...</p>
                <p className="finding-provider-estimate">Estimated pickup: 4-6 min</p>
              </div>
            </div>
          )}

          {/* On the Way Card - Overlay on Map (step 1 for 3-step, step 2 for 5-step) */}
          {steps[isDropOffOnlyLuggageStorage ? 1 : 2]?.active && OnTheWayStepIcon && (
            <div className="finding-provider-overlay-card">
              <div className="finding-provider-icon">
                <OnTheWayStepIcon />
              </div>
              <div className="finding-provider-content">
                <p className="finding-provider-text">
                  {provider?.firstName || "Provider"} is heading to you now
                </p>
                {(() => {
                  // Calculate estimated time of arrival (15 minutes from now as example)
                  const eta = new Date(Date.now() + 15 * 60000); // 15 minutes
                  const hours = eta.getHours();
                  const minutes = eta.getMinutes().toString().padStart(2, '0');
                  const period = hours >= 12 ? 'pm' : 'am';
                  const etaTime = `${hours}:${minutes}${period}`;
                  return (
                    <p className="finding-provider-estimate">
                      Estimated time of arrival {etaTime}
                    </p>
                  );
                })()}
              </div>
            </div>
          )}

          {/* In Progress Card - Overlay on Map (5-step only; no In Progress for drop-off only luggage) */}
          {!isDropOffOnlyLuggageStorage && steps[3]?.active && InProgressStepIcon && (
            <div className="finding-provider-overlay-card">
              <div className="finding-provider-icon">
                <InProgressStepIcon />
              </div>
              <div className="finding-provider-content">
                <p className="finding-provider-text">Service in progress</p>
              </div>
            </div>
          )}
        </div>
      
        <div className="map-labels-container">
          <div className="map-labels-row">
            {pickupLocation && (
              <div className="map-label-card">
                <div className="map-label-card-icon pickup-icon">
                  <i className={job?.category === "Luggage Storage" ? "bi bi-shop" : "bi bi-geo-alt-fill"}></i>
                </div>
                <div className="map-label-card-content">
                  <p className="map-label-card-title">{job?.category === "Luggage Storage" ? "Drop off point" : job?.category === "Click & Collect" ? "Store collection" : "Service Location"}</p>
                  <p 
                    className="map-label-card-address" 
                    style={{ textDecoration: 'underline', cursor: 'pointer' }}
                    onClick={() => openGoogleMaps(pickupLocation.address)}
                  >
                    {pickupLocation.address}
                  </p>
                </div>
              </div>
            )}
            {dropoffLocation && job?.category !== "Luggage Storage" && (
              <div className="map-label-card">
                <div className="map-label-card-icon delivery-icon">
                  <i className="bi bi-house-fill"></i>
                </div>
                <div className="map-label-card-content">
                  <p className="map-label-card-title">Drop-off</p>
                  <p 
                    className="map-label-card-address" 
                    style={{ textDecoration: 'underline', cursor: 'pointer' }}
                    onClick={() => openGoogleMaps(dropoffLocation.address)}
                  >
                    {dropoffLocation.address}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
     
      {/* Provider Card */}
      <div className="finding-driver-card">
        <div className="finding-driver-icon-circle">
          {hasProvider && provider?.profilePicture ? (
            <>
              <img 
                src={getFileUrl(provider.profilePicture)} 
                alt={`${provider.firstName} ${provider.lastName || ''}`}
                className="finding-driver-avatar"
                onError={(e) => {
                  e.target.style.display = 'none';
                  const icon = e.target.nextElementSibling;
                  if (icon) icon.style.display = 'block';
                }}
              />
              <i 
                className="bi bi-person-circle" 
                style={{ display: 'none', position: 'absolute' }}
              ></i>
            </>
          ) : (
            <i className="bi bi-person-circle"></i>
          )}
        </div>
        <div className="finding-driver-text">
          <p className="finding-driver-title">Service Provider</p>
          <p className="finding-driver-subtitle">
            {hasProvider && provider
              ? `${provider.firstName} ${provider.lastName || ''}`.trim()
              : 'Searching for available providers...'}
          </p>
        </div>
        <div className="d-flex align-items-center gap-2">
          {hasProvider && job?.chatId && (
            <div 
              className="finding-driver-message-icon"
              onClick={handleChat}
              style={{ cursor: 'pointer' }}
            >
              <i className="bi bi-chat-dots" style={{ fontSize: '20px', color: '#0D6EFD' }}></i>
            </div>
          )}
          <div className="finding-driver-arrow">
            <i className="bi bi-chevron-right"></i>
          </div>
        </div>
      </div>

      {/* Tip Box - Only show if tip hasn't been given */}
      {!job.tip && (
        <div className="tip-box-card">
          <div className="tip-box-header">
            <i className="bi bi-heart-fill tip-box-heart-icon"></i>
            <div className="tip-box-header-text">
              <h3 className="tip-box-title">Tip Your Service Provider</h3>
              <p className="tip-box-subtitle">Show appreciation for great service</p>
            </div>
          </div>
          <div className="tip-box-options">
            <button
              className={`tip-amount-button ${selectedTipAmount === 2 ? 'selected' : ''}`}
              onClick={() => {
                setSelectedTipAmount(2);
                setCustomTipAmount("");
              }}
            >
              £2
            </button>
            <button
              className={`tip-amount-button ${selectedTipAmount === 5 ? 'selected' : ''}`}
              onClick={() => {
                setSelectedTipAmount(5);
                setCustomTipAmount("");
              }}
            >
              £5
            </button>
            <button
              className={`tip-amount-button ${selectedTipAmount === 10 ? 'selected' : ''}`}
              onClick={() => {
                setSelectedTipAmount(10);
                setCustomTipAmount("");
              }}
            >
              £10
            </button>
            <div className="tip-custom-input-wrapper">
              <input
                type="number"
                className="tip-custom-input"
                placeholder="Custom"
                value={customTipAmount}
                onChange={(e) => {
                  const value = e.target.value;
                  setCustomTipAmount(value);
                  if (value) {
                    setSelectedTipAmount(null);
                  } else {
                    setSelectedTipAmount(10);
                  }
                }}
                onFocus={() => {
                  if (customTipAmount) {
                    setSelectedTipAmount(null);
                  }
                }}
              />
            </div>
          </div>
          <div className="flex items-center justify-center gap-2 mt-2">
            <button
              type="button"
              onClick={handleTipConfirmation}
              className="px-4 py-2 font-bold text-sm text-white bg-blue-600 hover:bg-blue-700 border border-blue-700 rounded-full transition-colors duration-200"
              title="Confirm tip amount"
            >
              Tip
            </button>
          </div>
        </div>
      )}

      {/* Job Details Section */}
      <div className="order-details-section">
        <div className="order-details-card">
          <div 
            className="order-details-title-header"
            onClick={() => setIsJobDetailsOpen(!isJobDetailsOpen)}
          >
            <h3 className="order-details-title d-flex align-items-center gap-2">
              {serviceImg ? (
                <img
                  src={serviceImg}
                  alt={serviceName}
                  style={{ width: "18px", height: "18px", borderRadius: "50%", objectFit: "cover" }}
                />
              ) : (
                <i className="bi bi-grid-3x3-gap-fill" style={{ fontSize: "18px", color: "#6c757d" }} />
              )}
              Service Details
            </h3>
            <div className="order-details-arrow">
              <i className={`bi bi-chevron-${isJobDetailsOpen ? 'down' : 'right'}`}></i>
            </div>
          </div>
          
          {isJobDetailsOpen && (
            <div className="order-details-content">
              {/* Job Summary */}
              <div className="order-summary-section">
                <h5 className="order-summary-title">Summary</h5>
                <div className="order-summary-row">
                  <span>Service Type:</span>
                  <span className="d-flex align-items-center gap-2">
                    {serviceImg ? (
                      <img
                        src={serviceImg}
                        alt={serviceName}
                        style={{ width: "16px", height: "16px", borderRadius: "50%", objectFit: "cover" }}
                      />
                    ) : (
                      <i className="bi bi-grid-3x3-gap-fill" style={{ fontSize: "16px", color: "#6c757d" }} />
                    )}
                    {serviceName}
                  </span>
                </div>
                {job.price && (
                  <div className="order-summary-row">
                    <span>Service price:</span>
                    <span>{formatAmountToCurrency(parseFloat(job.price))}</span>
                  </div>
                )}
                <div className="order-summary-row">
                  <span>Service fee:</span>
                  <span>{formatAmountToCurrency(parseFloat(job.serviceFee || 2.50))}</span>
                </div>
                {job?.tip && (
                  <div className="order-summary-row">
                    <span>Tip:</span>
                    <span>{formatAmountToCurrency(parseFloat(job.tip))}</span>
                  </div>
                )}
                  <div className="order-summary-row">
                    <span className="fw-bold">Total price:</span>
                    <span className="fw-bold">{formatAmountToCurrency(
                      parseFloat(job.price || 0) + 
                      parseFloat(job.serviceFee || 2.50) + 
                      parseFloat(job?.tip || 0)
                    )}</span>
                  </div>
                {job.transaction?.cardBrand && job.transaction?.lastFourDigit && (
                        <span className="d-inline-flex align-items-center gap-1 mt-2">
                          <CardBrandIcon brand={job.transaction.cardBrand} className="card-brand-icon" />
                          <span>•••• {job.transaction.lastFourDigit}</span>
                        </span>
                      )}
              </div>

              {/* Additional Job Information */}
              <div className="order-info-section">
                <h5 className="order-info-title">Service Information</h5>
                <div className="order-info-grid">
                  <div className="order-info-item">
                    <strong className="d-flex align-items-center gap-2">
                      <i className="bi bi-calendar" style={{ fontSize: "14px", color: "#6c757d" }}></i>
                      Job Date:
                    </strong>
                    <span className="fw-bold">{fullDateFormate(job.createdAt)}</span>
                  </div>
                  {job.createdAt && (
                    <div className="order-info-item">
                      <strong className="d-flex align-items-center gap-2">
                        <i className="bi bi-clock" style={{ fontSize: "14px", color: "#6c757d" }}></i>
                        Job Time:
                      </strong>
                      <span className="fw-bold">{getTime(job.createdAt)}</span>
                    </div>
                  )}
                  
                  {/* Service Information - Category-specific details */}
                  {job.category === "Click & Collect" && (
                    <>
                      {job.storeName && (
                        <div className="order-info-item">
                          <strong>Store Name:</strong>
                          <span>{job.storeName}</span>
                        </div>
                      )}
                      {job.clickAndCollectIdNumber && (
                        <div className="order-info-item">
                          <strong>Click & Collect ID:</strong>
                          <span>{job.clickAndCollectIdNumber}</span>
                        </div>
                      )}
                      {job.yourName && (
                        <div className="order-info-item">
                          <strong>Your Name:</strong>
                          <span>{job.yourName}</span>
                        </div>
                      )}
                      {job.contactNumber && (
                        <div className="order-info-item">
                          <strong>Contact Number:</strong>
                          <span>{job.contactNumber}</span>
                        </div>
                      )}
                    </>
                  )}

                  {(job.category === "Van" || job.category === "restaurant" || job.category === "shop") && (
                    <>
                      {job.vanSize && (
                        <div className="order-info-item">
                          <strong>Van Size:</strong>
                          <span>{formatVanSize(job.vanSize)}</span>
                        </div>
                      )}
                      {job.movingItem && (
                        <div className="order-info-item">
                          <strong>Moving Item:</strong>
                          <span>{job.movingItem}</span>
                        </div>
                      )}
                      {job.isHelpLoading !== null && job.isHelpLoading !== undefined && (
                        <div className="order-info-item">
                          <strong>Help Loading:</strong>
                          <span>{formatBoolean(job.isHelpLoading)}</span>
                        </div>
                      )}
                      {job.isTwoMenRequired !== null && job.isTwoMenRequired !== undefined && (
                        <div className="order-info-item">
                          <strong>2 Men Required:</strong>
                          <span>{formatBoolean(job.isTwoMenRequired)}</span>
                        </div>
                      )}
                    </>
                  )}

                  {job.category === "Recovery" && (
                    <>
                      {job.make && (
                        <div className="order-info-item">
                          <strong>Vehicle Make:</strong>
                          <span>{job.make}</span>
                        </div>
                      )}
                      {job.model && (
                        <div className="order-info-item">
                          <strong>Vehicle Model:</strong>
                          <span>{job.model}</span>
                        </div>
                      )}
                      {job.year && (
                        <div className="order-info-item">
                          <strong>Vehicle Year:</strong>
                          <span>{job.year}</span>
                        </div>
                      )}
                      {job.doesCarTurnOn !== null && job.doesCarTurnOn !== undefined && (
                        <div className="order-info-item">
                          <strong>Car Turns On:</strong>
                          <span>{formatBoolean(job.doesCarTurnOn)}</span>
                        </div>
                      )}
                    </>
                  )}

                  {job.category === "Removals" && (
                    <>
                      {job.howManyItems && (
                        <div className="order-info-item">
                          <strong>Number of Items:</strong>
                          <span>{getOptionLabel(howManyItemsOptions, job.howManyItems) || `${job.howManyItems} Item${job.howManyItems > 1 ? 's' : ''}`}</span>
                        </div>
                      )}
                    </>
                  )}

                  {job.category === "Locksmith" && (
                    <>
                      {job.typeOfKey && (
                        <div className="order-info-item">
                          <strong>Type of Key:</strong>
                          <span>{getOptionLabel(typeOfKeyOptions, job.typeOfKey) || job.typeOfKey}</span>
                        </div>
                      )}
                      {job.typeOfLock && (
                        <div className="order-info-item">
                          <strong>Type of Lock:</strong>
                          <span>{getOptionLabel(typeOfLockOptions, job.typeOfLock) || job.typeOfLock}</span>
                        </div>
                      )}
                    </>
                  )}

                  {job.category === "Cleaning" && (
                    <>
                      {job.howManyRooms && (
                        <div className="order-info-item">
                          <strong>Number of Bedrooms:</strong>
                          <span>{getOptionLabel(howManyRoomsOptions, job.howManyRooms) || `${job.howManyRooms} Room${job.howManyRooms > 1 ? 's' : ''}`}</span>
                        </div>
                      )}
                      {job.howManyBathrooms && (
                        <div className="order-info-item">
                          <strong>Number of Bathrooms:</strong>
                          <span>{getOptionLabel(howManyBathroomsOptions, job.howManyBathrooms) || `${job.howManyBathrooms} Bathroom${job.howManyBathrooms > 1 ? 's' : ''}`}</span>
                        </div>
                      )}
                      {job.howManyHours && (
                        <div className="order-info-item">
                          <strong>Number of Hours:</strong>
                          <span>{getOptionLabel(howManyHoursOptions, job.howManyHours) || `${job.howManyHours} Hour${job.howManyHours > 1 ? 's' : ''}`}</span>
                        </div>
                      )}
                      {job.typeOfPlace && (
                        <div className="order-info-item">
                          <strong>Type of Property:</strong>
                          <span>{getOptionLabel(typeOfPlaceOptions, job.typeOfPlace) || job.typeOfPlace}</span>
                        </div>
                      )}
                      {job.hasCleaningProducts !== null && job.hasCleaningProducts !== undefined && (
                        <div className="order-info-item">
                          <strong>Has Cleaning Products:</strong>
                          <span>{formatBoolean(job.hasCleaningProducts)}</span>
                        </div>
                      )}
                    </>
                  )}

                  {job.category === "Car Key Replacement" && (
                    <>
                      {job.make && (
                        <div className="order-info-item">
                          <strong>Vehicle Make:</strong>
                          <span>{job.make}</span>
                        </div>
                      )}
                      {job.model && (
                        <div className="order-info-item">
                          <strong>Vehicle Model:</strong>
                          <span>{job.model}</span>
                        </div>
                      )}
                      {job.year && (
                        <div className="order-info-item">
                          <strong>Vehicle Year:</strong>
                          <span>{job.year}</span>
                        </div>
                      )}
                      {job.hasLogBook !== null && job.hasLogBook !== undefined && (
                        <div className="order-info-item">
                          <strong>Urgent Assistance:</strong>
                          <span>{formatBoolean(job.hasLogBook)}</span>
                        </div>
                      )}
                      {job.hasCarKey !== null && job.hasCarKey !== undefined && (
                        <div className="order-info-item">
                          <strong>Has Car Key:</strong>
                          <span>{formatBoolean(job.hasCarKey)}</span>
                        </div>
                      )}
                    </>
                  )}

                  {/* Common service details */}
                  {job.paymentTime && (
                    <div className="order-info-item">
                      <strong>Payment Time:</strong>
                      <span>{formatPaymentTime(job.paymentTime)}</span>
                    </div>
                  )}
                  {job.category !== "Luggage Storage" &&
                    job.requireUrgent !== null &&
                    job.requireUrgent !== undefined && (
                      <div className="order-info-item">
                        <strong>Require Urgent:</strong>
                        <span>{formatBoolean(job.requireUrgent)}</span>
                      </div>
                    )}

                
                  {job.acceptedBy && (
                    <div className="order-info-item">
                      <strong>Provider:</strong>
                      <span className="fw-bold">{job.acceptedBy.firstName} {job.acceptedBy.lastName || ''}</span>
                    </div>
                  )}
                  {job.pickupAddressLine1 && job.category !== "Luggage Storage" && (
                    <div className="order-info-item order-info-item-full">
                      <strong className="d-flex align-items-center gap-2">
                        <i className="bi bi-geo-alt" style={{ fontSize: "14px", color: "#6c757d" }}></i>
                        Service Location:
                      </strong>
                      <span className="fw-bold">{job.pickupAddressLine1}</span>
                    </div>
                  )}
                  {job.dropOffAddressLine1 && job.category === "Luggage Storage" && (
                    <div className="order-info-item order-info-item-full">
                      <strong>Drop-off Location:</strong>
                      <span className="fw-bold">{job.dropOffAddressLine1}</span>
                    </div>
                  )}



                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      {(job?.status !== 'completed' && 
        job?.status !== 'cancelled') && (
        <div className="cancel-order-button-container">
          <button
            onClick={handleCancelJob}
            disabled={isCancelling}
            className="cancel-order-button"
          >
            {isCancelling ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Cancelling...
              </>
            ) : (
              "Cancel Job"
            )}
          </button>
        </div>
      )}
      
      {/* Report Issue Link */}
      {job && (
        <div className="flex justify-center w-full mt-2">
          <button
            onClick={() => setIsReportModalOpen(true)}
          >
        
            <span className="report-issue-text">Report an issue</span>
          </button>
        </div>
      )}
       </div>

      {/* Cancel Confirmation Modal */}
      <ConfirmationDialog
        isOpen={isCancelModalOpen}
        onClose={handleCloseCancelModal}
        handleConfirm={handleConfirmCancel}
        alertMessage={"Are you sure you want to cancel this job?"}
      />

      {/* Report Issue Modal */}
      {job && (
        <ReportIssueModal
          job={job}
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
        />
      )}
    
    </div>
  );
}

