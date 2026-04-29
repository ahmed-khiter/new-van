"use client";
import { useState, useEffect, useRef } from "react";
import LocationSelectionModal from "@/components/Modals/LocationSelectionModal";
import toast from "react-hot-toast";
import { getLocationFromStorage, updateLocation } from "@/utils/helper";

export default function LocationBadge({
  onLocationChange = null,
  className = "",
  text = null,
  changeButtonText = "Change",
  changeButtonClassName = "",
  onCancel = null,
  type = "",
  showChangeButton = true,
  selectorPresentation = "modal",
}) {
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [mounted, setMounted] = useState(false);
  const onLocationChangeRef = useRef(onLocationChange);

  useEffect(() => {
    onLocationChangeRef.current = onLocationChange;
  }, [onLocationChange]);

  useEffect(() => {
    setMounted(true);
    const location = getLocationFromStorage();
    
    if (location) {
      setSelectedLocation(location);
      onLocationChangeRef.current?.(location);
      setShowLocationModal(false);
    } else {
      setShowLocationModal(true);
    }

    const handleLocationChange = () => {
      const location = getLocationFromStorage();
      setSelectedLocation(location);
      onLocationChangeRef.current?.(location);
      setShowLocationModal(!location);
    };

    const handleLocationOpen = () => {
      setShowLocationModal(true);
    };

    window.addEventListener('locationChanged', handleLocationChange);
    window.addEventListener('storage', handleLocationChange);
    window.addEventListener('openLocationSelector', handleLocationOpen);

    return () => {
      window.removeEventListener('locationChanged', handleLocationChange);
      window.removeEventListener('storage', handleLocationChange);
      window.removeEventListener('openLocationSelector', handleLocationOpen);
    };
  }, []);

  const handleLocationSelect = (location) => {
    setShowLocationModal(false);
    toast.success(`Location set to ${location.name} ${location.flag}`);
    setSelectedLocation(location);
    updateLocation(location, onLocationChangeRef.current);
  };

  if (!mounted) {
    return (
      <LocationSelectionModal
        isOpen={false}
        onLocationSelect={handleLocationSelect}
        onCancel={() => setShowLocationModal(false)}
        currentLocation={null}
        presentation={selectorPresentation}
      />
    );
  }

  const hasCustomText = text && (typeof text === 'function' || typeof text === 'string');
  const locationFlag = selectedLocation?.flag || "";
  let locationNameText = selectedLocation 
    ? (text && typeof text === 'function' 
        ? text(selectedLocation) 
        : text || `Showing Services in ${selectedLocation.name}`)
    : "";
  
  let displayText = locationNameText;
  let displayFlag = "";
  if (hasCustomText && locationFlag && locationNameText) {
    const flagPattern = new RegExp(`\\s*${locationFlag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`);
    if (flagPattern.test(locationNameText)) {
      displayText = locationNameText.replace(flagPattern, '').trim();
      displayFlag = locationFlag;
    }
  }
  
  const showFlagSeparately = !hasCustomText && locationFlag;

  return (
    <>
      <LocationSelectionModal
        isOpen={showLocationModal}
        onLocationSelect={handleLocationSelect}
        onCancel={() => {
          setShowLocationModal(false);
          onCancel?.();
        }}
        currentLocation={selectedLocation}
        presentation={selectorPresentation}
      />
      {selectedLocation && locationNameText && (
        <div className={`mb-2 location-badge-home ${className}`}>
          <button
            type="button"
            data-location-trigger="open"
            aria-label={`Change location from ${selectedLocation.name}`}
            onClick={() => setShowLocationModal(true)}
            className={`badge ${
              type === "restaurant" ? "bg_red" : "bg_orange"
            } text-white text-[10px] sm:text-[14px] px-1 sm:px-4 py-2 sm:py-2`}
          >
            <span className="d-inline-flex align-items-center justify-content-center me-1">
              📍
              <span
                className="underline me-1 cursor-pointer"
              >
                {displayText}
              </span>
              {(showFlagSeparately || displayFlag) && (
                <span className="me-1">{displayFlag || locationFlag}</span>
              )}
            </span>
          </button>
          {showChangeButton && (
            <button
              data-location-trigger="open"
              className={`ms-1 px-0 sm:btn sm:btn-sm sm:px-4 text-[10px] sm:text-[14px] ${
                type === "restaurant" ?'text-white':""
              } ${changeButtonClassName}`}
              onClick={() => setShowLocationModal(true)}
              title="Change location"
            >
              <i className="bi bi-pencil me-1"></i>
              {changeButtonText}
            </button>
          )}
        </div>
      )}
    </>
  );
}
