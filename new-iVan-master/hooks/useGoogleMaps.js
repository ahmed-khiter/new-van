import { useState, useEffect } from 'react';
import { getBoundingBox } from '@/utils/helper';

// Helper function to get selected location from localStorage
const getSelectedLocation = () => {
  try {
    const savedLocation = localStorage.getItem('selectedLocation');
    return savedLocation ? JSON.parse(savedLocation) : null;
  } catch (error) {
    console.error('Error parsing selected location from localStorage:', error);
    return null;
  }
};

export const useGoogleMaps = () => {
  const [isGoogleMapsLoaded, setIsGoogleMapsLoaded] = useState(false);
  const [apiKey] = useState(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY);
  const [mapBounds, setMapBounds] = useState(null);
  const [userSelectedLocation, setUserSelectedLocation] = useState(null);
  // Function to apply bounds restriction to Google Maps
  const applyBoundsRestriction = () => {
    if (!window.google || !window.google.maps || !mapBounds) return;
    
    // Override Google Maps default behavior to restrict bounds
    const originalMapConstructor = window.google.maps.Map;
    
    window.google.maps.Map = function(element, options) {
      const map = new originalMapConstructor(element, {
        ...options,
        restriction: {
          latLngBounds: {
            north: mapBounds.north,
            south: mapBounds.south,
            east: mapBounds.east,
            west: mapBounds.west,
          },
          strictBounds: true,
        },
      });
      
      console.log('Applied bounds restriction to Google Maps:', mapBounds);
      return map;
    };
    
    // Copy static properties from original constructor
    Object.setPrototypeOf(window.google.maps.Map, originalMapConstructor);
    Object.setPrototypeOf(window.google.maps.Map.prototype, originalMapConstructor.prototype);
  };

  useEffect(() => {
    // Get selected location and calculate bounds first
    const selectedLocation = getSelectedLocation();
    if (selectedLocation && selectedLocation.lat && selectedLocation.lng) {
      const bounds = getBoundingBox(selectedLocation.lat, selectedLocation.lng, 200);
      // Convert helper format to Google Maps format
      const googleMapsBounds = {
        north: bounds.maxLat,
        south: bounds.minLat,
        east: bounds.maxLng,
        west: bounds.minLng,
      };
      setMapBounds(googleMapsBounds);
      setUserSelectedLocation(selectedLocation);
      console.log('Restricting Google Maps to location:', selectedLocation.name, googleMapsBounds);
    } else {
      console.log('No selected location found, loading Google Maps with default bounds');
    }

    // Check if Google Maps is already loaded
    if (window.google && window.google.maps) {
      setIsGoogleMapsLoaded(true);
      return;
    }

    // Load Google Maps API if not already loaded
    if (apiKey) {
      const loadGoogleMaps = () => {
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry`;
        script.async = true;
        script.defer = true;
        script.onload = () => {
          console.log('Google Maps API loaded successfully');
          setIsGoogleMapsLoaded(true);
          
          // Apply bounds restriction to Google Maps if we have bounds
          if (mapBounds) {
            applyBoundsRestriction();
          }
        };
        script.onerror = () => {
          console.error('Failed to load Google Maps API');
          setIsGoogleMapsLoaded(false);
        };
        document.head.appendChild(script);
      };

      loadGoogleMaps();
    }
  }, [apiKey]);

  // Apply bounds restriction when mapBounds changes and Google Maps is loaded
  useEffect(() => {
    if (isGoogleMapsLoaded && mapBounds) {
      applyBoundsRestriction();
    }
  }, [isGoogleMapsLoaded, mapBounds]);

  return {
    isGoogleMapsLoaded,
    apiKey,
    mapBounds,
    userSelectedLocation
  };
};
