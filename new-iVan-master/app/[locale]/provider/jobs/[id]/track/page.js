"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import Image from "next/image";
import MapComponent from "@/components/MapComponent";
import { formatAmountToCurrency, fullDateFormate, getTime, getServiceName, getFileUrl, CategoryIcon, typeOfKeyOptions, typeOfLockOptions, howManyItemsOptions, typeOfPlaceOptions, howManyHoursOptions, howManyRoomsOptions, howManyBathroomsOptions } from "@/utils/helper";
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

export default function TrackJobPage() {
  const { id } = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [isJobDetailsOpen, setIsJobDetailsOpen] = useState(false);
  const intervalRef = useRef(null);

  const fetchJob = useCallback(async (showLoading = true) => {
    if (!session?.user?.id || !id) {
      return;
    }

    try {
      if (showLoading) setLoading(true);
      const response = await fetch(`/api/provider/jobs/${id}`, {
        headers: {
          "user-id": session.user.id,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setJob(data.job);
        setImageError(false);
      } else {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 404) {
          toast.error(errorData.error || "Job not found. This job may have been deleted or does not exist.");
        } else if (response.status === 403) {
          toast.error("You don't have permission to view this job.");
        } else {
          toast.error(errorData.error || "Failed to load job details");
        }
        router.push("/provider/jobs");
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
      return;
    }

    if (status === "unauthenticated" || !session) {
      router.push("/login");
      return;
    }

    if (session?.user?.id && id) {
      fetchJob();
    }
  }, [id, session, status, fetchJob]);

  // Separate effect for polling
  useEffect(() => {
    if (job?.acceptedById) {
      intervalRef.current = setInterval(() => {
        fetchJob(false);
      }, 5000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [job?.acceptedById, fetchJob]);

  const getJobSteps = () => {
    const jobStatus = job?.status || "pending";
    const hasProvider = !!job?.acceptedById;
    const isCompleted = jobStatus === "completed";

    return {
      steps: [
        {
          label: "Accepted",
          completed: hasProvider,
          active: !hasProvider,
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
          label: "Completed",
          completed: isCompleted,
          active: false,
        },
      ],
    };
  };

  const getPickupLocation = () => {
    if (job?.pickupLat && job?.pickupLng) {
      return {
        lat: job.pickupLat,
        lng: job.pickupLng,
        address: job.pickupAddressLine1 || job.pickupCity || "Service Location",
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

  // Function to open Google Maps with address
  const openGoogleMaps = (address) => {
    if (address) {
      const encodedAddress = encodeURIComponent(address);
      const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
      window.open(googleMapsUrl, '_blank');
    }
  };

  // Function to get service-specific icon for each step
  const getServiceStepIcon = (category) => {
    const iconStyle = { fontSize: "20px" };
    const pendingStyle = { fontSize: "20px", color: "#6c757d" };

    let stepIcons = {
      0: FaHandshake, // Accepted
      1: FaCar, // On the way
      2: FaBriefcase, // In Progress
      3: FaThumbsUp, // Completed
    };

    const serviceIconMap = {
      "Cleaning": {
        0: FaHandshake,
        1: FaCar,
        2: FaBroom,
        3: FaThumbsUp,
      },
      "Locksmith": {
        0: FaHandshake,
        1: FaCar,
        2: FaLock,
        3: FaThumbsUp,
      },
      "Car Key Replacement": {
        0: FaHandshake,
        1: FaCar,
        2: FaKey,
        3: FaThumbsUp,
      },
      "Removals": {
        0: FaHandshake,
        1: FaCar,
        2: FaTrash,
        3: FaThumbsUp,
      },
      "Click & Collect": {
        0: FaHandshake,
        1: FaTruck,
        2: FaShoppingBag,
        3: FaThumbsUp,
      },
      "Van": {
        0: FaHandshake,
        1: FaTruck,
        2: FaTruck,
        3: FaThumbsUp,
      },
      "Recovery": {
        0: FaHandshake,
        1: FaTruckPickup,
        2: FaTruckPickup,
        3: FaThumbsUp,
      },
    };

    if (serviceIconMap[category]) {
      stepIcons = serviceIconMap[category];
    }

    return { stepIcons, iconStyle, pendingStyle };
  };

  // Helper functions
  const getOptionLabel = (options, value) => {
    if (!value) return null;
    const option = options.find(opt => opt.value === value || opt.value === parseInt(value));
    return option ? option.label : value;
  };

  const formatBoolean = (value) => {
    if (value === null || value === undefined) return null;
    return value === true || value === "true" ? "Yes" : "No";
  };

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

  if (loading) {
    return (
      <div className="order-tracking-container">
        <div className="order-tracking-header">
          <button
            onClick={() => router.back()}
            className="order-tracking-back-button"
            aria-label="Go back"
          >
            <i className="bi bi-arrow-left"></i>
          </button>
          <h1 className="order-tracking-title">Service Tracking</h1>
        </div>
        <div className="d-flex justify-content-center align-items-center" style={{ height: "400px" }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!job) {
    return null;
  }

  const { steps } = getJobSteps();
  const pickupLocation = getPickupLocation();
  const dropoffLocation = getDropoffLocation();
  const hasProvider = !!job?.acceptedById;
  const customer = job?.createdBy;
  const { stepIcons, iconStyle, pendingStyle } = getServiceStepIcon(job?.category);
  const OnTheWayStepIcon = stepIcons[1];
  const InProgressStepIcon = stepIcons[2];

  const handleChat = () => {
    if (job?.chatId) {
      router.push(`/provider/chats?chatId=${job.chatId}`);
    }
  };

  return (
    <div className="order-tracking-container">
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
              const isLineCompleted = step.completed;
              const IconComponent = stepIcons[index];

              const getStepIcon = () => {
                if (step.completed) {
                  if (IconComponent) {
                    return <IconComponent className="text-white" style={iconStyle} />;
                  }
                  return <i className="bi bi-check text-white" style={{ fontSize: "20px", fontWeight: "bold" }}></i>;
                } else if (step.active) {
                  if (IconComponent) {
                    return <IconComponent className="text-white" style={iconStyle} />;
                  }
                } else {
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
              category={job?.category}
            />

            {/* On the Way Card - Overlay on Map */}
            {steps[1]?.active && OnTheWayStepIcon && (
              <div className="finding-provider-overlay-card">
                <div className="finding-provider-icon">
                  <OnTheWayStepIcon />
                </div>
                <div className="finding-provider-content">
                  <p className="finding-provider-text">
                    Heading to service location
                  </p>
                  {(() => {
                    const eta = new Date(Date.now() + 15 * 60000);
                    const hours = eta.getHours();
                    const minutes = eta.getMinutes().toString().padStart(2, '0');
                    const period = hours >= 12 ? 'pm' : 'am';
                    const etaTime = `${hours}:${minutes}${period}`;
                    return (
                      <p className="finding-provider-estimate">
                        Estimated arrival {etaTime}
                      </p>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* In Progress Card - Overlay on Map */}
            {steps[2]?.active && InProgressStepIcon && (
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

        {/* Customer Card */}
        <div className="finding-driver-card">
          <div className="finding-driver-icon-circle">
            {customer?.profilePicture ? (
              <>
                <img
                  src={getFileUrl(customer.profilePicture)}
                  alt={`${customer.firstName} ${customer.lastName || ''}`}
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
            <p className="finding-driver-title">Customer</p>
            <p className="finding-driver-subtitle">
              {customer
                ? `${customer.firstName} ${customer.lastName || ''}`.trim()
                : 'N/A'}
            </p>
          </div>
          <div className="d-flex align-items-center gap-2">
            {job?.chatId && (
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

        {/* Job Details Section */}
        <div className="order-details-section">
          <div className="order-details-card">
            <div
              className="order-details-title-header"
              onClick={() => setIsJobDetailsOpen(!isJobDetailsOpen)}
            >
              <h3 className="order-details-title d-flex align-items-center gap-2">
                <CategoryIcon category={job?.category} style={{ fontSize: "18px", color: "#6c757d" }} />
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
                      <CategoryIcon category={job.category} style={{ fontSize: "16px", color: "#6c757d" }} />
                      {getServiceName(job.category)}
                    </span>
                  </div>
                  {job.price && (
                    <div className="order-summary-row">
                      <span>Service price:</span>
                      <span>{formatAmountToCurrency(parseFloat(job.price))}</span>
                    </div>
                  )}
                  {job?.tip && (
                    <div className="order-summary-row">
                      <span>Tip:</span>
                      <span>{formatAmountToCurrency(parseFloat(job.tip))}</span>
                    </div>
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
                    <div className="order-info-item">
                      <strong>Status:</strong>
                      <span className={`badge ${job.status === 'completed' ? 'bg-success' :
                          job.status === 'open' ? 'bg-info' :
                            job.status === 'active' ? 'bg-primary' :
                              job.status === 'cancelled' ? 'bg-danger' :
                                'bg-secondary'
                        }`}>
                        {job.status || 'N/A'}
                      </span>
                    </div>

                    {/* Service-specific details */}
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

                    {customer && (
                      <div className="order-info-item">
                        <strong>Customer:</strong>
                        <span className="fw-bold">{customer.firstName} {customer.lastName || ''}</span>
                      </div>
                    )}
                    {customer?.phone && (
                      <div className="order-info-item">
                        <strong>Customer Phone:</strong>
                        <span>{customer.phone}</span>
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
                    {job.dropOffAddressLine1 && job.category !== "Luggage Storage" && (
                      <div className="order-info-item order-info-item-full">
                        <strong>Drop-off Location:</strong>
                        <span className="fw-bold">{job.dropOffAddressLine1}</span>
                      </div>
                    )}
                    {job.notes && (
                      <div className="order-info-item order-info-item-full">
                        <strong>Notes:</strong>
                        <span>{job.notes}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
