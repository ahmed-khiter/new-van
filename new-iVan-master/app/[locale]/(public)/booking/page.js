'use client';

import { getFilteredServices, getFullDateFromTime, getBookingServices, getOrderingServices, getReservationServices } from '@/utils/helper';
import { useRouter } from '@/i18n/routing';
import { useSession } from 'next-auth/react';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";
import DetailForm from "./components/DetailForm";
import JobDistanceForm from "./components/JobDistanceForm";
import LuggageItemsForm from "./components/LuggageItemsForm";
import LocationSelectionForm from "./components/LocationSelectionForm";
import PaymentSummary from "./components/PaymentSummary";
import LoginModal from "@/components/Modals/LoginModal";
import toast from 'react-hot-toast';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import ServicesFilter from '@/components/ServicesFilter';
import FeatureDescriptionModal from '@/components/Modals/FeatureDescriptionModal';
import LocationBadge from "@/components/LocationBadge";

function BookingPageContent() {
    const router = useRouter();
    const { data: session, status } = useSession();
    const t = useTranslations('PublicPages.booking');
    const tServices = useTranslations('PublicPages.jobDistanceForm');
    const tLuggage = useTranslations('PublicPages.luggage');
    const tServicesTrans = useTranslations('Services');
    const searchParams = useSearchParams();
    const serviceId = searchParams.get('service');
    
    // Detect if this is a luggage/cleaning service
    const isLuggageService = serviceId === 'Luggage Storage' || serviceId === 'Dry Cleaning Pick-Up' || searchParams?.get('service') === 'cleaning';
    const serviceType = searchParams?.get('service') === 'cleaning' ? 'cleaning' : 'luggage';
    const isCleaning = serviceType === 'cleaning';
    const actualServiceId = isCleaning ? 'Dry Cleaning Pick-Up' : 'Luggage Storage';
    
    const [step, setStep] = useState(1)
    const [selectedService, setSelectedService] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [errors, setErrors] = useState({});
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [servicesCatalog, setServicesCatalog] = useState([]);
    
    // Luggage-specific state
    const [luggageItems, setLuggageItems] = useState([]);
    const [locations, setLocations] = useState([]);
    const [isLoadingLocations, setIsLoadingLocations] = useState(false);

    const [formData, setFormData] = useState({
        distance: 0,
        category: "",

        // Pickup & Dropoff
        pickupAddressLine1: "",
        pickupCity: "",
        pickupPostCode: "",
        pickupLat: null,
        pickupLng: null,
        dropOffAddressLine1: "",
        dropOffCity: "",
        dropOffPostCode: "",
        dropOffLat: null,
        dropOffLng: null,
        pickupDate: "",
        pickupFixedTime: "",
        isPickupTimeFlexible: false,
        dropOffDate: "",
        dropOffFixedTime: "",
        isDropOffTimeFlexible: false,

        // Van
        vanSize: "",
        movingItem: "",
        isHelpLoading: false,
        isTwoMenRequired: false,

        // Recovery
        make: "",
        model: "",
        year: null,
        doesCarTurnOn: false,

        // Removals
        howManyItems: "",

        // Locksmith
        typeOfKey: "",
        typeOfLock: "",

        // Cleaning
        howManyRooms: "",
        howManyBathrooms: "",
        howManyHours: "",
        typeOfPlace: "",
        hasCleaningProducts: false,

        // Car Key Replacement
        hasLogBook: false,
        hasCarKey: false,

        // Click & Collect
        storeName: "",
        clickAndCollectIdNumber: "",
        yourName: "",
        contactNumber: "",
        // Extra
        notes: "",
        requireUrgent: false,
        
        // Luggage-specific
        items: {}, // { itemId: quantity }
        customerLocation: null, // { lat, lng, address, city, postCode }
        selectedLocationId: null,
        deliveryMethod: null, // 'dropoff' or 'collection'
        totalPrice: 0,
    });


    useEffect(() => {
        if (serviceId) {
            // Redirect to Taxi Rides page
            if (serviceId === "Taxi Rides") {
                router.push("/swipped-rides");
                return;
            }
            const serviceSource = servicesCatalog;
            const service = serviceSource.find(s => s.id === serviceId);
            if (service) {
                setSelectedService(service);
                if (!isLuggageService) {
                    handleInputChange("category", serviceId)
                }
            }
        }
    }, [serviceId, isLuggageService, servicesCatalog]);

    const fetchLuggageItems = useCallback(async () => {
        try {
            // Filter items by type based on serviceType
            const typeParam = serviceType === 'cleaning' ? 'cleaning' : 'luggage';
            const response = await fetch(`/api/luggage-items/public?type=${typeParam}`);
            if (response.ok) {
                const data = await response.json();
                setLuggageItems(data.luggageItems?.filter(item => item.isActive) || []);
            }
        } catch (error) {
            console.error('Error fetching luggage items:', error);
            toast.error('Failed to load luggage items');
        }
    }, [serviceType]);

    // Fetch luggage items on mount if luggage service
    useEffect(() => {
        if (isLuggageService) {
            fetchLuggageItems();
            fetchLocations();
        }
    }, [isLuggageService, serviceType, fetchLuggageItems]);

    const fetchLocations = async () => {
        setIsLoadingLocations(true);
        try {
            const response = await fetch('/api/luggage-locations/public');
            if (response.ok) {
                const data = await response.json();
                setLocations(data.luggageLocations || []);
            }
        } catch (error) {
            console.error('Error fetching locations:', error);
            toast.error('Failed to load locations');
        } finally {
            setIsLoadingLocations(false);
        }
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setErrors(prevErrors => {
            if (!prevErrors[field]) return prevErrors;
            const { [field]: _, ...rest } = prevErrors;
            return rest;
        });
    };

    const handleItemQuantityChange = (itemId, quantity) => {
        setFormData(prev => {
            const newItems = { ...prev.items };
            if (quantity <= 0) {
                delete newItems[itemId];
            } else {
                newItems[itemId] = quantity;
            }
            
            // Calculate total price
            const totalPrice = Object.entries(newItems).reduce((sum, [id, qty]) => {
                const item = luggageItems.find(i => i.id === id);
                return sum + (item ? parseFloat(item.price) * qty : 0);
            }, 0);

            return { ...prev, items: newItems, totalPrice };
        });
    };

    const handleJobSubmit = async () => {
        setIsSubmitting(true);
        try {
            // When urgent is checked, pickup time is ASAP: send null for pickupFixedTime and let API set isPickupASAP
            const isPickupASAP = formData?.requireUrgent || formData?.pickupFixedTime === 'ASAP';
            const cleanedForm = Object.fromEntries(
                Object.entries({
                    ...formData,
                    dropOffFixedTime: getFullDateFromTime(
                        formData?.dropOffDate,
                        formData?.dropOffFixedTime
                    ),
                    pickupFixedTime: isPickupASAP
                        ? null
                        : getFullDateFromTime(
                            formData?.pickupDate,
                            formData?.pickupFixedTime
                        ),
                }).map(([key, value]) => [key, value === "" ? null : value])
            );
            console.log(cleanedForm)
            const response = await fetch(`/api/jobs`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(cleanedForm),
            });

            if (response.ok) {
                const responseData = await response.json();
                // Check if payment is required (for visitors)
                if (responseData.requiresPayment && responseData.paymentUrl) {
                    toast.success("Job created! Redirecting to payment...");
                    // Redirect to Stripe payment
                    window.location.href = responseData.paymentUrl;
                } else {
                    toast.success(t('toast_success', { category: formData?.category }));
                    router.push("/");
                }
               
            } else {
                const errorData = await response.json();
                toast.error(errorData?.error || t('toast_generic_error'));
            }
        } catch (error) {
            toast.error(error.message || t('toast_failed_save'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleLuggageSubmit = async () => {
        setIsSubmitting(true);
        try {
            const response = await fetch('/api/luggage/booking', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    items: formData.items,
                    locationId: formData.selectedLocationId,
                    deliveryMethod: formData.deliveryMethod,
                    customerLocation: formData.customerLocation,
                    totalPrice: formData.totalPrice,
                    serviceType: serviceType,
                }),
            });

            if (response.ok) {
                const data = await response.json();
                if (data.requiresPayment && data.paymentUrl) {
                    toast.success("Booking created! Redirecting to payment...");
                    window.location.href = data.paymentUrl;
                } else {
                    toast.success("Booking created successfully!");
                    router.push("/");
                }
            } else {
                const errorData = await response.json();
                toast.error(errorData?.error || "Something went wrong!");
            }
        } catch (error) {
            toast.error(error.message || "Failed to create booking");
        } finally {
            setIsSubmitting(false);
        }
    };


    // custom validator
    const validateByCategory = (data, step) => {
        const errors = {};

        if (step === 1) {
            if (!data.pickupAddressLine1) {
                errors.pickupAddressLine1 = t('errors.pickupAddressLine1');
            }
            if (["Van", "Recovery", "Click & Collect"].includes(data?.category)) {
                if (!data.dropOffAddressLine1) {
                    errors.dropOffAddressLine1 = t('errors.dropOffAddressLine1');
                }
                if (data.distance <= 0) {
                    errors.distance = t('errors.distance');
                }
            }
        }

        if (step === 2) {
            if (!data.category) {
                errors.category = t('errors.category');
            }

            if (data.category === "Van" || data.category === "restaurant" || data.category === "shop") {
                if (!data.vanSize) errors.vanSize = t('errors.vanSize');
                if (!data.movingItem) errors.movingItem = t('errors.movingItem');
            }

            if (data.category === "Recovery" || data.category === "Car Key Replacement") {
                if (!data.make) errors.make = t('errors.make');
                if (!data.model) errors.model = t('errors.model');
                if (!data.year) errors.year = t('errors.year');
            }

            if (data.category === "Removals") {
                if (!data.howManyItems) errors.howManyItems = t('errors.howManyItems');
            }

            if (data.category === "Cleaning") {
                if (!data.howManyRooms) errors.howManyRooms = t('errors.howManyRooms');
                if (!data.howManyBathrooms) errors.howManyBathrooms = t('errors.howManyBathrooms');
                if (!data.howManyHours) errors.howManyHours = t('errors.howManyHours');
                if (!data.typeOfPlace) errors.typeOfPlace = t('errors.typeOfPlace');
            }

            if (data.category === "Locksmith") {
                if (!data.typeOfKey) errors.typeOfKey = t('errors.typeOfKey');
                if (!data.typeOfLock) errors.typeOfLock = t('errors.typeOfLock');
            }

            if (data.category === "Click & Collect") {
                if (!data.storeName) errors.storeName = t('errors.storeName');
                if (!data.clickAndCollectIdNumber) errors.clickAndCollectIdNumber = t('errors.clickAndCollectIdNumber');
                if (!data.yourName) errors.yourName = t('errors.yourName');
                if (!data.contactNumber) {
                    errors.contactNumber = t('errors.contactNumber');
                } else {
                    const phoneRegex = /^[0-9+\-()\s]+$/;
                    if (!phoneRegex.test(data.contactNumber)) {
                        errors.contactNumber = t('errors.invalid_contact');
                    }
                }
            }

            // Pickup datetime
            if (!data.pickupDate) {
                errors.pickupDate = t('errors.pickupDate');
            }
            if (!data.isPickupTimeFlexible && !data.pickupFixedTime) {
                errors.pickupFixedTime = t('errors.pickupFixedTime');
            }

            // Dropoff datetime
            if (["Van", "Recovery", "Click & Collect"].includes(data?.category)) {
                if (!data.dropOffDate) {
                    errors.dropOffDate = t('errors.dropOffDate');
                }
                if (!data.isDropOffTimeFlexible && !data.dropOffFixedTime) {
                    errors.dropOffFixedTime = t('errors.dropOffFixedTime');
                }
            }
        }

        return errors;
    };

    const validateLuggageStep = (stepNumber) => {
        const errors = {};
        
        if (stepNumber === 1) {
            const hasItems = Object.keys(formData.items).length > 0;
            if (!hasItems) {
                errors.items = 'Please select at least one item';
            }
        }
        
        if (stepNumber === 2) {
            if (!formData.customerLocation) {
                errors.customerLocation = 'Please enter your location';
            }
            if (!formData.selectedLocationId) {
                errors.selectedLocationId = 'Please select a location';
            }
            if (!formData.deliveryMethod || (formData.deliveryMethod !== 'dropoff' && formData.deliveryMethod !== 'collection')) {
                errors.deliveryMethod = 'Please select a delivery option';
            }
        }

        return errors;
    };

    const handleContinue = () => {
        if (isLuggageService) {
            // Check if user is logged in when trying to submit
            if (step === 3 && !session) {
                setIsLoginModalOpen(true);
                return;
            }

            if (step === 3 && session?.user?.role !== "visitor") {
                toast.error("Only customers can book services");
                return;
            }

            const errors = validateLuggageStep(step);
            if (Object.keys(errors).length > 0) {
                setErrors(errors);
                return;
            }

            if (step === 3) {
                handleLuggageSubmit();
            } else {
                setStep(step + 1);
            }
        } else {
            // Check if user is logged in when trying to submit
            if (step === 2 && !session) {
                setIsLoginModalOpen(true);
                return;
            }

            if (step === 2 && session?.user?.role !== "visitor") {
                toast.error("Only customers can book services");
                return;
            }

            const errors = validateByCategory(formData, step);

            if (Object.keys(errors).length > 0) {
                setErrors(errors);
                return;
            }

            if (step === 2) {
                handleJobSubmit();
            } else {
                setStep(step + 1);
            }
        }
    };


    const handleBack = () => {
        if (step > 1) {
            setStep(prev => prev - 1);
        } else {
            router.push("/");
        }
    };
    useEffect(() => {
        const loadLocation = () => {
          const savedLocation = localStorage.getItem('selectedLocation');
          if (savedLocation) {
            setSelectedLocation(JSON.parse(savedLocation));
          }
        };
    
        loadLocation();
    
        const handleLocationChange = () => loadLocation();
        window.addEventListener('locationChanged', handleLocationChange);
        window.addEventListener('storage', loadLocation);
    
        return () => {
          window.removeEventListener('locationChanged', handleLocationChange);
          window.removeEventListener('storage', loadLocation);
        };
      }, []);
    useEffect(() => {
        let cancelled = false;
        const fetchCatalog = async () => {
            try {
                const q = selectedLocation?.code
                    ? `?locationCode=${encodeURIComponent(selectedLocation.code)}`
                    : "";
                const res = await fetch(`/api/public/home-services${q}`);
                const data = await res.json();
                if (cancelled) return;
                if (res.ok && Array.isArray(data.catalog)) {
                    setServicesCatalog(data.catalog);
                }
            } catch (error) {
                if (!cancelled) {
                    setServicesCatalog([]);
                }
            }
        };
        fetchCatalog();
        return () => {
            cancelled = true;
        };
    }, [selectedLocation?.code]);

      const serviceSource = servicesCatalog;
      const filteredServices = getFilteredServices(serviceSource, selectedLocation);
      const orderingServices = getOrderingServices(filteredServices);
    const reservationServices = getReservationServices(filteredServices);
    const bookingServices = getBookingServices(filteredServices, orderingServices, reservationServices);
    // Promotional slider has 8 slides
      // Helper function to get translated service data
    const getTranslatedService = (service) => {
        if (!service) return null;
        
        try {
            return {
                ...service,
                name: tServicesTrans(`${service.id}.name`) || service.name,
                description: tServicesTrans(`${service.id}.description`) || service.description
            };
        } catch {
            return service;
        }
    };

    const translatedService = isLuggageService
        ? getTranslatedService(serviceSource.find(s => s.id === actualServiceId))
        : getTranslatedService(selectedService);

    // Handle service change from ServicesFilter
    const handleServiceChange = (serviceId) => {
        router.push(`/booking?service=${encodeURIComponent(serviceId)}`);
    };

    return (
        <>
            <div className="max-w-4xl mx-auto px-2">
                {/* {step === 1 && (
                        <LocationBadge className="text-center"  />
                )} */}
                <div className="flex items-center justify-between">

                    <div className="flex items-center">
                        <button
                            onClick={handleBack}
                            className="p-2 hover:bg-gray-100 rounded-lg"
                        >
                            <FaArrowLeft className="h-4 w-4" />
                        </button>
                    </div>
                    {step === 1 && (
                        <span className={`px-3 py-1 rounded-full text-xs font-medium  bg-yellow-100 text-yellow-800
                        }`}>
                            {bookingServices.length}  {tServices("another_services")}
                        </span>
                       
                    )}
                
                    {isLuggageService && step === 2 && (
                        <h4 className="text-lg !mb-0">Choose Location</h4>
                    )}
                    {isLuggageService && step === 3 && (
                        <h4 className="text-lg !mb-0">Payment</h4>
                    )}
                </div>
            </div>

            <div className="max-w-4xl mx-auto pb-6 px-2">
                {isLuggageService ? (
                    <>
                        {step === 1 && (
                            <>
                                {/* ServicesFilter */}

                                <div className="services_filter mb-2">
                                    <ServicesFilter
                                        selectedService={actualServiceId}
                                        onServiceChange={handleServiceChange}
                                        variant="cards"
                                        scrollable={true}
                                        showRestaurant={true}
                                        excludeServices={[...orderingServices.map((s) => s.id), ...reservationServices.map((s) => s.id)]}
                  servicesOrder={bookingServices.map((s) => s.id)}
                                        />
                                </div>

                                {/* Service Banner */}
                                {translatedService && (
                                    <>
                                        <div className="bg-[#00483D] rounded-lg p-8 mb-2 text-white">
                                            <div className="flex items-center">
                                                <div>
                                                    <h2 className="text-xl font-semibold uppercase">
                                                        {translatedService.name}
                                                    </h2>
                                                    <p className="">{translatedService.description}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}

                                {/* Mobile Banner Image */}
                                <div className="block sm:hidden">
                                    <img 
                                        src={translatedService?.images?.slider} 
                                        alt={translatedService?.name} 
                                        className="w-full h-auto object-cover mb-2 rounded-lg outline-none border-0" 
                                    />
                                    <FeatureDescriptionModal service={translatedService?.name || actualServiceId} />
                                </div>

                                {/* Form */}
                                <LuggageItemsForm
                                    luggageItems={luggageItems}
                                    selectedItems={formData.items}
                                    onItemQuantityChange={handleItemQuantityChange}
                                    errors={errors}
                                    serviceType={serviceType}
                                    location={selectedLocation}
                                />
                            </>
                        )}

                        {step === 2 && (
                            <LocationSelectionForm
                                locations={locations}
                                isLoadingLocations={isLoadingLocations}
                                customerLocation={formData.customerLocation}
                                selectedLocationId={formData.selectedLocationId}
                                deliveryMethod={formData.deliveryMethod}
                                onLocationChange={(location) => handleInputChange('customerLocation', location)}
                                onLocationSelect={(locationId) => handleInputChange('selectedLocationId', locationId)}
                                onDeliveryMethodChange={(method) => handleInputChange('deliveryMethod', method)}
                                errors={errors}
                                serviceType={serviceType}
                            />
                        )}

                        {step === 3 && (
                            <PaymentSummary
                                items={formData.items}
                                luggageItems={luggageItems}
                                selectedLocation={locations.find(l => l.id === formData.selectedLocationId)}
                                deliveryMethod={formData.deliveryMethod}
                                totalPrice={formData.totalPrice}
                                serviceType={serviceType}
                                location={selectedLocation}
                            />
                        )}
                    </>
                ) : (
                    <>
                        {step === 1 ? (
                            <JobDistanceForm selectedService={selectedService} servicesCatalog={servicesCatalog} formData={formData} errors={errors} handleInputChange={handleInputChange} />
                        ) : step === 2 ? (
                            <DetailForm formData={formData} handleInputChange={handleInputChange} errors={errors} />
                        ) : null}
                    </>
                )}

                {/* Continue Button */}
                <div className="flex flex-col items-center">
                    <span className="text-[10px] text-gray-600 mb-2">
                        {t('takes_30_seconds')}
                    </span>
                    <button
                        onClick={handleContinue}
                        disabled={isSubmitting}
                        className={`custom_btn_solid flex items-center space-x-2 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        <span>
                            {isLuggageService && step === 3 ? 'Proceed to Payment' : t('continue')}
                        </span>
                        <FaArrowRight className="h-5 w-5" />
                    </button>
                </div>
            </div>

            {/* Login Modal */}
            <LoginModal
                isOpen={isLoginModalOpen}
                onClose={() => setIsLoginModalOpen(false)}
                onLoginSuccess={() => {
                    setIsLoginModalOpen(false);
                }}
            />
        </>
    );
}

export default function BookingPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <BookingPageContent />
        </Suspense>
    );
}
