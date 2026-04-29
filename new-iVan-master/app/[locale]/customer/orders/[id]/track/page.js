"use client";
import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import MapComponent from "@/components/MapComponent";
import { formatAmountToCurrency, fullDateFormate, getFileUrl, getTime } from "@/utils/helper";
import { GiKnifeFork } from "react-icons/gi";
import { FaCar, FaThumbsUp, FaStore } from "react-icons/fa";
import ConfirmationDialog from "@/components/Modals/ConfirmationModal";
import ReportIssueModal from "@/components/Modals/ReportIssueModal";

const ADD_TO_ORDER_CONTEXT_KEY = "addToOrderContext";

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

export default function TrackOrderPage() {
  const { id } = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isOrderDetailsOpen, setIsOrderDetailsOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [selectedTipAmount, setSelectedTipAmount] = useState(10);
  const [customTipAmount, setCustomTipAmount] = useState("");
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(null);

  const fetchOrder = useCallback(async (showLoading = true) => {
    if (!session?.user?.id || !id) {
      return;
    }

    try {
      if (showLoading) setLoading(true);
      const response = await fetch(`/api/customer/orders/${id}`, {
        headers: {
          "user-id": session.user.id,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setOrder(data.order);
      } else {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 404) {
          toast.error(errorData.error || "Order not found. This order may have been deleted or does not exist.");
        } else if (response.status === 403) {
          toast.error("You don't have permission to view this order.");
        } else {
          toast.error(errorData.error || "Failed to load order details");
        }
        router.push("/customer/jobs");
      }
    } catch (error) {
      console.error("Error fetching order:", error);
      toast.error("Failed to load order details");
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
      fetchOrder();
    }
  }, [id, session, status, fetchOrder]);

  // Countdown timer for adding items to order: 8 minutes from order createdAt only
  useEffect(() => {
    const shopType = order?.shop?.type;
    const createdAt = order?.createdAt;
    // Only show countdown for restaurant and shop orders
    if (shopType !== "restaurant" && shopType !== "shop") {
      setTimeRemaining(null);
      return;
    }
    if (!createdAt) {
      setTimeRemaining(null);
      return;
    }

    const eightMinutesMs = 8 * 60 * 1000;
    const deadline = new Date(createdAt).getTime() + eightMinutesMs;

    const updateRemaining = () => {
      const remaining = deadline - Date.now();
      setTimeRemaining(remaining > 0 ? remaining : 0);
    };

    updateRemaining(); // set initial value
    const interval = setInterval(updateRemaining, 1000);

    return () => clearInterval(interval);
  }, [order?.shop?.type, order?.createdAt]);

  const getOrderSteps = () => {
    const deliveryStatus = order?.deliveryStatus || "pending";
    const orderStatus = order?.status || "pending";
    const shopType = order?.shop?.type || "shop"; // "shop" or "restaurant"
    
    // Step 1: Order paid
    const isOrderPaid = orderStatus === "paid" || orderStatus === "completed";
    
    // Step 2: Searching for driver
    // This is active when order is paid but driver hasn't been assigned yet
    // Statuses: pending, confirmed, ready_to_dispatch, waiting_for_provider
    const isSearchingForDriver = isOrderPaid && (
      deliveryStatus === "pending" || 
      deliveryStatus === "confirmed" || 
      deliveryStatus === "ready_to_dispatch" || 
      deliveryStatus === "waiting_for_provider"
    );
    
    // Step 3: Picked up from restaurant/shop
    // Driver picks up when status changes from "assigned"/"dispatched" to "in-transit"
    // So this is completed when status is "in-transit" or "delivered"
    // "assigned" or "dispatched" means driver is assigned but hasn't picked up yet
    const isPickedUp = deliveryStatus === "in-transit" || deliveryStatus === "delivered";
    
    // Step 4: Out for delivery
    // This is when driver is in-transit (has picked up and is delivering)
    const isOutForDelivery = deliveryStatus === "in-transit" || deliveryStatus === "delivered";
    
    // Step 5: Order completed
    const isOrderCompleted = deliveryStatus === "delivered";
    
    // Check if driver is assigned but hasn't picked up yet
    const isDriverAssigned = deliveryStatus === "assigned" || deliveryStatus === "dispatched";
    
    // Dynamic label based on shop type
    const pickupLabel = shopType === "restaurant" 
      ? "Pickup" 
      : "Pickup";
    
    return [
      {
        label: "Paid",
        completed: isOrderPaid,
        active: !isOrderPaid && orderStatus === "pending",
      },
      {
        label: !isSearchingForDriver && isOrderPaid && (isDriverAssigned || isPickedUp) ? "Driver found" : "Searching",
        completed: !isSearchingForDriver && isOrderPaid && (isDriverAssigned || isPickedUp),
        active: isSearchingForDriver,
      },
      {
        label: pickupLabel,
        completed: isPickedUp,
        active: isDriverAssigned && !isPickedUp,
      },
      {
        label: "Delivery",
        completed: isOutForDelivery,
        active: deliveryStatus === "in-transit" && !isOrderCompleted,
      },
      {
        label: "Done",
        completed: isOrderCompleted,
        active: false,
      },
    ];
  };

  const getPickupLocation = () => {
    if (order?.job?.pickupLat && order?.job?.pickupLng) {
      return {
        lat: order.job.pickupLat,
        lng: order.job.pickupLng,
        address: order.shop?.address1 || "Upper Clapton",
      };
    }
    if (order?.shop?.latitude && order?.shop?.longitude) {
      return {
        lat: order.shop.latitude,
        lng: order.shop.longitude,
        address: order.shop.address1 || "Upper Clapton",
      };
    }
    return null;
  };

  const getDeliveryLocation = () => {
    if (order?.job?.dropOffLat && order?.job?.dropOffLng) {
      return {
        lat: order.job.dropOffLat,
        lng: order.job.dropOffLng,
        address: order.deliveryAddress || "St. Mary's Residential Home, Abbots Park",
      };
    }
    if (order?.deliveryLat && order?.deliveryLng) {
      return {
        lat: order.deliveryLat,
        lng: order.deliveryLng,
        address: order.deliveryAddress || "St. Mary's Residential Home, Abbots Park",
      };
    }
    return null;
  };

  

  if (!order) {
    return null;
  }

  const handleCancelOrder = () => {
    setIsCancelModalOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (!order || !session?.user?.id) return;
    
    // Verify order belongs to user
    if (order.userId !== parseInt(session.user.id)) {
      toast.error("You are not authorized to cancel this order");
      setIsCancelModalOpen(false);
      return;
    }
    
    // Verify job exists
    if (!order.job || !order.job.id) {
      toast.error("Job not found for this order");
      setIsCancelModalOpen(false);
      return;
    }
    
    setIsCancelModalOpen(false);
    setIsCancelling(true);
    
    try {
      const response = await fetch(`/api/jobs/${order.job.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "cancelled",
        }),
      });

      if (response.ok) {
        toast.success("Order cancelled successfully");
        // Refresh order data
        fetchOrder();
        // Redirect to jobs page after a short delay
        setTimeout(() => {
          router.push("/customer/jobs");
        }, 1500);
      } else {
        const data = await response.json().catch(() => ({}));
        toast.error(data.error || data.message || "Failed to cancel order");
      }
    } catch (error) {
      console.error("Error cancelling order:", error);
      toast.error(error.message || "Failed to cancel order. Please try again.");
    } finally {
      setIsCancelling(false);
    }
  };

  const handleCloseCancelModal = () => {
    setIsCancelModalOpen(false);
  };

  // Handle tip confirmation
  const handleTipConfirmation = async () => {
    if (!order || !session?.user?.id) return;
    
    const finalTipAmount = customTipAmount 
      ? parseFloat(customTipAmount) 
      : selectedTipAmount;
    
    if (!finalTipAmount || finalTipAmount <= 0) {
      toast.error("Please select or enter a tip amount");
      return;
    }

    try {
      const response = await fetch(`/api/customer/orders/${id}/tip`, {
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
        // Refresh order data to show updated tip
        fetchOrder(false);
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

  // Function to open Google Maps with address
  const openGoogleMaps = (address) => {
    if (address) {
      const encodedAddress = encodeURIComponent(address);
      const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
      window.open(googleMapsUrl, '_blank');
    }
  };

  const steps = getOrderSteps();
  const pickupLocation = getPickupLocation();
  const deliveryLocation = getDeliveryLocation();
  const orderDate = new Date(order.createdAt);
  const daysAgo = Math.floor((Date.now() - orderDate.getTime()) / (1000 * 60 * 60 * 24));
  const orderStatus = order?.status || "pending";
  const deliveryStatus = order?.deliveryStatus || "pending";
  const shopType = order?.shop?.type || "shop";
  const isSearching = (orderStatus === "paid" || orderStatus === "completed") && 
                      (deliveryStatus === "confirmed" || deliveryStatus === "pending" || 
                       deliveryStatus === "ready_to_dispatch" || deliveryStatus === "waiting_for_provider");
  const isDriverAssigned = deliveryStatus === "assigned" || deliveryStatus === "dispatched";
  const isInTransit = deliveryStatus === "in-transit";
  const isDelivered = deliveryStatus === "delivered";
  const hasProvider = !!order?.deliveryProvider;
  const provider = order?.deliveryProvider;
  const showDriverCard = isSearching || isDriverAssigned || isInTransit || isDelivered;

  // Function to get overlay message based on status
  const getOverlayMessage = () => {
    if (isSearching) {
      return {
        text: "Finding driver...",
        estimate: "Estimated pickup: 4-6 min"
      };
    }
    if (isDriverAssigned) {
      const location = shopType === "restaurant" ? "restaurant" : "store";
      // Calculate estimated time of arrival at store/restaurant (10 minutes from now as example)
      const eta = new Date(Date.now() + 10 * 60000); // 10 minutes
      const etaTime = eta.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
      return {
        text: `Driver is heading to the ${location}`,
        estimate: `Estimated time of arrival ${etaTime}`
      };
    }
    if (isInTransit) {
      // Calculate estimated time of arrival (15 minutes from now as example)
      const eta = new Date(Date.now() + 15 * 60000); // 15 minutes
      const etaTime = eta.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
      return {
        text: "Driver is heading to you",
        estimate: `Estimated time of arrival ${etaTime}`
      };
    }
    if (isDelivered) {
      return {
        text: "Delivery completed",
        estimate: null,
        showStars: true
      };
    }
    return null;
  };

  const overlayMessage = getOverlayMessage();

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
        <h1 className="order-tracking-title">Order Tracking</h1>
        <span className="order-tracking-id">SM-{order.id.substring(0, 6).toUpperCase()}</span>
      </div>
      <div className="tracking_container_card">
       
      {/* Progress Tracker */}
      <div className="progress-tracker-card">
        <div className="progress-tracker-wrapper">
          {steps.map((step, index) => {
            // Line should be green if the current step (previous step for the next one) is completed
            const isLineCompleted = step.completed;
            const isPending = !step.completed && !step.active;
            
            // Define icons for each step
            const getStepIcon = () => {
              if (step.completed) {
                // Completed steps show checkmark (only for Paid step)
                if (index === 0) {
                  return <i className="bi bi-check text-white progress-step-icon-bold"></i>;
                }
                // Other completed steps show their icon in white
                if (index === 1) return <FaCar className="text-white progress-step-icon" />;
                if (index === 2) return <GiKnifeFork className="text-white progress-step-icon" />;
                if (index === 3) return <FaCar className="text-white progress-step-icon" />;
                if (index === 4) return <FaThumbsUp className="text-white progress-step-icon" />;
              } else if (step.active && index !== 3) {
                // Active step shows icon in white (blue background) - except "Delivery" step
                if (index === 1) return <FaCar className="text-white progress-step-icon" />;
                if (index === 2) return <GiKnifeFork className="text-white progress-step-icon" />;
                if (index === 4) return <FaThumbsUp className="text-white progress-step-icon" />;
              } else {
                // Pending steps show icon in dark grey (including "Delivery" when active)
                if (index === 0) return <i className="bi bi-check progress-step-icon-pending"></i>;
                if (index === 1) return <FaCar className="progress-step-icon-pending" />;
                if (index === 2) return <GiKnifeFork className="progress-step-icon-pending" />;
                if (index === 3) return <FaCar className="progress-step-icon-pending" />;
                if (index === 4) return <FaThumbsUp className="progress-step-icon-pending" />;
              }
              return null;
            };
            
            return (
              <div key={index} className="progress-step">
                <div className={`progress-step-circle ${step.completed ? 'completed' : (step.active && index !== 3) ? 'active' : 'pending'}`}>
                  {getStepIcon()}
                </div>
                <p className={`progress-step-label ${(step.active && index !== 3) ? 'active' : step.completed ? 'completed' : 'pending'}`}>
                  {step.label}
                </p>
                {/* Connecting line */}
                {index < steps.length - 1 && (
                  <div className={`progress-connector-line ${isLineCompleted ? 'completed' : 'pending'} ${index === steps.length - 2 ? 'progress-connector-line-last' : 'progress-connector-line-middle'}`}
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
            dropoffLocation={deliveryLocation}
            hide={{ dropoff: false, clear: true, tip: true }}
            showAvailableDrivers={isSearching && !isDriverAssigned}
            category="Van"
          />
                   {pickupLocation && isSearching && (
            <>
              <div className="search-radius-overlay large"></div>
              <div className="search-radius-overlay medium"></div>
            </>
          )}
          {/* Driver Status Card - Overlay on Map */}
          {overlayMessage && showDriverCard && (
            <div className="finding-provider-overlay-card">
              <div className="finding-provider-icon">
                {isDelivered ? <FaThumbsUp /> : <FaCar />}
              </div>
              <div className="finding-provider-content">
                <p className="finding-provider-text">{overlayMessage.text}</p>
                {overlayMessage.estimate && (
                  <p className="finding-provider-estimate">{overlayMessage.estimate}</p>
                )}
                {overlayMessage.showStars && (
                  <div className="d-flex gap-1 mt-2 feedback-stars-container">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <i 
                        key={star} 
                        className="bi bi-star-fill feedback-star"
                        onClick={() => {
                          // TODO: Handle feedback submission
                          console.log(`Rated ${star} stars`);
                        }}
                      ></i>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      
        <div className="map-labels-container">
          <div className="map-labels-row">
            {pickupLocation && (
              <div className="map-label-card">
                <div className="map-label-card-icon pickup-icon">
                  <i className="bi bi-shop"></i>
                </div>
                <div className="map-label-card-content">
                  <p className="map-label-card-title">
                    {order?.shop?.type === "restaurant" ? "Restaurant" : 
                     order?.shop?.type === "shop" ? "Store" : 
                     "Pickup"}
                  </p>
                  <p 
                    className="map-label-card-address map-label-address-link"
                    onClick={() => openGoogleMaps(pickupLocation.address)}
                  >
                    {pickupLocation.address}
                  </p>
                </div>
              </div>
            )}
            {deliveryLocation && (
              <div className="map-label-card">
                <div className="map-label-card-icon delivery-icon">
                  <i className="bi bi-house-fill"></i>
                </div>
                <div className="map-label-card-content">
                  <p className="map-label-card-title">Deliver to</p>
                  <p 
                    className="map-label-card-address map-label-address-link"
                    onClick={() => openGoogleMaps(deliveryLocation.address)}
                  >
                    {deliveryLocation.address}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
     
      {/* {showDriverCard && ( */}
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
                className="bi bi-person-circle profile-picture-fallback"
              ></i>
              </>
            ) : (
              <i className="bi bi-person-circle"></i>
            )}
          </div>
          <div className="finding-driver-text">
            <p className="finding-driver-title">Driver</p>
            <p className="finding-driver-subtitle">
              {hasProvider && provider
                ? `${provider.firstName} ${provider.lastName || ''}`.trim()
                : 'Searching for nearby drivers...'}
            </p>
          </div>
          <div className="finding-driver-arrow">
            <i className="bi bi-chevron-right"></i>
          </div>
        </div>
      {/* )} */}

      {/* Tip Box - Only show if tip hasn't been given */}
      {!order.tip && (
        <div className="tip-box-card">
          <div className="tip-box-header ">
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

      {/* Bottom Action Button */}

      {/* Order Details Section */}
      <div className="order-details-section">
        <div className="order-details-card">
          <div 
            className="order-details-title-header"
            onClick={() => setIsOrderDetailsOpen(!isOrderDetailsOpen)}
          >
            <h3 className="order-details-title d-flex align-items-center gap-2">
              {order?.shop?.type === "restaurant" ? (
                <GiKnifeFork className="order-details-icon" />
              ) : (
                <FaStore className="order-details-icon" />
              )}
              Order Details
            </h3>
            <div className="order-details-arrow">
              <i className={`bi bi-chevron-${isOrderDetailsOpen ? 'down' : 'right'}`}></i>
            </div>
          </div>
          
          {isOrderDetailsOpen && (
            <div className="order-details-content">
              {/* Order Items */}
              {order?.cart?.cartItems && order.cart.cartItems.length > 0 && (
            <div className="order-items-section">
              <h5 className="order-items-title">Items</h5>
              <div className="order-items-list">
                {order.cart.cartItems.map((item) => (
                  <div key={item.id} className="order-item-row">
                    <div className="order-item-info">
                      {item.product?.image && (
                        <img
                          src={getFileUrl(item.product.image)}
                          alt={item.product?.name || "Product"}
                          className="order-item-image"
                          onError={(e) => {
                            e.target.style.display = "none";
                          }}
                        />
                      )}
                      <div className="order-item-details">
                        <div className="order-item-name">
                          {item.product?.name || "N/A"}
                          {item.metadata?.selectedVariant && (
                            <span className="badge bg-success bg-opacity-10 text-success fw-medium ms-1" style={{ fontSize: '10px' }}>
                              {item.product?.variants?.optionName || 'Variant'}: {item.metadata.selectedVariant}
                            </span>
                          )}
                        </div>
                        <div className="order-item-quantity d-flex justify-content-between align-items-center text-sm">
                          <span className="text-[10px]">Quantity: {item.quantity}x</span>
                          <span>{(() => {
                            const sv = item.metadata?.selectedVariant;
                            if (sv && item.product?.variants?.items) {
                              const vi = item.product.variants.items.find(i => i.value === sv);
                              if (vi) return formatAmountToCurrency(vi.salePrice ?? vi.price);
                            }
                            return formatAmountToCurrency(item.product?.price || 0);
                          })()}</span>
                        </div>
                      </div>
                    </div>
                  
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Order Summary */}
          <div className="order-summary-section">
            <h5 className="order-summary-title">Summary</h5>
            <div className="order-summary-row">
              <span>Subtotal ({order?.cart?.cartItems?.reduce((sum, item) => sum + item.quantity, 0) || 0} items):</span>
              <span>{formatAmountToCurrency(parseFloat(order?.totalCartPrice || 0))}</span>
            </div>
            <div className="order-summary-row">
              <span>Delivery:</span>
              <span>FREE</span>
            </div>
            <div className="order-summary-row">
              <span>Service fee:</span>
              <span>{formatAmountToCurrency(parseFloat(order?.serviceFee || 2.50))}</span>
            </div>
            {order?.tip && (
              <div className="order-summary-row">
                <span>Tip:</span>
                <span>{formatAmountToCurrency(parseFloat(order.tip))}</span>
              </div>
            )}
            <hr className="order-summary-divider" />
            <div className="order-summary-row order-summary-total">
              <span>Total:</span>
              <span>{formatAmountToCurrency(
                parseFloat(order?.totalCartPrice || 0) + 
                parseFloat(order?.serviceFee || 2.50) + 
                parseFloat(order?.tip || 0)
              )}</span>
            </div>
            {order?.transaction?.cardBrand && order?.transaction?.lastFourDigit && (
                    <span className="d-inline-flex align-items-center gap-1 mt-2">
                      <CardBrandIcon brand={order.transaction.cardBrand} className="card-brand-icon" />
                      <span>•••• {order.transaction.lastFourDigit}</span>
                    </span>
                  )}
          </div>

          {/* Additional Order Information */}
          <div className="order-info-section">
            <h5 className="order-info-title">Order Information</h5>
            <div className="order-info-grid">
              <div className="order-info-item">
                    <strong className="d-flex align-items-center gap-2">
                      <i className="bi bi-calendar order-info-icon"></i>
                      Order Date:
                    </strong>
                <span className="fw-bold">{fullDateFormate(order?.createdAt)}</span>
              </div>
              {order?.createdAt && (
                <div className="order-info-item">
                    <strong className="d-flex align-items-center gap-2">
                      <i className="bi bi-clock order-info-icon"></i>
                      Order Time:
                    </strong>
                  <span className="fw-bold">{getTime(order.createdAt)}</span>
                </div>
              )}
              {order?.shopConfirmedAt && (
                <div className="order-info-item">
                    <strong className="d-flex align-items-center gap-2">
                      <i className="bi bi-check-circle order-info-icon"></i>
                      Confirmed At:
                    </strong>
                  <span>{fullDateFormate(order.shopConfirmedAt)}</span>
                </div>
              )}
            
             
              {order?.deliveryAddress && (
                <div className="order-info-item order-info-item-full">
                    <strong className="d-flex align-items-center gap-2">
                      <i className="bi bi-geo-alt order-info-icon"></i>
                      Delivery Address:
                    </strong>
                  <span className="fw-bold">{order.deliveryAddress}</span>
                </div>
              )}
              {order?.notes && (
                <div className="order-info-item order-info-item-full">
                  <strong>Notes:</strong>
                  <span>{order.notes}</span>
                </div>
              )}
            </div>
          </div>
            </div>
          )}
        </div>
      </div>

      {/* Add to Order Button - Only for restaurant and shop orders within 8 minutes of createdAt */}
      {order?.shop && (order.shop.type === "restaurant" || order.shop.type === "shop") &&
       (order?.status === "paid" || order?.status === "pending") && 
       order?.deliveryStatus !== 'delivered' && 
       order?.deliveryStatus !== 'cancelled' && 
       order?.status !== 'cancelled' &&
       timeRemaining !== null && timeRemaining > 0 && (
        <div className="add-to-order-button-container">
          <button
            onClick={() => {
              const shopType = order.shop.type;
              const addToOrderDeadline = new Date(order.createdAt).getTime() + (8 * 60 * 1000);

              if (typeof window !== "undefined") {
                localStorage.setItem(
                  ADD_TO_ORDER_CONTEXT_KEY,
                  JSON.stringify({
                    sourceOrderId: order.id,
                    shopId: order.shop.id,
                    shopType,
                    expiresAt: addToOrderDeadline,
                  })
                );
              }

              if (shopType === "restaurant") {
                router.push(`/restaurants/${order.shop.id}/menu`);
              } else if (shopType === "shop") {
                router.push(`/shops/${order.shop.id}/products`);
              }
            }}
            className="add-to-order-button"
          >
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            Add to Order • {Math.floor(timeRemaining / 60000).toString().padStart(2, '0')}:
            {Math.floor((timeRemaining % 60000) / 1000).toString().padStart(2, '0')}
          </button>
        </div>
      )}

      {(order?.deliveryStatus !== 'delivered' && 
        order?.deliveryStatus !== 'cancelled' && 
        order?.status !== 'cancelled') && (
        <div className="cancel-order-button-container">
          <button
            onClick={handleCancelOrder}
            disabled={isCancelling}
            className="cancel-order-button"
          >
            {isCancelling ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Cancelling...
              </>
            ) : (
              "Cancel Order"
            )}
          </button>
        </div>
      )}
      
      {/* Report Issue Link */}
      {order?.job && (
        <div className="flex justify-center w-full mt-2">
          <button
            onClick={() => setIsReportModalOpen(true)}
          >
     
            <span className="report-issue-text">Report an issue</span>
          </button>
        </div>
      )}
       </div>

      {/* Cancel Order Button */}
      

      {/* Cancel Confirmation Modal */}
      <ConfirmationDialog
        isOpen={isCancelModalOpen}
        onClose={handleCloseCancelModal}
        handleConfirm={handleConfirmCancel}
        alertMessage={"Are you sure you want to cancel this order?"}
      />

      {/* Report Issue Modal */}
      {order?.job && (
        <ReportIssueModal
          job={order.job}
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
        />
      )}
    
    </div>
  );
}
