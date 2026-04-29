"use client";
import { getLocationOptions } from "@/utils/helper";

export default function useSavedLocation(defaultRadius = 10) {
  if (typeof window === "undefined") {
    return { savedLocation: null, savedLocationFilter: null };
  }

  try {
    const saved = localStorage.getItem("selectedLocation");
    if (!saved) {
      return { savedLocation: null, savedLocationFilter: null };
    }

    const location = JSON.parse(saved);
    const locationData = getLocationOptions(location.id);

    if (!locationData) {
      return { savedLocation: null, savedLocationFilter: null };
    }

    return {
      savedLocation: location,
      savedLocationFilter: {
        location: {
          lat: locationData.lat,
          lng: locationData.lng,
          address: locationData.address,
          postCode: location.postCode,
        },
        radius: defaultRadius,
      },
    };
  } catch (error) {
    console.error("Error parsing saved location:", error);
    return { savedLocation: null, savedLocationFilter: null };
  }
}
