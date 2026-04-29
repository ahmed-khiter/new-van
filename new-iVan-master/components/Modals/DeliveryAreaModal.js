"use client";

import { useEffect, useMemo, useState } from "react";
import { FiChevronRight, FiCrosshair, FiMapPin, FiX } from "react-icons/fi";

const DEFAULT_RADIUS = 10;
const POSTCODE_ONLY_PATTERN = /^[A-Za-z0-9][A-Za-z0-9 -]{1,11}$/;

const derivePostCode = (value = "") => {
  const trimmedValue = String(value).trim();

  if (!trimmedValue.includes(",") && POSTCODE_ONLY_PATTERN.test(trimmedValue)) {
    return trimmedValue.toUpperCase();
  }

  return "";
};

const reverseGeocodeCurrentLocation = async (lat, lng) => {
  if (typeof window === "undefined" || !window.google?.maps?.Geocoder) {
    return "Current location";
  }

  return new Promise((resolve) => {
    const geocoder = new window.google.maps.Geocoder();

    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === "OK" && results?.[0]?.formatted_address) {
        resolve(results[0].formatted_address);
        return;
      }

      resolve("Current location");
    });
  });
};

export const deriveDeliveryAreaLabel = (filter) => {
  const postCode = String(filter?.location?.postCode || "").trim();
  if (postCode) return postCode;

  const address = String(filter?.location?.address || "").trim();
  if (!address) return "";

  return address.split(",")[0].trim();
};

const getInitialDraftState = (currentFilter) => {
  const address = String(currentFilter?.location?.address || currentFilter?.location?.postCode || "").trim();
  const lat = Number(currentFilter?.location?.lat);
  const lng = Number(currentFilter?.location?.lng);

  return {
    address,
    coordinates: Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null,
  };
};

export default function DeliveryAreaModal({
  isOpen,
  onClose,
  onApply,
  currentFilter,
  contextLabel = "places nearby",
  submitLabel = "See what's nearby",
}) {
  const [address, setAddress] = useState("");
  const [coordinates, setCoordinates] = useState(null);
  const [isResolvingLocation, setIsResolvingLocation] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const draftState = getInitialDraftState(currentFilter);
    setAddress(draftState.address);
    setCoordinates(draftState.coordinates);
    setIsResolvingLocation(false);
    setStatusMessage("");
    setErrorMessage("");
  }, [currentFilter, isOpen]);

  const previewLabel = useMemo(() => {
    return (
      deriveDeliveryAreaLabel({
        location: {
          address,
          postCode: derivePostCode(address),
        },
      }) || (coordinates ? "Current location" : "")
    );
  }, [address, coordinates]);

  const handleUseCurrentLocation = async () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setErrorMessage("Current location is not available in this browser yet.");
      return;
    }

    setIsResolvingLocation(true);
    setStatusMessage("Finding your current location...");
    setErrorMessage("");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const nextCoordinates = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        setCoordinates(nextCoordinates);
        const resolvedAddress = await reverseGeocodeCurrentLocation(
          nextCoordinates.lat,
          nextCoordinates.lng,
        );
        setAddress(resolvedAddress);
        setStatusMessage("Current location ready.");
        setIsResolvingLocation(false);
      },
      () => {
        setErrorMessage("We couldn't access your location. You can still enter a postcode.");
        setStatusMessage("");
        setIsResolvingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000,
      },
    );
  };

  const handleSubmit = () => {
    const trimmedAddress = address.trim();

    if (!trimmedAddress && !coordinates) {
      setErrorMessage("Enter an address or use your current location first.");
      return;
    }

    onApply?.({
      location: {
        lat: coordinates?.lat ?? null,
        lng: coordinates?.lng ?? null,
        address: trimmedAddress || "Current location",
        postCode: derivePostCode(trimmedAddress),
      },
      radius: currentFilter?.radius || DEFAULT_RADIUS,
      source: coordinates ? "current-location" : "manual-entry",
    });

    onClose?.();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-end justify-center bg-[rgba(15,18,28,0.58)] p-0 sm:items-center sm:p-5"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-[32px] bg-white shadow-[0_35px_90px_rgba(0,0,0,0.28)] sm:max-h-[90vh] sm:max-w-[760px] sm:rounded-[34px]"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close delivery area modal"
          className="absolute right-5 top-5 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-[#ece7df] bg-white text-[#1a1a2e] shadow-[0_12px_30px_rgba(0,0,0,0.08)] transition hover:scale-[1.02]"
        >
          <FiX className="text-[22px]" />
        </button>

        <div className="overflow-y-auto px-6 pb-5 pt-12 sm:px-8 sm:pb-6 sm:pt-14">
          <div className="mb-6 sm:mb-8">
            <p className="mb-2 text-[clamp(1.8rem,6vw,3.2rem)] font-black uppercase italic leading-[0.92] tracking-[-0.05em] text-[#0f1220]">
              Add new
              <br />
              address.
            </p>
            <p className="max-w-[520px] text-[14px] leading-relaxed text-[#6b7280]">
              Set a postcode or use your current location and we&apos;ll use it to surface {contextLabel}.
            </p>
          </div>

          <div className="space-y-3">
            <label className="block">
              <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8f97a8]">
                Address or postcode
              </span>
              <input
                type="text"
                value={address}
                onChange={(event) => {
                  setAddress(event.target.value);
                  setCoordinates(null);
                  setErrorMessage("");
                  setStatusMessage("");
                }}
                placeholder="Address or Postcode"
                className="h-[52px] w-full rounded-[16px] border border-[#d9dfeb] px-4 text-[15px] font-medium text-[#1a1a2e] outline-none transition placeholder:text-[#848b99] focus:border-[#1f8fff] focus:ring-0"
              />
            </label>

            <button
              type="button"
              onClick={handleUseCurrentLocation}
              disabled={isResolvingLocation}
              className="flex w-full items-center justify-between rounded-[20px] border border-[#ece7df] bg-[#faf7f2] px-4 py-3.5 text-left text-[#1a1a2e] transition hover:border-[#d9d3c8] disabled:cursor-wait disabled:opacity-75"
            >
              <span className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white shadow-[0_6px_16px_rgba(26,26,46,0.08)]">
                  <FiCrosshair className="text-[17px] text-[#1a1a2e]" />
                </span>
                <span>
                  <span className="block text-[15px] font-semibold leading-[1.3]">
                    {isResolvingLocation ? "Finding your location..." : "Get current location"}
                  </span>
                  <span className="block text-[12px] text-[#7c8495]">
                    Best for showing what&apos;s available around you
                  </span>
                </span>
              </span>
              <FiChevronRight className="text-[17px] text-[#1a1a2e]" />
            </button>

            {previewLabel ? (
              <div className="rounded-[20px] border border-[#efe7db] bg-[linear-gradient(135deg,_#fff8f8,_#ffffff_58%,_#fff4f4)] px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-[#ff385c] shadow-[0_6px_16px_rgba(255,56,92,0.12)]">
                    <FiMapPin className="text-[16px]" />
                  </span>
                  <div className="min-w-0">
                    <p className="mb-0.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9ba3b4]">
                      Delivery area
                    </p>
                    <p className="truncate text-[15px] font-semibold tracking-[-0.02em] text-[#111827]">
                      {previewLabel}
                    </p>
                    {coordinates && (
                      <p className="text-[12px] text-[#6b7280]">Using your live position for nearby results.</p>
                    )}
                  </div>
                </div>
              </div>
            ) : null}

            {statusMessage ? (
              <p className="rounded-2xl border border-[#dcefe4] bg-[#f4fff7] px-4 py-3 text-[14px] text-[#18794e]">
                {statusMessage}
              </p>
            ) : null}

            {errorMessage ? (
              <p className="rounded-2xl border border-[#ffd5dc] bg-[#fff4f6] px-4 py-3 text-[14px] text-[#c62845]">
                {errorMessage}
              </p>
            ) : null}
          </div>
        </div>

        <div className="border-t border-[#f1ede6] bg-white px-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4 sm:px-8 sm:pb-6 sm:pt-5">
          <button
            type="button"
            onClick={handleSubmit}
            className="h-[56px] w-full rounded-full bg-[#1a1a2e] px-6 text-[16px] font-semibold text-white shadow-[0_12px_30px_rgba(26,26,46,0.15)] transition hover:translate-y-[-1px]"
          >
            {submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
