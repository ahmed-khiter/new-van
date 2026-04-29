"use client";
import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import AddressInput from "@/components/Fields/AddressInput";

const LocationFilterModal = ({ isOpen, onClose, onApplyFilter, currentLocation, currentRadius }) => {
  const t = useTranslations("LocationFilter");
  const [selectedLocation, setSelectedLocation] = useState(currentLocation || null);
  const [address, setAddress] = useState(currentLocation?.address || "");
  const [postCode, setPostCode] = useState(currentLocation?.postCode || "");
  const [radius, setRadius] = useState(currentRadius || 10);
  const [customRadius, setCustomRadius] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      // Only reset if we have a valid currentLocation
      if (currentLocation && currentLocation.lat && currentLocation.lng) {
        setSelectedLocation({
          lat: currentLocation.lat,
          lng: currentLocation.lng,
          address: currentLocation.address || "",
          postCode: currentLocation.postCode || "",
        });
        setAddress(currentLocation.address || "");
        setPostCode(currentLocation.postCode || "");
      } else {
        // Clear if no valid location
        setSelectedLocation(null);
        setAddress("");
        setPostCode("");
      }
      setRadius(currentRadius || 10);
      setCustomRadius("");
    }
  }, [isOpen, currentLocation, currentRadius]);

  const handleLocationSelect = (location) => {
    // Ensure location has all required fields
    const locationData = {
      lat: location.lat,
      lng: location.lng,
      address: location.address,
      postCode: location.postCode || location.postcode || "",
      placeId: location.placeId,
      city: location.city,
    };
    setSelectedLocation(locationData);
    setAddress(location.address);
    // Auto-fill postal code if available from the location
    if (location.postCode || location.postcode) {
      setPostCode(location.postCode || location.postcode);
    }
  };

  const handleAddressChange = (newAddress) => {
    setAddress(newAddress);
    // Only clear selected location if address is manually changed and doesn't match
    // Don't clear if it's just a partial match (user might be typing)
    if (selectedLocation && selectedLocation.address && 
        !newAddress.includes(selectedLocation.address.split(',')[0]) &&
        !selectedLocation.address.includes(newAddress.split(',')[0])) {
      // Only clear if addresses are significantly different
      if (newAddress.length > 5) {
        setSelectedLocation(null);
      }
    }
  };

  const handleApplyFilter = async () => {
    if (!selectedLocation || !selectedLocation.lat || !selectedLocation.lng) {
      alert("Please select a location from the suggestions first");
      return;
    }

    setIsLoading(true);
    try {
      const finalRadius = customRadius ? parseInt(customRadius) : radius;
      const filterData = {
        location: {
          lat: selectedLocation.lat,
          lng: selectedLocation.lng,
          address: selectedLocation.address || address,
          postCode: selectedLocation.postCode || selectedLocation.postcode || "",
        },
        radius: finalRadius
      };
      await onApplyFilter(filterData);
      onClose();
    } catch (error) {
      console.error("Error applying location filter:", error);
      alert("Failed to apply location filter. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearFilter = () => {
    setSelectedLocation(null);
    setAddress("");
    setPostCode("");
    setRadius(10);
    setCustomRadius("");
  };


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[99] p-3 sm:p-4">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl relative z-[10000]">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-0">Filter Shops by Location</h2>
              <p className="text-gray-600 text-sm mb-0">Select a location and radius to find nearby shops</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-full"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-3 overflow-y-auto max-h-[calc(90vh-80px)] sm:p-6">
          <div className="space-y-6">
            {/* Location Selection */}
            <div>
              <h3 className="text-[16px] font-semibold text-gray-900">Address</h3>
              {/* Address Input */}
              <div className="mb-4">
                <AddressInput
                  value={address}
                  onChange={handleAddressChange}
                  onLocationSelect={handleLocationSelect}
                  placeholder="Enter address or city name"
                />
                {selectedLocation && selectedLocation.lat && selectedLocation.lng && (
                  <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-800">
                      ✓ Location selected: {selectedLocation.address}
                    </p>
                  </div>
                )}
              </div>

              {/* Postal Code Input - Commented out */}
              {/* <div className="mb-4">
              <h3 className="text-[16px] font-semibold text-gray-900">Postal Code</h3>
                <input
                  type="text"
                  value={postCode}
                  onChange={(e) => setPostCode(e.target.value)}
                  placeholder="Enter postal code"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  maxLength={10}
                />
                <p className="text-xs text-gray-500 mt-1">
                  This helps us find shops near your specific area
                </p>
              </div> */}
            </div>

            {/* Radius Selection */}
            <div className="space-y-4">
              <div>
                <h3 className="text-[16px] font-semibold text-gray-900">Choose Radius</h3>
                
                {/* Radius Selection Row */}
                <div className="flex gap-3 sm:flex-row flex-col">
                  {/* Quick radius buttons */}
                  <div className="flex gap-2 flex-1">
                    {[5, 10].map((quickRadius) => (
                      <button
                        key={quickRadius}
                        onClick={() => {
                          setRadius(quickRadius);
                          setCustomRadius("");
                        }}
                        className={`btn-sm rounded-pill px-3 sm:px-4 py-2 text-sm transition-colors flex-1  ${
                          radius === quickRadius && !customRadius
                            ? "custom_btn_solid"
                            : "custom_btn_outline--small"
                        }`}
                      >
                        {quickRadius} miles
                      </button>
                    ))}
                  </div>
                  
                  {/* Custom radius input */}
                  <div className="flex-1">
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={customRadius}
                      onChange={(e) => {
                        const value = e.target.value;
                        setCustomRadius(value);
                        if (value) {
                          setRadius(parseInt(value));
                        }
                      }}
                      placeholder="Enter custom radius (miles)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                  </div>
                </div>
                
                <p className="text-xs text-gray-500 mt-2">
                  <i className="bi bi-info-circle me-1"></i>
                  This helps us find shops near your specific area
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 rounded-b-2xl">
          <div className="flex justify-end gap-2">
            <button
              onClick={onClose}
              className="custom_btn_outline--small px-4"
            >
              Cancel
            </button>
            <button
              onClick={handleApplyFilter}
              disabled={!selectedLocation || isLoading}
              className="custom_btn_solid disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 px-4"
            >
              {isLoading && (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              )}
              Apply Filter
            </button>
          </div>
        </div>

        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-2xl z-[10001]">
            <div className="flex flex-col items-center space-y-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <p className="text-sm text-gray-600">Loading location...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LocationFilterModal;
