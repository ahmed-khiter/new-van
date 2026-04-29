

import AddressInput from '@/components/Fields/AddressInput';
import FeatureDescriptionModal from '@/components/Modals/FeatureDescriptionModal';
import ServicesFilter from '@/components/ServicesFilter';
import { useGoogleMaps } from '@/hooks/useGoogleMaps';
import { useRouter } from '@/i18n/routing';
import useSavedLocation from '@/lib/hooks/useSavedLocation';
import { calculateDistance as calculateStraightLineDistance, formatDistanceByLocation, getBookingServices, getFilteredServices, getOrderingServices, getReservationServices } from '@/utils/helper';
import { useTranslations } from 'next-intl';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

// Dynamically import the map component to avoid SSR issues
const MapComponent = dynamic(() => import('@/components/MapComponent'), {
  ssr: false,
  loading: () => <div className="h-64 bg-gray-200 rounded-lg animate-pulse" />
});
function JobDistanceForm({ selectedService, servicesCatalog = [], handleInputChange, formData, errors }) {
  const t = useTranslations('PublicPages.jobDistanceForm');
  const tServices = useTranslations('Services');
  const router = useRouter();
  const { savedLocation } = useSavedLocation();

  // Helper function to get translated service data
  const getTranslatedService = (service) => {
    if (!service) return null;

    try {
      return {
        ...service,
        name: tServices(`${service.id}.name`) || service.name,
        description: tServices(`${service.id}.description`) || service.description
      };
    } catch {
      return service;
    }
  };

  // Handle service change and update URL
  const handleServiceChange = (serviceId) => {
    handleInputChange("category", serviceId);
    router.push(`/booking?service=${encodeURIComponent(serviceId)}`);
  };

  const translatedService = getTranslatedService(selectedService);
  const [pickupLocation, setPickupLocation] = useState(null);
  const [dropoffLocation, setDropoffLocation] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const { isGoogleMapsLoaded } = useGoogleMaps();


  // Calculate distance when both locations are set
  useEffect(() => {
    if (pickupLocation && dropoffLocation) {
      calculateDistance();
    }
  }, [pickupLocation, dropoffLocation]);

  const calculateDistance = async () => {
    if (!pickupLocation || !dropoffLocation) return;

    setIsCalculating(true);

    try {
      if (window.google && window.google.maps) {
        // Use Google Maps Distance Matrix API
        const service = new window.google.maps.DistanceMatrixService();
        service.getDistanceMatrix(
          {
            origins: [{ lat: pickupLocation.lat, lng: pickupLocation.lng }],
            destinations: [{ lat: dropoffLocation.lat, lng: dropoffLocation.lng }],
            travelMode: window.google.maps.TravelMode.DRIVING,
            unitSystem: window.google.maps.UnitSystem.IMPERIAL,
          },
          (response, status) => {
            if (status === 'OK' && response) {
              const element = response.rows[0].elements[0];
              if (element.status === 'OK') {
                const distanceText = element.distance.text;
                const distanceValue = parseFloat(distanceText.replace(/[^\d.]/g, ''));
                handleInputChange("distance", distanceValue)
              } else {
                const straightLineDistance = calculateStraightLineDistance(pickupLocation.lat, pickupLocation.lng, dropoffLocation.lat, dropoffLocation.lng);
                handleInputChange("distance", straightLineDistance);
              }
            } else {
              const straightLineDistance = calculateStraightLineDistance(pickupLocation.lat, pickupLocation.lng, dropoffLocation.lat, dropoffLocation.lng);
              handleInputChange("distance", straightLineDistance);
            }
            setIsCalculating(false);
          }
        );
      } else {
        // Fallback to straight-line distance if Google Maps not loaded
        const straightLineDistance = calculateStraightLineDistance(pickupLocation.lat, pickupLocation.lng, dropoffLocation.lat, dropoffLocation.lng);
        handleInputChange("distance", straightLineDistance);
        setIsCalculating(false);
      }
    } catch (error) {
      // Fallback to straight-line distance
      const straightLineDistance = calculateStraightLineDistance(pickupLocation.lat, pickupLocation.lng, dropoffLocation.lat, dropoffLocation.lng);
      handleInputChange("distance", straightLineDistance);
      setIsCalculating(false);
    }
  };

  const handlePickupLocationSelect = (location) => {
    setPickupLocation(location);
    handleInputChange("pickupAddressLine1", location?.address);
    handleInputChange("pickupLat", location?.lat);
    handleInputChange("pickupLng", location?.lng);
    handleInputChange("pickupPostCode", location?.postcode || '');
    handleInputChange("pickupCity", location?.city || '');
  };

  const handleDropoffLocationSelect = (location) => {
    setDropoffLocation(location);
    // Update all dropoff related fields in form data
    handleInputChange("dropOffAddressLine1", location?.address);
    handleInputChange("dropOffLat", location?.lat);
    handleInputChange("dropOffLng", location?.lng);
    handleInputChange("dropOffPostCode", location?.postcode || '');
    handleInputChange("dropOffCity", location?.city || '');
  };
  const servicesSource = Array.isArray(servicesCatalog) ? servicesCatalog : [];
  const filteredServices = getFilteredServices(servicesSource, savedLocation);
  const orderingServices = getOrderingServices(filteredServices);
  const reservationServices = getReservationServices(filteredServices);
  const bookingServices = getBookingServices(filteredServices, orderingServices, reservationServices);
  // Promotional slider has 8 slides
  return (
    <>
      {translatedService && (
        <>
          <div className="mb-2">
            <ServicesFilter
              selectedService={formData.category}
              onServiceChange={handleServiceChange}
              variant="cards"
              scrollable={true}
              showRestaurant={true}
              excludeServices={[...orderingServices.map((s) => s.id), ...reservationServices.map((s) => s.id)]}
              servicesOrder={bookingServices.map((s) => s.id)}
            />
          </div>
          {/* <img 
              src="/assets/img/services.png" 
              alt="Services" 
              className="w-full h-auto object-cover mb-4 rounded-lg"
            /> */}
          <div className="bg-[#00483D] rounded-lg p-8 mb-2 text-white">
            <div className="flex items-center">
              <div>
                <h2 className="text-xl font-bold uppercase">
                  {translatedService.name}
                </h2>
                <p className="">{translatedService.description}</p>
              </div>
            </div>
          </div>
        </>
      )}
      <div className="block sm:hidden ">
        <img src={translatedService?.images?.slider} alt={translatedService?.name} className="w-full h-auto object-cover mb-2 rounded-lg outline-none border-0" />
        <FeatureDescriptionModal service={translatedService?.name || formData?.category} />
      </div>
      {/* Address Input Section */}
      <div className="bg-white rounded-lg p-6 mb-2 shadow-sm ">
        {!isGoogleMapsLoaded && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">🔄 {t("loading_maps")}</p>
          </div>
        )}
        <div className="space-y-6">
          <AddressInput
            value={formData.pickupAddressLine1}
            onChange={(val) => handleInputChange("pickupAddressLine1", val)}
            onLocationSelect={handlePickupLocationSelect}
            placeholder={
              ["Van", "Recovery", "Click & Collect"].includes(
                formData?.category
              )
                ? t("placeholder_pickup")
                : t("enter_your_location")
            }
            label={
              ["Van", "Recovery", "Click & Collect"].includes(
                formData?.category
              )
                ? t("enter_pickup")
                : t("enter_your_location")
            }
          />
          {errors.pickupAddressLine1 && (
            <p className="mt-1 text-sm text-red-500">
              {errors.pickupAddressLine1}
            </p>
          )}
          {["Van", "Recovery", "Click & Collect"].includes(
            formData?.category
          ) && (
              <>
                <AddressInput
                  value={formData.dropOffAddressLine1}
                  onChange={(val) =>
                    handleInputChange("dropOffAddressLine1", val)
                  }
                  onLocationSelect={handleDropoffLocationSelect}
                  placeholder={t("placeholder_dropoff")}
                  label={t("enter_dropoff")}
                />
                {errors.dropOffAddressLine1 && (
                  <p className="mt-1 text-sm text-red-500">
                    {errors.dropOffAddressLine1}
                  </p>
                )}

                <>
                  {/* Distance Display */}
                  <div className="bg-blue-50 p-4 rounded-lg">
                    {(!formData?.pickupAddressLine1 || !formData?.dropOffAddressLine1) ? (
                      <p className="text-sm text-blue-800">
                        {t("select_location_to_calculate")}
                      </p>
                    ) : (
                      <p className="text-sm text-blue-800">
                        {t("estimated_distance_label")} {formatDistanceByLocation(formData?.distance, savedLocation)}
                        {isCalculating && (
                          <span className="ml-2">🔄 {t("calculating")}</span>
                        )}
                      </p>
                    )}
                  </div>
                  {errors.distance && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.distance}
                    </p>
                  )}
                </>
              </>
            )}
          {/* Location Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pickupLocation && (
              <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                <p className="text-sm text-green-800">
                  {t("pickup_badge", { address: pickupLocation?.address })}
                </p>
              </div>
            )}
            {dropoffLocation && (
              <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                <p className="text-sm text-red-800">
                  {t("dropoff_badge", { address: dropoffLocation?.address })}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Map Section */}
      <div className="bg-white rounded-lg p-6 mb-2 shadow-sm">
        <h3 className="text-lg font-semibold mb-4">📍 {t("map_title")}</h3>
        <MapComponent
          pickupLocation={pickupLocation}
          dropoffLocation={dropoffLocation}
          onPickupSelect={handlePickupLocationSelect}
          onDropoffSelect={handleDropoffLocationSelect}
        />
      </div>

    </>
  );
}

export default JobDistanceForm