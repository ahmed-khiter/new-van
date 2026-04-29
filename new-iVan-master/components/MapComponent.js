"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useGoogleMaps } from "@/hooks/useGoogleMaps";

export default function MapComponent({
  pickupLocation,
  dropoffLocation,
  onPickupSelect,
  onDropoffSelect,
  hide = {}, // Object to hide specific elements: { dropoff: true, clear: true, tip: true }
  showAvailableDrivers = false, // Show available driver markers when searching
  category = null, // Category to determine icon type (Locksmith, Cleaning, Car Key Replacement use 👤, others use car)
}) {
  const t = useTranslations("MapComponent");
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const pickupMarkerRef = useRef(null);
  const dropoffMarkerRef = useRef(null);
  const directionsRendererRef = useRef(null);
  const availableDriverMarkersRef = useRef([]);

  useEffect(() => {
    // Initialize map when Google Maps is available
    const initMap = () => {
      if (!mapRef.current || !window.google) return;

      setIsLoading(false);

      // Initialize map centered on London (bounds restriction is handled by useGoogleMaps hook)
      const map = new window.google.maps.Map(mapRef.current, {
        center: { lat: 51.5074, lng: -0.1278 },
        zoom: 10,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        styles: [
          {
            featureType: "poi",
            elementType: "labels",
            stylers: [{ visibility: "off" }],
          },
        ],
      });

      mapInstanceRef.current = map;
      setIsMapLoaded(true);

      // Initialize directions renderer
      directionsRendererRef.current = new window.google.maps.DirectionsRenderer(
        {
          suppressMarkers: true, // We'll add our own markers
          polylineOptions: {
            strokeColor: "#3b82f6",
            strokeWeight: 4,
          },
        }
      );
      directionsRendererRef.current.setMap(map);

      // Add click listener to map
      map.addListener("click", (event) => {
        const lat = event.latLng.lat();
        const lng = event.latLng.lng();

        // Reverse geocode to get address
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ location: { lat, lng } }, (results, status) => {
          if (status === "OK" && results[0]) {
            const address = results[0].formatted_address;
            let postcode = "";
            const addressComponents = results[0].address_components;
            for (let i = 0; i < addressComponents.length; i++) {
              const component = addressComponents[i];
              if (component.types.includes("postal_code")) {
                postcode = component.long_name;
                break;
              }
            }
            const location = { lat, lng, address, postcode };

            // Alternate between pickup and dropoff
            if (!pickupLocation) {
              onPickupSelect?.(location);
            } else if (!dropoffLocation) {
              onDropoffSelect?.(location);
            } else {
              // If both locations are set, ask user which one to replace
              if (confirm(t("confirm_replace_locations"))) {
                onPickupSelect?.(location);
              } else {
                onDropoffSelect?.(location);
              }
            }
          }
        });
      });
    };

    // Check if Google Maps is already loaded
    if (window.google && window.google.maps) {
      initMap();
    } else {
      // Load Google Maps API if not already loaded
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        // Wait a bit for Google Maps to fully initialize
        setTimeout(() => {
          if (window.google && window.google.maps) {
            initMap();
          }
        }, 100);
      };
      script.onerror = () => {
        console.error("Failed to load Google Maps API");
      };
      document.head.appendChild(script);
    }
  }, []);

  // Generate available driver positions around pickup location
  const generateAvailableDriverPositions = (centerLat, centerLng, count = 5) => {
    const positions = [];
    const radiusKm = 0.05; // 50 meters radius
    const kmPerDegree = 111; // Approximate km per degree of latitude
    
    for (let i = 0; i < count; i++) {
      // Generate random angle
      const angle = Math.random() * 2 * Math.PI;
      // Generate random distance within radius
      const distance = Math.random() * radiusKm;
      
      // Calculate offset in degrees
      const latOffset = (distance * Math.cos(angle)) / kmPerDegree;
      const lngOffset = (distance * Math.sin(angle)) / (kmPerDegree * Math.cos(centerLat * Math.PI / 180));
      
      positions.push({
        lat: centerLat + latOffset,
        lng: centerLng + lngOffset,
      });
    }
    
    return positions;
  };

  // Update markers and directions when locations change
  useEffect(() => {
    if (!isMapLoaded || !mapInstanceRef.current) return;

    const map = mapInstanceRef.current;

    // Clear existing markers
    if (pickupMarkerRef.current) {
      pickupMarkerRef.current.setMap(null);
    }
    if (dropoffMarkerRef.current) {
      dropoffMarkerRef.current.setMap(null);
    }
    
    // Clear available driver markers
    availableDriverMarkersRef.current.forEach(marker => {
      if (marker) marker.setMap(null);
    });
    availableDriverMarkersRef.current = [];

    // Add pickup marker
    if (pickupLocation) {
      const pickupLat = parseFloat(pickupLocation.lat);
      const pickupLng = parseFloat(pickupLocation.lng);
      
      if (!isNaN(pickupLat) && !isNaN(pickupLng)) {
        pickupMarkerRef.current = new window.google.maps.Marker({
          position: { lat: pickupLat, lng: pickupLng },
          map: map,
          title: t("pickup_title"),
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: "#3b82f6",
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeWeight: 2,
          },
          label: {
            text: "P",
            color: "#ffffff",
            fontSize: "12px",
            fontWeight: "bold",
          },
        });
      }
    }

    // Add dropoff marker
    if (dropoffLocation) {
      const dropoffLat = parseFloat(dropoffLocation.lat);
      const dropoffLng = parseFloat(dropoffLocation.lng);
      
      if (!isNaN(dropoffLat) && !isNaN(dropoffLng)) {
        dropoffMarkerRef.current = new window.google.maps.Marker({
          position: { lat: dropoffLat, lng: dropoffLng },
          map: map,
          title: t("dropoff_title"),
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: "#ef4444",
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeWeight: 2,
          },
          label: {
            text: "D",
            color: "#ffffff",
            fontSize: "12px",
            fontWeight: "bold",
          },
        });
      }
    }

    // Show route if both locations are set
    if (pickupLocation && dropoffLocation && directionsRendererRef.current) {
      const pickupLat = parseFloat(pickupLocation.lat);
      const pickupLng = parseFloat(pickupLocation.lng);
      const dropoffLat = parseFloat(dropoffLocation.lat);
      const dropoffLng = parseFloat(dropoffLocation.lng);
      
      if (!isNaN(pickupLat) && !isNaN(pickupLng) && !isNaN(dropoffLat) && !isNaN(dropoffLng)) {
        const directionsService = new window.google.maps.DirectionsService();
        directionsService.route(
          {
            origin: { lat: pickupLat, lng: pickupLng },
            destination: { lat: dropoffLat, lng: dropoffLng },
            travelMode: window.google.maps.TravelMode.DRIVING,
          },
          (result, status) => {
            if (status === "OK") {
              directionsRendererRef.current.setDirections(result);
            }
          }
        );
      }
    } else if (directionsRendererRef.current) {
      directionsRendererRef.current.setDirections({ routes: [] });
    }

    // Fit bounds if both locations are set
    if (pickupLocation && dropoffLocation) {
      const bounds = new window.google.maps.LatLngBounds();
      const pickupLat = parseFloat(pickupLocation.lat);
      const pickupLng = parseFloat(pickupLocation.lng);
      const dropoffLat = parseFloat(dropoffLocation.lat);
      const dropoffLng = parseFloat(dropoffLocation.lng);
      
      if (!isNaN(pickupLat) && !isNaN(pickupLng) && !isNaN(dropoffLat) && !isNaN(dropoffLng)) {
        bounds.extend({ lat: pickupLat, lng: pickupLng });
        bounds.extend({ lat: dropoffLat, lng: dropoffLng });
        map.fitBounds(bounds);
      }
    } else if (pickupLocation) {
      const pickupLat = parseFloat(pickupLocation.lat);
      const pickupLng = parseFloat(pickupLocation.lng);
      
      if (!isNaN(pickupLat) && !isNaN(pickupLng)) {
        map.setCenter({ lat: pickupLat, lng: pickupLng });
        map.setZoom(15);
      }
    } else if (dropoffLocation) {
      const dropoffLat = parseFloat(dropoffLocation.lat);
      const dropoffLng = parseFloat(dropoffLocation.lng);
      
      if (!isNaN(dropoffLat) && !isNaN(dropoffLng)) {
        map.setCenter({ lat: dropoffLat, lng: dropoffLng });
        map.setZoom(15);
      }
    }
  }, [pickupLocation, dropoffLocation, isMapLoaded]);

  // Add available driver markers when searching
  useEffect(() => {
    if (!isMapLoaded || !mapInstanceRef.current || !showAvailableDrivers || !pickupLocation) {
      // Clear available driver markers if not showing
      availableDriverMarkersRef.current.forEach(marker => {
        if (marker) marker.setMap(null);
      });
      availableDriverMarkersRef.current = [];
      return;
    }

    const map = mapInstanceRef.current;
    const pickupLat = parseFloat(pickupLocation.lat);
    const pickupLng = parseFloat(pickupLocation.lng);
    
    if (isNaN(pickupLat) || isNaN(pickupLng)) return;
    
    // Generate available driver positions
    const driverPositions = generateAvailableDriverPositions(pickupLat, pickupLng, 5);
    
    // Create markers for each available driver - always use person icon
    driverPositions.forEach((position) => {
      // Use modern person icon for all available drivers
      const svgIcon = `
        <svg width="32" height="32" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="1" stdDeviation="1" flood-opacity="0.3"/>
            </filter>
          </defs>
          <circle cx="16" cy="16" r="15" fill="#10b981" stroke="#ffffff" stroke-width="2.5" filter="url(#shadow)"/>
          <!-- Person head -->
          <circle cx="16" cy="11" r="3.5" fill="#ffffff"/>
          <!-- Person body -->
          <path d="M 16 14.5 Q 12 14.5 12 18 L 12 20 Q 12 21 13 21 L 19 21 Q 20 21 20 20 L 20 18 Q 20 14.5 16 14.5 Z" fill="#ffffff"/>
        </svg>
      `;
      const icon = {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svgIcon),
        scaledSize: new window.google.maps.Size(32, 32),
        anchor: new window.google.maps.Point(16, 16),
      };
      
      const marker = new window.google.maps.Marker({
        position: position,
        map: map,
        icon: icon,
        title: "Available driver",
        zIndex: 100, // Lower z-index so they appear behind pickup/dropoff markers
      });
      
      availableDriverMarkersRef.current.push(marker);
    });
  }, [showAvailableDrivers, pickupLocation, category, isMapLoaded]);

  const handleSetPickup = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;

          const geocoder = new window.google.maps.Geocoder();
          geocoder.geocode({ location: { lat, lng } }, (results, status) => {
            if (status === "OK" && results[0]) {
              const address = results[0].formatted_address;
              onPickupSelect?.({ lat, lng, address });
            } else {
              alert('Unable to get address for your location. Please try again or enter address manually.');
            }
          });
        },
        (error) => {
          let errorMessage = 'Unable to get your current location. ';
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage += 'Location access was denied. Please allow location access in your browser settings.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage += 'Your location is currently unavailable. Please check your internet connection.';
              break;
            case error.TIMEOUT:
              errorMessage += 'Location request timed out. Please try again.';
              break;
            default:
              errorMessage += 'An unknown error occurred.';
              break;
          }
          
          alert(errorMessage);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        }
      );
    } else {
      alert('Geolocation is not supported by this browser. Please enter your address manually.');
    }
  };

  const handleSetDropoff = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;

          const geocoder = new window.google.maps.Geocoder();
          geocoder.geocode({ location: { lat, lng } }, (results, status) => {
            if (status === "OK" && results[0]) {
              const address = results[0].formatted_address;
              onDropoffSelect?.({ lat, lng, address });
            } else {
              alert('Unable to get address for your location. Please try again or enter address manually.');
            }
          });
        },
        () => {
          alert(t("unable_get_location_dropoff"));
        }
      );
    } else {
      alert(t("geolocation_not_supported_dropoff"));
    }
  };

  const clearLocations = () => {
    onPickupSelect?.(null);
    onDropoffSelect?.(null);
  };

  return (
    <div className="space-y-4">
      <>
        <div ref={mapRef} className="w-full h-full rounded-lg overflow-hidden" style={{ minHeight: '320px' }} />

        {/* Location Controls */}
        {/* <div className="flex flex-wrap gap-2">
          {!hide.pickup && (
            <button
              onClick={handleSetPickup}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-colors"
            >
              {t("set_pickup_current")}
            </button>
          )}
          {!hide.dropoff && (
            <button
              onClick={handleSetDropoff}
              className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 transition-colors"
            >
              {t("set_dropoff_current")}
            </button>
          )}
          {!hide.clear && (
            <button
              onClick={clearLocations}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg text-sm hover:bg-gray-600 transition-colors"
            >
              {t("clear_all")}
            </button>
          )}
        </div> */}

        {/* Instructions */}
        {/* {!hide.tip && (
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-800">
              💡 <strong>{t("tip_title")}</strong> {t("tip_description")}
            </p>
          </div>
        )} */}
      </>
    </div>
  );
}
