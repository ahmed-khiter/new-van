"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import MapComponent from "@/components/MapComponent";
import { formatAmountToCurrency, fullDateFormate, getFileUrl, getTime } from "@/utils/helper";
import { 
  FaThumbsUp, 
  FaHandshake, 
  FaStore,
  FaTruck,
  FaBox
} from "react-icons/fa";

export default function TrackOrderPage() {
  const { id } = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isOrderDetailsOpen, setIsOrderDetailsOpen] = useState(false);
  const intervalRef = useRef(null);

  const fetchOrder = useCallback(async (showLoading = true) => {
    if (!session?.user?.id || !id) {
      return;
    }

    try {
      if (showLoading) setLoading(true);
      const response = await fetch(`/api/provider/orders/${id}`, {
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
        router.push("/provider/dashboard");
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
      return;
    }

    if (status === "unauthenticated" || !session) {
      router.push("/login");
      return;
    }

    if (session?.user?.id && id) {
      fetchOrder();

      intervalRef.current = setInterval(() => {
        fetchOrder(false);
      }, 5000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [id, session, status, fetchOrder]);

  const getOrderSteps = () => {
    const deliveryStatus = order?.deliveryStatus || "pending";
    const orderStatus = order?.status || "pending";
    const shopType = order?.shop?.type || "shop";

    const isOrderAssigned = deliveryStatus === "dispatched" || deliveryStatus === "assigned" ||
      deliveryStatus === "in-transit" || deliveryStatus === "delivered";
    const isPickedUp = deliveryStatus === "in-transit" || deliveryStatus === "delivered";
    const isOutForDelivery = deliveryStatus === "in-transit" || deliveryStatus === "delivered";
    const isOrderCompleted = deliveryStatus === "delivered";
    const isDriverAssigned = deliveryStatus === "assigned" || deliveryStatus === "dispatched";

    const pickupLabel = shopType === "restaurant"
      ? "Pick up from restaurant"
      : "Pick up from shop";

    return {
      steps: [
        {
          label: "Order assigned",
          completed: isOrderAssigned,
          active: !isOrderAssigned && orderStatus === "paid",
        },
        {
          label: pickupLabel,
          completed: isPickedUp,
          active: isDriverAssigned && !isPickedUp,
        },
        {
          label: "Out for delivery",
          completed: isOutForDelivery,
          active: deliveryStatus === "in-transit" && !isOrderCompleted,
        },
        {
          label: "Delivered",
          completed: isOrderCompleted,
          active: false,
        },
      ],
      shopType
    };
  };

  const getPickupLocation = () => {
    if (order?.job?.pickupLat && order?.job?.pickupLng) {
      return {
        lat: order.job.pickupLat,
        lng: order.job.pickupLng,
        address: order.shop?.address1 || order.job.pickupAddressLine1 || "Pickup Location",
      };
    }
    if (order?.shop?.latitude && order?.shop?.longitude) {
      return {
        lat: order.shop.latitude,
        lng: order.shop.longitude,
        address: order.shop.address1 || "Pickup Location",
      };
    }
    return null;
  };

  const getDeliveryLocation = () => {
    if (order?.job?.dropOffLat && order?.job?.dropOffLng) {
      return {
        lat: order.job.dropOffLat,
        lng: order.job.dropOffLng,
        address: order.deliveryAddress || order.job.dropOffAddressLine1 || "Delivery Location",
      };
    }
    if (order?.deliveryLat && order?.deliveryLng) {
      return {
        lat: order.deliveryLat,
        lng: order.deliveryLng,
        address: order.deliveryAddress || "Delivery Location",
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

  // Get step icons for orders
  const getStepIcons = (shopType) => {
    const iconStyle = { fontSize: "20px" };
    const pendingStyle = { fontSize: "20px", color: "#6c757d" };

    const stepIcons = {
      0: FaHandshake, // Order assigned
      1: shopType === "restaurant" ? FaStore : FaBox, // Pick up
      2: FaTruck, // Out for delivery
      3: FaThumbsUp, // Delivered
    };

    return { stepIcons, iconStyle, pendingStyle };
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
          <h1 className="order-tracking-title">Order Tracking</h1>
        </div>
        <div className="d-flex justify-content-center align-items-center" style={{ height: "400px" }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return null;
  }

  const { steps, shopType } = getOrderSteps();
  const pickupLocation = getPickupLocation();
  const deliveryLocation = getDeliveryLocation();
  const customer = order?.user;
  const { stepIcons, iconStyle, pendingStyle } = getStepIcons(shopType);
  const PickupStepIcon = stepIcons[1];
  const DeliveryStepIcon = stepIcons[2];

  const handleChat = () => {
    if (order?.chatId) {
      router.push(`/provider/chats?chatId=${order.chatId}`);
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
        <h1 className="order-tracking-title">Order Tracking</h1>
        <span className="order-tracking-id">SM-{order.id.substring(0, 6).toUpperCase()}</span>
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
              dropoffLocation={deliveryLocation}
              hide={{ dropoff: false, clear: true, tip: true }}
            />

            {/* Pickup Card - Overlay on Map */}
            {steps[1]?.active && PickupStepIcon && (
              <div className="finding-provider-overlay-card">
                <div className="finding-provider-icon">
                  <PickupStepIcon />
                </div>
                <div className="finding-provider-content">
                  <p className="finding-provider-text">
                    {shopType === "restaurant" ? "Pick up from restaurant" : "Pick up from shop"}
                  </p>
                  <p className="finding-provider-estimate">
                    {order?.shop?.name || "Pickup location"}
                  </p>
                </div>
              </div>
            )}

            {/* Out for Delivery Card - Overlay on Map */}
            {steps[2]?.active && DeliveryStepIcon && (
              <div className="finding-provider-overlay-card">
                <div className="finding-provider-icon">
                  <DeliveryStepIcon />
                </div>
                <div className="finding-provider-content">
                  <p className="finding-provider-text">Out for delivery</p>
                  {(() => {
                    const eta = new Date(Date.now() + 15 * 60000);
                    const hours = eta.getHours();
                    const minutes = eta.getMinutes().toString().padStart(2, '0');
                    const period = hours >= 12 ? 'pm' : 'am';
                    const etaTime = `${hours}:${minutes}${period}`;
                    return (
                      <p className="finding-provider-estimate">
                        Estimated delivery {etaTime}
                      </p>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>

          <div className="map-labels-container">
            <div className="map-labels-row">
              {pickupLocation && (
                <div className="map-label-card">
                  <div className="map-label-card-icon pickup-icon">
                    <i className="bi bi-geo-alt-fill"></i>
                  </div>
                  <div className="map-label-card-content">
                    <p className="map-label-card-title">Pickup Location</p>
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
              {deliveryLocation && (
                <div className="map-label-card">
                  <div className="map-label-card-icon delivery-icon">
                    <i className="bi bi-house-fill"></i>
                  </div>
                  <div className="map-label-card-content">
                    <p className="map-label-card-title">Delivery Location</p>
                    <p
                      className="map-label-card-address"
                      style={{ textDecoration: 'underline', cursor: 'pointer' }}
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
            {order?.chatId && (
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

        {/* Order Details Section */}
        <div className="order-details-section">
          <div className="order-details-card">
            <div
              className="order-details-title-header"
              onClick={() => setIsOrderDetailsOpen(!isOrderDetailsOpen)}
            >
              <h3 className="order-details-title d-flex align-items-center gap-2">
                <i className="bi bi-bag" style={{ fontSize: "18px", color: "#6c757d" }}></i>
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
                              <div className="order-item-name">{item.product?.name || "N/A"}</div>
                              <div className="order-item-qty">Qty: {item.quantity}</div>
                            </div>
                          </div>
                          <div className="order-item-price">
                            {formatAmountToCurrency(parseFloat(item.price || 0) * item.quantity)}
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
                    <span>{formatAmountToCurrency(parseFloat(order?.deliveryPrice || 0))}</span>
                  </div>
                  {order?.tip && (
                    <div className="order-summary-row">
                      <span>Tip:</span>
                      <span>{formatAmountToCurrency(parseFloat(order.tip))}</span>
                    </div>
                  )}
                  <hr className="order-summary-divider" />
                  <div className="order-summary-row order-summary-total">
                    <span className="fw-bold">Total:</span>
                    <span className="fw-bold">{formatAmountToCurrency(
                      parseFloat(order?.totalCartPrice || 0) +
                      parseFloat(order?.deliveryPrice || 0) +
                      parseFloat(order?.tip || 0)
                    )}</span>
                  </div>
                </div>

                {/* Additional Order Information */}
                <div className="order-info-section">
                  <h5 className="order-info-title">Order Information</h5>
                  <div className="order-info-grid">
                    <div className="order-info-item">
                      <strong className="d-flex align-items-center gap-2">
                        <i className="bi bi-calendar" style={{ fontSize: "14px", color: "#6c757d" }}></i>
                        Order Date:
                      </strong>
                      <span className="fw-bold">{fullDateFormate(order?.createdAt)}</span>
                    </div>
                    {order?.createdAt && (
                      <div className="order-info-item">
                        <strong className="d-flex align-items-center gap-2">
                          <i className="bi bi-clock" style={{ fontSize: "14px", color: "#6c757d" }}></i>
                          Order Time:
                        </strong>
                        <span className="fw-bold">{getTime(order.createdAt)}</span>
                      </div>
                    )}
                    <div className="order-info-item">
                      <strong>Payment Status:</strong>
                      <span className={`badge ${order?.status === 'paid' ? 'bg-success' :
                          order?.status === 'pending' ? 'bg-warning' :
                            'bg-secondary'
                        }`}>
                        {order?.status || 'N/A'}
                      </span>
                    </div>
                    {order?.deliveryStatus && (
                      <div className="order-info-item">
                        <strong>Delivery Status:</strong>
                        <span className={`badge ${order.deliveryStatus === 'delivered' ? 'bg-success' :
                            order.deliveryStatus === 'dispatched' ? 'bg-info' :
                              order.deliveryStatus === 'waiting_for_provider' ? 'bg-primary' :
                                order.deliveryStatus === 'ready_to_dispatch' ? 'bg-warning' :
                                  (order.deliveryStatus === 'assigned' || order.deliveryStatus === 'in-transit') ? 'bg-info' :
                                    order.deliveryStatus === 'cancelled' ? 'bg-danger' :
                                      'bg-secondary'
                          }`}>
                          {order.deliveryStatus.replace(/_/g, " ")}
                        </span>
                      </div>
                    )}
                    {order?.shop && (
                      <div className="order-info-item">
                        <strong>{shopType === "restaurant" ? "Restaurant:" : "Shop:"}</strong>
                        <span>{order.shop.name}</span>
                      </div>
                    )}
                    {customer && (
                      <div className="order-info-item">
                        <strong>Customer:</strong>
                        <span className="fw-bold">{customer.firstName} {customer.lastName}</span>
                      </div>
                    )}
                    {customer?.phone && (
                      <div className="order-info-item">
                        <strong>Customer Phone:</strong>
                        <span>{customer.phone}</span>
                      </div>
                    )}
                    {order?.deliveryAddress && (
                      <div className="order-info-item order-info-item-full">
                        <strong className="d-flex align-items-center gap-2">
                          <i className="bi bi-geo-alt" style={{ fontSize: "14px", color: "#6c757d" }}></i>
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
      </div>
    </div>
  );
}
