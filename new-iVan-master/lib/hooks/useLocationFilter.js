"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { getUserRegionByCoordinates, regionBounds } from "@/utils/helper";

const LOCATION_FILTER_STORAGE_KEY = "locationFilter";

// Helper function to check if coordinates are in United States
const isInUnitedStates = (lat, lng) => {
  if (!lat || !lng) return false;
  const usBounds = regionBounds.US;
  return (
    lat >= usBounds.south &&
    lat <= usBounds.north &&
    lng >= usBounds.west &&
    lng <= usBounds.east
  );
};

// Helper function to reverse geocode and get country
const getCountryFromCoordinates = async (lat, lng) => {
  if (typeof window === "undefined" || !window.google?.maps?.Geocoder) {
    return null;
  }

  return new Promise((resolve) => {
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === "OK" && results[0]) {
        const countryComponent = results[0].address_components.find((c) =>
          c.types.includes("country")
        );
        if (countryComponent) {
          resolve(countryComponent.short_name);
        } else {
          resolve(null);
        }
      } else {
        resolve(null);
      }
    });
  });
};

export default function useLocationFilter() {
  const { data: session, status } = useSession();
  const [locationFilter, setLocationFilter] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [isInUS, setIsInUS] = useState(false);

  // Load location filter from customer profile (after login) or localStorage (before login)
  useEffect(() => {
    const loadLocationFilter = async () => {
      setIsLoading(true);
      
      try {
        // If user is logged in, ALWAYS use customer location (ignore localStorage)
        if (status === "authenticated" && session?.user) {
          try {
            const response = await fetch("/api/profile", {
              headers: {
                "user-id": session.user.id,
                role: session.user.role,
              },
            });

            if (response.ok) {
              const data = await response.json();
              const customerAddress = data.profile?.address1 || data.profile?.address;
              const customerLat = data.profile?.latitude;
              const customerLng = data.profile?.longitude;
              const customerPostCode = data.profile?.postCode || data.profile?.postcode;
              const customerCountry = data.profile?.country;

              // If customer has location data, use it
              if (customerAddress && customerLat && customerLng) {
                const lat = parseFloat(customerLat);
                const lng = parseFloat(customerLng);
                
                // Check if location is in United States
                const inUS = isInUnitedStates(lat, lng);
                setIsInUS(inUS);

                // If not in US, try to get country from geocoding
                if (!inUS && typeof window !== "undefined") {
                  const countryCode = await getCountryFromCoordinates(lat, lng);
                  if (countryCode === "US") {
                    setIsInUS(true);
                  }
                } else if (!inUS) {
                  // If we can't check via geocoding, check address string
                  const addressLower = customerAddress.toLowerCase();
                  const countryLower = customerCountry?.toLowerCase() || "";
                  if (
                    addressLower.includes("united states") ||
                    addressLower.includes("usa") ||
                    addressLower.includes("us,") ||
                    countryLower === "us" ||
                    countryLower === "usa"
                  ) {
                    setIsInUS(true);
                  }
                }

                const customerFilter = {
                  location: {
                    lat: lat,
                    lng: lng,
                    address: customerAddress,
                    postCode: customerPostCode || "",
                  },
                  radius: 10, // Default radius
                };
                setLocationFilter(customerFilter);
                // Save to localStorage for persistence (but won't be used if logged in)
                localStorage.setItem(
                  LOCATION_FILTER_STORAGE_KEY,
                  JSON.stringify(customerFilter)
                );
                setIsLoading(false);
                return;
              }
            }
          } catch (error) {
            console.error("Error fetching customer profile:", error);
          }
        }

        // If not logged in, check localStorage for saved filter
        const savedFilter = localStorage.getItem(LOCATION_FILTER_STORAGE_KEY);
        if (savedFilter) {
          try {
            const parsedFilter = JSON.parse(savedFilter);
            setLocationFilter(parsedFilter);
            setIsLoading(false);
            return;
          } catch (error) {
            console.error("Error parsing saved location filter:", error);
            localStorage.removeItem(LOCATION_FILTER_STORAGE_KEY);
          }
        }

        // No saved filter and no customer location - locationFilter remains null
        setLocationFilter(null);
      } catch (error) {
        console.error("Error loading location filter:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadLocationFilter();
  }, [session, status]);

  // Save location filter to localStorage
  const saveLocationFilter = (filter) => {
    if (filter) {
      localStorage.setItem(LOCATION_FILTER_STORAGE_KEY, JSON.stringify(filter));
      setLocationFilter(filter);
    } else {
      localStorage.removeItem(LOCATION_FILTER_STORAGE_KEY);
      setLocationFilter(null);
    }
  };

  // Clear location filter
  const clearLocationFilter = () => {
    localStorage.removeItem(LOCATION_FILTER_STORAGE_KEY);
    setLocationFilter(null);
  };

  return {
    locationFilter,
    setLocationFilter: saveLocationFilter,
    clearLocationFilter,
    isLoading,
    showLocationModal,
    setShowLocationModal,
    isInUS,
  };
}

