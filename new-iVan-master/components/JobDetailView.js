"use client";
import Map from "@/components/Map";
import ConfirmationModal from "@/components/Modals/ConfirmationModal";
import { useRouter } from "@/i18n/routing";
import {
    calculateTravelTime,
    CategoryIcon,
    checkDropOffDate,
    getStatusBadge,
    getTime,
    formatAmountToCurrency,
    getServiceName,
    formatDistanceByLocation,
    formatDistanceToNow,
} from "@/utils/helper";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import useSavedLocation from "@/lib/hooks/useSavedLocation";
import { BsFillArrowLeftSquareFill } from "react-icons/bs";
import { FiClock } from "react-icons/fi";
import FeedbackRating from "@/components/FeedbackRating";

const JobDetailView = ({ jobId, showAcceptButton = false, showPaymentButton = false, onBack }) => {
    const t = useTranslations("ProviderPages.jobDetails");
    const { data: session } = useSession();
    const { savedLocation } = useSavedLocation();
    const [acceptModal, setAcceptModal] = useState(false);
    const [job, setJob] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [processingPayment, setProcessingPayment] = useState(false);
    const [updatingStatus, setUpdatingStatus] = useState(false);
    const router = useRouter();

    const fetchJobDetail = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`/api/jobs/${jobId}`);
            if (!response.ok) throw new Error(t("toast_error_loading"));
            const data = await response.json();
            setJob(data?.job || null);
        } catch (error) {
            toast.error(error.message || t("toast_error_loading"));
        } finally {
            setIsLoading(false);
        }
    };

    // Update delivery status to "in-transit" (picked up)
    const handlePickupOrder = async (orderId) => {
        setUpdatingStatus(true);
        try {
            const response = await fetch(`/api/orders/${orderId}/delivery-status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'user-id': session.user.id,
                    'role': 'provider'
                },
                body: JSON.stringify({
                    status: 'in-transit'
                })
            });

            const data = await response.json();
            if (response.ok) {
                toast.success('Order picked up! Out for delivery.');
                fetchJobDetail(); // Refresh job data
            } else {
                toast.error(data.message || 'Failed to update status');
            }
        } catch (error) {
            console.error('Error updating status:', error);
            toast.error('An error occurred');
        } finally {
            setUpdatingStatus(false);
        }
    };

    // Update delivery status to "delivered"
    const handleDeliverOrder = async (orderId) => {
        setUpdatingStatus(true);
        try {
            const response = await fetch(`/api/orders/${orderId}/delivery-status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'user-id': session.user.id,
                    'role': 'provider'
                },
                body: JSON.stringify({
                    status: 'delivered'
                })
            });

            const data = await response.json();
            if (response.ok) {
                toast.success('Order delivered successfully!');
                fetchJobDetail(); // Refresh job data
            } else {
                toast.error(data.message || 'Failed to update status');
            }
        } catch (error) {
            console.error('Error updating status:', error);
            toast.error('An error occurred');
        } finally {
            setUpdatingStatus(false);
        }
    };

    useEffect(() => {
        if (jobId) {
            fetchJobDetail();
        }
    }, [jobId]);

    const handleConfirmAccept = async () => {
        setAcceptModal(false);
        try {
            const response = await fetch(`/api/jobs/accept`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: jobId }),
            });

            const data = await response.json();

            // Check success status from API response
            if (!data.success) {
                // Handle service not approved - redirect to verification
                if (data?.data?.serviceApproved === false && data?.data?.category) {
                    toast.error(data.message);
                    router.push(`/provider/settings?verifications=true&category=${encodeURIComponent(data.data.category)}`);
                    return;
                }

                // Handle subscription cancelled - redirect to pricing
                if (data?.data?.subscriptionCancelled) {
                    toast.error(data.message);
                    router.push('/provider/pricing');
                    return;
                }

                // Handle subscription required - redirect to pricing
                if (data?.data?.subscriptionRequired) {
                    toast.error(data.message);
                    router.push('/provider/pricing');
                    return;
                }

                // Handle account suspended
                if (data?.data?.accountSuspended) {
                    toast.error(data.message);
                    return;
                }

                // Other errors
                toast.error(data.message || t("toast_accept_failed"));
                return;
            }

            // Success - show message and navigate
            toast.success(data.message || t("toast_accept_success"));
            if (onBack) {
                onBack();
            } else {
                router.back();
            }
        } catch (error) {
            console.error('Error accepting job:', error);
            toast.error(error.message || t("toast_accept_failed"));
        }
    };

    const handlePayment = async () => {
        setProcessingPayment(true);
        try {
            const response = await fetch("/api/jobs/payment-session", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ jobId: jobId }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to create payment session");
            }

            const data = await response.json();
            if (data.paymentUrl) {
                window.location.href = data.paymentUrl;
            }
        } catch (error) {
            toast.error(error.message || "Failed to process payment");
        } finally {
            setProcessingPayment(false);
        }
    };

    const renderCategorySpecificFields = () => {
        if (!job) return null;

        const fields = [];

        // Van, restaurant, and shop specific fields (all delivery jobs)
        if (job.category === "Van" || job.category === "restaurant" || job.category === "shop") {
            if (job.vanSize) {
                fields.push(
                    <div key="vanSize" className="flex flex-col justify-center items-start w-full sm:min-w-[200px] sm:max-w-[300px] mb-3">
                        <span className="font-semibold text-sm sm:text-base">Van Size:</span>
                        <span className="text-gray-600 text-sm sm:text-base">{job.vanSize}</span>
                    </div>
                );
            }
            if (job.movingItem) {
                fields.push(
                    <div key="movingItem" className="flex flex-col justify-center items-start w-full sm:min-w-[200px] sm:max-w-[300px] mb-3">
                        <span className="font-semibold text-sm sm:text-base">Moving Item:</span>
                        <span className="text-gray-600 text-sm sm:text-base">{job.movingItem}</span>
                    </div>
                );
            }
            if (job.isHelpLoading !== null && job.isHelpLoading !== undefined) {
                fields.push(
                    <div key="helpLoading" className="flex flex-col justify-center items-start w-full sm:min-w-[200px] sm:max-w-[300px] mb-3">
                        <span className="font-semibold text-sm sm:text-base">Help Loading:</span>
                        <span className="text-gray-600 text-sm sm:text-base">{job.isHelpLoading ? "Yes" : "No"}</span>
                    </div>
                );
            }
            if (job.isTwoMenRequired !== null && job.isTwoMenRequired !== undefined) {
                fields.push(
                    <div key="twoMen" className="flex flex-col justify-center items-start w-full sm:min-w-[200px] sm:max-w-[300px] mb-3">
                        <span className="font-semibold text-sm sm:text-base">Two Men Required:</span>
                        <span className="text-gray-600 text-sm sm:text-base">{job.isTwoMenRequired ? "Yes" : "No"}</span>
                    </div>
                );
            }
        }

        // Recovery/Car Key specific fields
        if (job.category === "Recovery" || job.category === "Car Key Replacement") {
            if (job.make) {
                fields.push(
                    <div key="make" className="flex flex-col justify-center items-start w-full sm:min-w-[200px] sm:max-w-[300px] mb-3">
                        <span className="font-semibold text-sm sm:text-base">Car Make:</span>
                        <span className="text-gray-600 text-sm sm:text-base">{job.make}</span>
                    </div>
                );
            }
            if (job.model) {
                fields.push(
                    <div key="model" className="flex flex-col justify-center items-start w-full sm:min-w-[200px] sm:max-w-[300px] mb-3">
                        <span className="font-semibold text-sm sm:text-base">Car Model:</span>
                        <span className="text-gray-600 text-sm sm:text-base">{job.model}</span>
                    </div>
                );
            }
            if (job.year) {
                fields.push(
                    <div key="year" className="flex flex-col justify-center items-start w-full sm:min-w-[200px] sm:max-w-[300px] mb-3">
                        <span className="font-semibold text-sm sm:text-base">Car Year:</span>
                        <span className="text-gray-600 text-sm sm:text-base">{job.year}</span>
                    </div>
                );
            }
            if (job.doesCarTurnOn !== null && job.doesCarTurnOn !== undefined) {
                fields.push(
                    <div key="carTurnOn" className="flex flex-col justify-center items-start w-full sm:min-w-[200px] sm:max-w-[300px] mb-3">
                        <span className="font-semibold text-sm sm:text-base">Does Car Turn On:</span>
                        <span className="text-gray-600 text-sm sm:text-base">{job.doesCarTurnOn ? "Yes" : "No"}</span>
                    </div>
                );
            }
            if (job.hasLogBook !== null && job.hasLogBook !== undefined) {
                fields.push(
                    <div key="logBook" className="flex flex-col justify-center items-start w-full sm:min-w-[200px] sm:max-w-[300px] mb-3">
                        <span className="font-semibold text-sm sm:text-base">Has Log Book:</span>
                        <span className="text-gray-600 text-sm sm:text-base">{job.hasLogBook ? "Yes" : "No"}</span>
                    </div>
                );
            }
            if (job.hasCarKey !== null && job.hasCarKey !== undefined) {
                fields.push(
                    <div key="carKey" className="flex flex-col justify-center items-start w-full sm:min-w-[200px] sm:max-w-[300px] mb-3">
                        <span className="font-semibold text-sm sm:text-base">Has Car Key:</span>
                        <span className="text-gray-600 text-sm sm:text-base">{job.hasCarKey ? "Yes" : "No"}</span>
                    </div>
                );
            }
        }

        // Cleaning specific fields
        if (job.category === "Cleaning") {
            if (job.howManyRooms) {
                fields.push(
                    <div key="rooms" className="flex flex-col justify-center items-start w-full sm:min-w-[200px] sm:max-w-[300px] mb-3">
                        <span className="font-semibold text-sm sm:text-base">Number of Rooms:</span>
                        <span className="text-gray-600 text-sm sm:text-base">{job.howManyRooms}</span>
                    </div>
                );
            }
            if (job.howManyHours) {
                fields.push(
                    <div key="hours" className="flex flex-col justify-center items-start w-full sm:min-w-[200px] sm:max-w-[300px] mb-3">
                        <span className="font-semibold text-sm sm:text-base">Number of Hours:</span>
                        <span className="text-gray-600 text-sm sm:text-base">{job.howManyHours}</span>
                    </div>
                );
            }
            if (job.typeOfPlace) {
                fields.push(
                    <div key="typeOfPlace" className="flex flex-col justify-center items-start w-full sm:min-w-[200px] sm:max-w-[300px] mb-3">
                        <span className="font-semibold text-sm sm:text-base">Type of Place:</span>
                        <span className="text-gray-600 text-sm sm:text-base">{job.typeOfPlace}</span>
                    </div>
                );
            }
            if (job.hasCleaningProducts !== null && job.hasCleaningProducts !== undefined) {
                fields.push(
                    <div key="cleaningProducts" className="flex flex-col justify-center items-start w-full sm:min-w-[200px] sm:max-w-[300px] mb-3">
                        <span className="font-semibold text-sm sm:text-base">Has Cleaning Products:</span>
                        <span className="text-gray-600 text-sm sm:text-base">{job.hasCleaningProducts ? "Yes" : "No"}</span>
                    </div>
                );
            }
        }

        // Locksmith specific fields
        if (job.category === "Locksmith") {
            if (job.typeOfKey) {
                fields.push(
                    <div key="typeOfKey" className="flex flex-col justify-center items-start w-full sm:min-w-[200px] sm:max-w-[300px] mb-3">
                        <span className="font-semibold text-sm sm:text-base">Type of Key:</span>
                        <span className="text-gray-600 text-sm sm:text-base">{job.typeOfKey}</span>
                    </div>
                );
            }
            if (job.typeOfLock) {
                fields.push(
                    <div key="typeOfLock" className="flex flex-col justify-center items-start w-full sm:min-w-[200px] sm:max-w-[300px] mb-3">
                        <span className="font-semibold text-sm sm:text-base">Type of Lock:</span>
                        <span className="text-gray-600 text-sm sm:text-base">{job.typeOfLock}</span>
                    </div>
                );
            }
        }

        // Removals specific fields
        if (job.category === "Removals") {
            if (job.howManyItems) {
                fields.push(
                    <div key="howManyItems" className="flex flex-col justify-center items-start w-full sm:min-w-[200px] sm:max-w-[300px] mb-3">
                        <span className="font-semibold text-sm sm:text-base">Number of Items:</span>
                        <span className="text-gray-600 text-sm sm:text-base">{job.howManyItems}</span>
                    </div>
                );
            }
        }

        // Click & Collect specific fields - Store name first as requested
        if (job.category === "Click & Collect") {
            if (job.storeName) {
                fields.push(
                    <div key="storeName" className="flex flex-col justify-center items-start w-full sm:min-w-[200px] sm:max-w-[300px] mb-3">
                        <span className="font-semibold text-sm sm:text-base">Store Name:</span>
                        <span className="text-gray-600 text-sm sm:text-base">{job.storeName}</span>
                    </div>
                );
            }
            if (job.clickAndCollectIdNumber) {
                fields.push(
                    <div key="clickAndCollectId" className="flex flex-col justify-center items-start w-full sm:min-w-[200px] sm:max-w-[300px] mb-3">
                        <span className="font-semibold text-sm sm:text-base">Click & Collect ID Number:</span>
                        <span className="text-gray-600 text-sm sm:text-base">{job.clickAndCollectIdNumber}</span>
                    </div>
                );
            }
            if (job.yourName) {
                fields.push(
                    <div key="yourName" className="flex flex-col justify-center items-start w-full sm:min-w-[200px] sm:max-w-[300px] mb-3">
                        <span className="font-semibold text-sm sm:text-base">Your Name:</span>
                        <span className="text-gray-600 text-sm sm:text-base">{job.yourName}</span>
                    </div>
                );
            }
            if (job.contactNumber) {
                fields.push(
                    <div key="contactNumber" className="flex flex-col justify-center items-start w-full sm:min-w-[200px] sm:max-w-[300px] mb-3">
                        <span className="font-semibold text-sm sm:text-base">Contact Number:</span>
                        <span className="text-gray-600 text-sm sm:text-base">{job.contactNumber}</span>
                    </div>
                );
            }
        }

        return fields;
    };

    const renderLuggageBookingDetails = () => {
        if (!job?.notes || job?.category !== "Luggage Storage") return null;

        try {
            const luggageData = JSON.parse(job.notes);
            
            if (luggageData.type !== 'luggage') return null;

            // Handle both correct field name and typo "Luggageltems"
            const items = luggageData.luggageItems || luggageData.Luggageltems || [];

            return (
                <div className="flex flex-col justify-center items-start w-full text-sm sm:text-base font-normal min-h-[5em] text-left pt-6 sm:pt-8 border-t-2 border-gray-300 mb-6 sm:mb-8">
                    <h5 className="text-sm sm:text-base font-semibold mb-4">
                        Luggage Booking Details:
                    </h5>
                    
                    {/* Items Section */}
                    {items && items.length > 0 && (
                        <div className="w-full mb-4">
                            <h6 className="text-sm font-semibold text-gray-700 mb-2">Items:</h6>
                            <div className="space-y-2">
                                {items.map((item, index) => (
                                    <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded-md">
                                        <span className="text-sm text-gray-800">
                                            {item.name} × {item.quantity}
                                        </span>
                                        <span className="text-sm font-semibold text-gray-700">
                                            {formatAmountToCurrency(item.price * item.quantity)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Location Section */}
                    {luggageData.locationName && (
                        <div className="w-full mb-4">
                            <h6 className="text-sm font-semibold text-gray-700 mb-2">Storage Location:</h6>
                            <p className="text-sm text-gray-800">{luggageData.locationName}</p>
                        </div>
                    )}

                    {/* Delivery Method */}
                    {luggageData.deliveryMethod && (
                        <div className="w-full mb-4">
                            <h6 className="text-sm font-semibold text-gray-700 mb-2">Delivery Method:</h6>
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-md text-sm font-medium">
                                <i className="bi bi-truck"></i>
                                {luggageData.deliveryMethod === 'dropoff' ? 'Drop Off at Location' : 
                                 luggageData.deliveryMethod === 'collection' ? 'Home Collection' : 
                                 luggageData.deliveryMethod}
                            </span>
                        </div>
                    )}

                    {/* Customer Location */}
                    {luggageData.customerLocation && (
                        <div className="w-full mb-4">
                            <h6 className="text-sm font-semibold text-gray-700 mb-2">Customer Location:</h6>
                            <p className="text-sm text-gray-800">
                                {luggageData.customerLocation.address}
                                {luggageData.customerLocation.city && `, ${luggageData.customerLocation.city}`}
                                {luggageData.customerLocation.postCode && ` ${luggageData.customerLocation.postCode}`}
                            </p>
                        </div>
                    )}
                </div>
            );
        } catch (error) {
            // If parsing fails, fall back to displaying raw notes
            return null;
        }
    };

    const renderDryCleaningBookingDetails = () => {
        if (!job?.notes || job?.category !== "Dry Cleaning Pick-Up") return null;

        try {
            const cleaningData = JSON.parse(job.notes);
            
            if (cleaningData.type !== 'cleaning') return null;

            // Handle both correct field name and typo "Luggageltems"
            const items = cleaningData.luggageItems || cleaningData.Luggageltems || [];

            return (
                <div className="flex flex-col justify-center items-start w-full text-sm sm:text-base font-normal min-h-[5em] text-left pt-6 sm:pt-8 border-t-2 border-gray-300 mb-6 sm:mb-8">
                    <h5 className="text-sm sm:text-base font-semibold mb-4">
                        Dry Cleaning Details:
                    </h5>
                    
                    {/* Items Section */}
                    {items && items.length > 0 && (
                        <div className="w-full mb-4">
                            <h6 className="text-sm font-semibold text-gray-700 mb-2">Items:</h6>
                            <div className="space-y-2">
                                {items.map((item, index) => (
                                    <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded-md">
                                        <span className="text-sm text-gray-800">
                                            {item.name} × {item.quantity}
                                        </span>
                                        <span className="text-sm font-semibold text-gray-700">
                                            {formatAmountToCurrency(item.price * item.quantity)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Location Section - Handle both field name variations */}
                    {(cleaningData.locationName || cleaningData.LocationName) && (
                        <div className="w-full mb-4">
                            <h6 className="text-sm font-semibold text-gray-700 mb-2">Service Location:</h6>
                            <p className="text-sm text-gray-800">{cleaningData.locationName || cleaningData.LocationName}</p>
                        </div>
                    )}

                    {/* Delivery Method - Handle both field name variations */}
                    {(cleaningData.deliveryMethod || cleaningData.DeliveryMethod) && (() => {
                        const deliveryMethod = (cleaningData.deliveryMethod || cleaningData.DeliveryMethod || '').toLowerCase();
                        const displayMethod = deliveryMethod === 'dropoff' ? 'Drop Off at Location' : 
                                             deliveryMethod === 'collection' ? 'Home Collection' : 
                                             (cleaningData.deliveryMethod || cleaningData.DeliveryMethod);
                        return (
                            <div className="w-full mb-4">
                                <h6 className="text-sm font-semibold text-gray-700 mb-2">Delivery Method:</h6>
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-md text-sm font-medium">
                                    <i className="bi bi-truck"></i>
                                    {displayMethod}
                                </span>
                            </div>
                        );
                    })()}

                    {/* Customer Location - Handle both field name variations */}
                    {(cleaningData.customerLocation || cleaningData.CustomerLoc) && (() => {
                        const customerLoc = cleaningData.customerLocation || cleaningData.CustomerLoc;
                        const address = customerLoc.address || customerLoc.Address || '';
                        const city = customerLoc.city || customerLoc.City || '';
                        const postCode = customerLoc.postCode || customerLoc.PostCode || '';
                        return (
                            <div className="w-full mb-4">
                                <h6 className="text-sm font-semibold text-gray-700 mb-2">Customer Location:</h6>
                                <p className="text-sm text-gray-800">
                                    {address}
                                    {city && `, ${city}`}
                                    {postCode && ` ${postCode}`}
                                </p>
                            </div>
                        );
                    })()}
                </div>
            );
        } catch (error) {
            // If parsing fails, fall back to displaying raw notes
            return null;
        }
    };

    return (
      <>
        <div className="flex flex-col justify-center p-3 sm:p-4 bg-white text-black text-center transition-all duration-300 relative h-[90%]">
          {/* Mobile-first responsive header */}
          <div className="flex   justify-between sm:justify-start  items-center   gap-2 sm:gap-0 pb-3">
            {/* Back button and title row */}
            <div className="flex justify-start items-center ">
              <BsFillArrowLeftSquareFill
                onClick={onBack || (() => router.back())}
                size={25}
                className="cursor-pointer flex-shrink-0"
              />
              <span className="flex justify-start items-center w-full text-base sm:text-lg font-semibold h-8 ml-2 sm:ml-4">
                Job Details
              </span>
            </div>

            {/* Status and action buttons - responsive layout */}
            <div className="flex  items-center  gap-2  ">
              {job?.status && (
                <div className="flex-shrink-0">
                  {getStatusBadge(job.status, showAcceptButton)}
                </div>
              )}
              {showAcceptButton &&
                job?.status === "active" &&
                session?.user?.role === "provider" && (
                  <button
                    className="flex justify-center items-center py-1 px-2 rounded-2 bg-blue-500 text-white text-sm font-semibold  shadow hover:bg-green-600 transition touch-manipulation flex-shrink-0"
                    onClick={() => setAcceptModal(true)}
                  >
                    Accept Job
                  </button>
                )}
              {showPaymentButton &&
                job?.status === "draft" &&
                session?.user?.role === "visitor" && (
                  <button
                    className="py-1 px-2 flex justify-center items-center flex-shrink-0 bg-green-600 text-white text-sm font-semibold rounded-2 shadow hover:bg-green-700 transition touch-manipulation"
                    onClick={handlePayment}
                    disabled={processingPayment}
                  >
                    {processingPayment ? (
                      <>
                        <div
                          className="spinner-border spinner-border-sm me-2 "
                          role="status"
                        >
                          <span className="visually-hidden">Loading...</span>
                        </div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-credit-card me-2"></i>
                        Pay Now
                      </>
                    )}
                  </button>
                )}
            </div>
          </div>

          {isLoading ? (
            <div className="flex flex-col justify-center items-center w-full h-64">
              <div
                className="spinner-border text-primary"
                style={{ width: "3rem", height: "3rem" }}
                role="status"
              >
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-3 text-gray-600">Loading job details...</p>
            </div>
          ) : job ? (
            <div className="flex flex-col justify-start items-start w-full mt-2 sm:mt-4 overflow-auto">
              <div className="flex flex-col w-full gap-4">
                {/* Main job info */}
                <div className="flex-1 text-left">
                  <span className="font-semibold capitalize text-left block text-lg sm:text-xl">
                    {job?.title}
                  </span>
                  {/* <div className="flex items-center gap-2 text-gray-500 text-sm sm:text-base mt-2">
                    <CategoryIcon
                      className="w-4 h-4"
                      category={job?.category}
                    />
                    {getServiceName(job.category)}
                  </div> */}

                  {/* Payment */}
                  <div className="flex flex-row w-full">
                    <div className="flex flex-col justify-center items-start w-full my-3">
                      {/* <span className="font-semibold text-sm sm:text-base">
                        Payment
                      </span> */}
                      <h6 className="w-auto text-xs sm:text-sm px-4 sm:px-8 my-2 no-underline bg-[#FEC601] rounded-full py-1 sm:py-2 font-semibold">
                        {job?.paymentTime} Payment -{" "}
                        {job?.price ? formatAmountToCurrency(job.price) : "N/A"}
                      </h6>
                    </div>
                  </div>

                  {/* Require Urgent - Show for all jobs */}
                  {job?.requireUrgent !== null && job?.requireUrgent !== undefined && (
                    <div className="flex flex-col justify-center items-start w-full sm:min-w-[200px] sm:max-w-[300px] mb-3">
                      <span className="font-semibold text-sm sm:text-base">Require Urgent Service:</span>
                      <span className={`text-sm sm:text-base font-semibold ${job.requireUrgent ? 'text-red-600' : 'text-gray-600'}`}>
                        {job.requireUrgent ? "Yes" : "No"}
                      </span>
                    </div>
                  )}

                  {/* Job ID + Time */}
                  <div className="flex justify-between w-full items-center mb-3 pt-3 border-t-2 border-gray-300">
                    <span className="flex items-center text-xs sm:text-sm font-medium text-gray-500">
                      <FiClock className="mr-2" size={15} color="grey" />
                      {formatDistanceToNow(job.createdAt)}
                    </span>
                  </div>

                  {/* Category-specific fields */}
                  <div className="mt-4 flex flex-col sm:flex-row sm:flex-wrap gap-3 sm:gap-4">
                    {renderCategorySpecificFields()}
                  </div>
                </div>
              </div>

              {/* Luggage Booking Details - Formatted */}
              {renderLuggageBookingDetails()}

              {/* Dry Cleaning Booking Details - Formatted */}
              {renderDryCleaningBookingDetails()}

              {/* Notes - Only show if not a luggage/dry cleaning booking or if parsing failed */}
              {job?.notes && job?.category !== "Luggage Storage" && job?.category !== "Dry Cleaning Pick-Up" && (
                <div className="flex flex-col justify-center items-start w-full text-sm sm:text-base font-normal min-h-[5em] text-left pt-6 sm:pt-8 border-t-2 border-gray-300 mb-6 sm:mb-8">
                  <h5 className="text-sm sm:text-base font-semibold mb-2">
                    Job Description:
                  </h5>
                  <span className="capitalize text-sm sm:text-base">
                    {job?.notes}
                  </span>
                </div>
              )}

              {/* Distance - Hide for luggage storage and dry cleaning with drop off delivery method */}
            

              {/* Feedback Rating for Completed Jobs */}
              {job?.status === "completed" && (
                <div className="flex flex-col justify-center items-start w-full text-sm sm:text-base font-normal min-h-[5em] text-left pt-6 sm:pt-8 border-t-2 border-gray-300 mb-6 sm:mb-8">
                  <h5 className="text-sm sm:text-base font-semibold mb-2">
                    Customer Feedback:
                  </h5>
                  <FeedbackRating
                    jobId={jobId}
                    size="md"
                    className="justify-start"
                    showAverage={false}
                    showCount={false}
                    showDetailed={session?.user?.role === "admin"}
                  />
                </div>
              )}

              {/* Location Details - Mobile-first responsive layout */}
              <div className="w-full mt-2">
                {/* Show single blur message if job not accepted */}
                {job?.acceptedById === null &&
                  session?.user?.role === "provider" && (
                    <div className="w-full mb-4 p-3 sm:p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-yellow-800 text-center font-medium text-sm sm:text-base">
                        {t("locations_blurred_until_accept")}
                      </p>
                    </div>
                  )}

                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3  sm:gap-6">
                  {/* Pickup Details */}
                  <div className="flex flex-col justify-center items-start w-full mb-4">
                    <div className="flex items-center mb-2 gap-1.5">
                      <span>📍</span>
                      <span className="font-semibold text-gray-900 text-sm sm:text-base">
                        {(() => {
                          // Categories that use "Job Location": Locksmith, Car Key Replacement, Cleaning
                          const jobLocationCategories = ["Locksmith", "Car Key Replacement", "Cleaning", 'Removals'];
                          return jobLocationCategories.includes(job?.category)
                            ? t("job_location")
                            : t("pickup_location");
                        })()}
                      </span>
                    </div>
                    <div className="flex flex-col justify-center items-start w-full font-medium">
                          <span className="text-sm sm:text-base">
                            {job?.latestPickupTime && job?.earliestPickupTime
                              ? `Between ${getTime(
                                  job?.earliestPickupTime,
                                  t
                                )} - ${getTime(job?.latestPickupTime, t)}`
                              : job?.pickupFixedTime
                              ? `At ${getTime(job?.pickupFixedTime, t)}`
                              : "Time TBD"}
                          </span>

                      <h6 className="text-sm sm:text-base font-semibold text-gray-800">
                        Date:{" "}
                        <span className="font-normal">
                          {checkDropOffDate(job?.pickupDate)}
                        </span>
                      </h6>

                      {job?.acceptedById === null &&
                        session?.user?.role === "provider" && (
                          <span className="font-bold text-xs sm:text-sm">
                            Postcode: {job?.pickupPostCode?.toUpperCase()}
                          </span>
                        )}

                      {/* Address details - blurred if not accepted and user is provider */}
                      <div
                        className={`flex flex-col justify-start items-start w-full mt-3 text-left text-sm sm:text-base ${
                          job?.acceptedById !== null ||
                          session?.user?.role !== "provider"
                            ? ""
                            : "blur-sm"
                        }`}
                      >
                        {job?.acceptedById !== null ||
                        session?.user?.role !== "provider" ? (
                          <>
                            <span>{job?.pickupAddressLine1}</span>
                            {job?.pickupAddressLine2 && (
                              <span>{job?.pickupAddressLine2}</span>
                            )}
                            <span>{job?.pickupCity}</span>
                            <span>{job?.pickupPostCode?.toUpperCase()}</span>
                          </>
                        ) : (
                          <>
                            <span>Address Line 1</span>
                            <span>Address Line 2</span>
                            <span>City</span>
                            <span>POSTCODE</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  {(() => {
                // Categories that should always hide distance
                const categoriesToHideDistance = [
                  "Locksmith",
                  "Mobile key replacement",
                  "Cleaning",
                  "Rubbish removals"
                ];
                
                // Check if category should hide distance
                if (categoriesToHideDistance.includes(job?.category)) {
                  return null;
                }
                
                // Check if this is a luggage storage or dry cleaning job with drop off delivery method
                if ((job?.category === "Luggage Storage" || job?.category === "Dry Cleaning Pick-Up") && job?.notes) {
                  try {
                    const bookingData = JSON.parse(job.notes);
                    
                    // Check for luggage storage
                    if (job.category === "Luggage Storage" && bookingData.type === 'luggage' && bookingData.deliveryMethod === 'dropoff') {
                      return null;
                    }
                    
                    // Check for dry cleaning - handle both field name variations
                    if (job.category === "Dry Cleaning Pick-Up" && bookingData.type === 'cleaning') {
                      const deliveryMethod = (bookingData.deliveryMethod || bookingData.DeliveryMethod || '').toLowerCase();
                      if (deliveryMethod === 'dropoff') {
                        return null;
                      }
                    }
                  } catch (error) {
                    // If parsing fails, show distance as normal
                  }
                }
                
                return (
                  <div className="flex flex-col justify-center items-start w-full text-sm sm:text-base font-normal min-h-[5em] text-left  mb-6 ">
                    <h5 className="text-sm sm:text-base font-semibold mb-2">
                      Distance:
                    </h5>
                    <div className="flex justify-center items-center h-8 sm:h-7 px-3 sm:px-4 rounded-full bg-pink-700 text-white text-xs sm:text-sm font-semibold">
                      <span>
                        {formatDistanceByLocation(job?.distance, savedLocation)} -{" "}
                        {calculateTravelTime(job?.distance)}
                      </span>
                    </div>
                  </div>
                );
              })()}
                  {/* Dropoff Details - Only show if dropoff exists */}
                  {job?.dropOffDate !== null &&
                    ["Van", "Recovery", "Click & Collect"].includes(
                      job?.category
                    ) && (
                      <div className="flex flex-col justify-center items-start w-full mb-4">
                        <div className="flex items-center mb-2 gap-1.5">
                          <span>🏁</span>
                          <span className="font-semibold text-gray-900 text-sm sm:text-base">
                            {t("dropoff_location")}
                          </span>
                        </div>
                        <div className="flex flex-col justify-center items-start w-full font-medium">
                          <span className="text-sm sm:text-base">
                            {job?.latestDropOffTime && job?.earliestDropOffTime
                              ? `Between ${getTime(
                                  job?.earliestDropOffTime,
                                  t
                                )} - ${getTime(job?.latestDropOffTime, t)}`
                              : job?.dropOffFixedTime
                              ? `At ${getTime(job?.dropOffFixedTime, t)}`
                              : "Time TBD"}
                          </span>
                          <h6 className="text-sm sm:text-base font-semibold text-gray-800">
                            Date:{" "}
                            <span className="font-normal">
                              {checkDropOffDate(job?.dropOffDate)}
                            </span>
                          </h6>

                          {job?.acceptedById === null &&
                            session?.user?.role === "provider" && (
                              <span className="font-bold text-xs sm:text-sm">
                                Postcode: {job?.dropOffPostCode?.toUpperCase()}
                              </span>
                            )}

                          {/* Address details - blurred if not accepted and user is provider */}
                          <div
                            className={`flex flex-col justify-start items-start w-full mt-3 text-left text-sm sm:text-base ${
                              job?.acceptedById !== null ||
                              session?.user?.role !== "provider"
                                ? ""
                                : "blur-sm"
                            }`}
                          >
                            {job?.acceptedById !== null ||
                            session?.user?.role !== "provider" ? (
                              <>
                                <span>{job?.dropOffAddressLine1}</span>
                                {job?.dropOffAddressLine2 && (
                                  <span>{job?.dropOffAddressLine2}</span>
                                )}
                                <span>{job?.dropOffCity}</span>
                                <span>
                                  {job?.dropOffPostCode?.toUpperCase()}
                                </span>
                              </>
                            ) : (
                              <>
                                <span>Address Line 1</span>
                                <span>Address Line 2</span>
                                <span>City</span>
                                <span>POSTCODE</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                      
                </div>
              </div>

              {/* Single Map showing both locations - Mobile responsive */}
              <div
                className={`w-full mt-4 sm:mt-6 ${
                  job?.acceptedById !== null ||
                  session?.user?.role !== "provider"
                    ? ""
                    : "blur-sm"
                }`}
              >
                <div className="w-full h-64 sm:h-80 md:h-96 rounded-lg overflow-hidden">
                  <Map
                    pickupPostCode={job?.pickupPostCode}
                    pickupLat={job?.pickupLat}
                    pickupLng={job?.pickupLng}
                    pickupAddress={job?.pickupAddressLine1}
                    pickupCity={job?.pickupCity}
                    dropOffPostCode={job?.dropOffPostCode}
                    dropOffLat={job?.dropOffLat}
                    dropOffLng={job?.dropOffLng}
                    dropOffAddress={job?.dropOffAddressLine1}
                    dropOffCity={job?.dropOffCity}
                    showBoth={
                      job?.dropOffDate !== null &&
                      ["Van", "Recovery", "Click & Collect"].includes(
                        job?.category
                      )
                    }
                  />
                </div>
              </div>

              {/* Delivery Status Section - Only show for delivery orders */}
              {job?.deliveryOrder && session?.user?.role === "provider" && job?.acceptedById === parseInt(session?.user?.id) && (
                <div className="flex flex-col justify-start items-start w-full mt-4 sm:mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <h5 className="text-sm sm:text-base font-semibold mb-3 text-gray-800">
                    Delivery Status
                  </h5>
                  
                  {/* Current Status */}
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-sm text-gray-600">Current Status:</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      job.deliveryOrder.deliveryStatus === 'dispatched' ? 'bg-blue-100 text-blue-700' :
                      job.deliveryOrder.deliveryStatus === 'in-transit' ? 'bg-yellow-100 text-yellow-700' :
                      job.deliveryOrder.deliveryStatus === 'delivered' ? 'bg-green-100 text-green-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {job.deliveryOrder.deliveryStatus?.replace('-', ' ').toUpperCase() || 'PENDING'}
                    </span>
                  </div>

                  {/* Shop/Restaurant Info */}
                  {job.deliveryOrder.shop && (
                    <div className="mb-4 text-sm">
                      <span className="text-gray-600">Pickup from: </span>
                      <span className="font-semibold">{job.deliveryOrder.shop.name}</span>
                      {job.deliveryOrder.shop.address1 && (
                        <span className="text-gray-500 ml-2">({job.deliveryOrder.shop.address1})</span>
                      )}
                    </div>
                  )}

                  {/* Delivery Address */}
                  {job.deliveryOrder.deliveryAddress && (
                    <div className="mb-4 text-sm">
                      <span className="text-gray-600">Deliver to: </span>
                      <span className="font-semibold">{job.deliveryOrder.deliveryAddress}</span>
                      {job.deliveryOrder.deliveryCity && (
                        <span className="text-gray-500 ml-2">{job.deliveryOrder.deliveryCity}</span>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-2 w-full">
                    {/* Pick Up Button - Show when status is dispatched */}
                    {job.deliveryOrder.deliveryStatus === 'dispatched' && (
                      <button
                        onClick={() => handlePickupOrder(job.deliveryOrder.id)}
                        disabled={updatingStatus}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                      >
                        {updatingStatus ? 'Updating...' : `Mark as Picked Up${job.deliveryOrder.shop?.type === 'restaurant' ? ' (Restaurant)' : ' (Shop)'}`}
                      </button>
                    )}

                    {/* Deliver Button - Show when status is in-transit */}
                    {job.deliveryOrder.deliveryStatus === 'in-transit' && (
                      <button
                        onClick={() => handleDeliverOrder(job.deliveryOrder.id)}
                        disabled={updatingStatus}
                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                      >
                        {updatingStatus ? 'Updating...' : 'Mark as Delivered'}
                      </button>
                    )}

                    {/* Completed Status - Show when delivered */}
                    {job.deliveryOrder.deliveryStatus === 'delivered' && (
                      <div className="flex-1 px-4 py-2 bg-green-100 text-green-700 rounded-lg font-semibold text-center text-sm">
                        ✓ Order Delivered
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col justify-center items-center w-full h-64">
              <p className="text-gray-600">No job details found.</p>
            </div>
          )}
        </div>
        <ConfirmationModal
          isOpen={acceptModal}
          onClose={() => setAcceptModal(false)}
          handleConfirm={handleConfirmAccept}
          alertMessage={t("accept_confirm")}
          description={t("accept_warning")}
        />
      </>
    );
};

export default JobDetailView;
