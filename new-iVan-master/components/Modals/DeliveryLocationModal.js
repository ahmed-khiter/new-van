"use client";
import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import AddressInput from "@/components/Fields/AddressInput";

const DeliveryLocationModal = ({ isOpen, onClose, onConfirm, restaurant }) => {
  const t = useTranslations("DeliveryLocationModal");
  const router = useRouter();
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [address, setAddress] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isOutsideRadius, setIsOutsideRadius] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedLocation(null);
      setAddress("");
      setError(null);
      setIsOutsideRadius(false);
    }
  }, [isOpen]);

  const handleLocationSelect = (location) => {
    setSelectedLocation(location);
    setAddress(location.address);
    setError(null);
    setIsOutsideRadius(false);
  };

  const handleAddressChange = (newAddress) => {
    setAddress(newAddress);
    if (selectedLocation && selectedLocation.address !== newAddress) {
      setSelectedLocation(null);
    }
    setError(null);
    setIsOutsideRadius(false);
  };

  const handleConfirm = async () => {
    if (!selectedLocation) {
      setError("Please select a location first");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/restaurants/${restaurant?.id}/check-delivery-radius`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            lat: selectedLocation.lat,
            lng: selectedLocation.lng,
          }),
        }
      );

      const data = await response.json();

      if (response.ok && data.withinRadius) {
        onConfirm(selectedLocation);
        onClose();
      } else {
        setIsOutsideRadius(true);
        setError(
          data.message ||
            "This restaurant is not in your radius"
        );
      }
    } catch (error) {
      console.error("Error checking delivery radius:", error);
      setError("Failed to check delivery radius. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[99] p-3 sm:p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl relative z-[10000]">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-0">
                Enter Your Location
              </h2>
              <p className="text-gray-600 text-sm mb-0">
                We need your location to check if delivery is available
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-full"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Delivery Address
              </label>
              <AddressInput
                value={address}
                onChange={handleAddressChange}
                onLocationSelect={handleLocationSelect}
                placeholder="Enter your delivery address"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {selectedLocation && !error && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  ✓ Location selected: {selectedLocation.address}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 rounded-b-2xl">
          <div className="flex justify-end gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (isOutsideRadius) {
                  router.push("/restaurants");
                  onClose();
                } else {
                  handleConfirm();
                }
              }}
              disabled={!selectedLocation || isLoading}
              className="px-4 py-2 bg_red text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLoading && (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              )}
              {isOutsideRadius ? "View More Restaurants" : "Continue"}
            </button>
          </div>
        </div>

        {isLoading && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-2xl z-[10001]">
            <div className="flex flex-col items-center space-y-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
              <p className="text-sm text-gray-600">Checking delivery radius...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeliveryLocationModal;

