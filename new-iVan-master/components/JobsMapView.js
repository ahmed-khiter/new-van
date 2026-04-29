"use client";

import { useEffect, useRef, useState } from "react";
import { useGoogleMaps } from "@/hooks/useGoogleMaps";
import { formatAmountToCurrency, getServiceName, getServiceIconPath, formatDistanceToNow } from "@/utils/helper";

export default function JobsMapView({ jobs, onJobClick }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const infoWindowsRef = useRef([]);
  const clickHandlerRef = useRef(null);
  const { isGoogleMapsLoaded } = useGoogleMaps();
  const [isMapInitialized, setIsMapInitialized] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const escapeHtml = (text) => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  };

  const createInfoWindowContent = (job, mobile = false) => {
    const jobTitle = escapeHtml(job.title || "Untitled Job");
    const serviceName = escapeHtml(getServiceName(job.category));
    const serviceIcon = getServiceIconPath(job.category);
    const timeAgo = escapeHtml(formatDistanceToNow(job.createdAt));
    const price = job.price ? escapeHtml(formatAmountToCurrency(job.price)) : "N/A";
    const city = job.pickupCity ? escapeHtml(job.pickupCity) : "";

    const fontSize = mobile ? '14px' : '16px';
    const smallFontSize = mobile ? '12px' : '14px';
    const buttonPadding = mobile ? '12px 16px' : '10px 16px';

    return `
      <div style="
       
        box-sizing: border-box;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        overflow: hidden;
      ">
        <h4 style="
          font-weight: 600;
          font-size: ${fontSize};
          margin: 0 0 ${mobile ? '8px' : '8px'} 0;
          color: #1f2937;
          line-height: 1.4;
          word-wrap: break-word;
          overflow-wrap: break-word;
          hyphens: auto;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        ">
          ${jobTitle}
        </h4>
        <div style="
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: ${mobile ? '6px' : '6px'};
          color: #6b7280;
          font-size: ${smallFontSize};
          flex-wrap: wrap;
        ">
          <img 
            src="${serviceIcon}" 
            alt="${serviceName}" 
            style="width: ${mobile ? '16px' : '16px'}; height: ${mobile ? '16px' : '16px'}; object-fit: contain; flex-shrink: 0;" 
          />
          <span style="word-break: break-word; line-height: 1.3;">${serviceName}</span>
        </div>
        <div style="
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: ${mobile ? '6px' : '6px'};
          color: #6b7280;
          font-size: ${mobile ? '11px' : '12px'};
          line-height: 1.3;
        ">
          <svg width="${mobile ? '14' : '14'}" height="${mobile ? '14' : '14'}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
          <span>${timeAgo}</span>
        </div>
        <div style="
          font-weight: 600;
          color: #1f2937;
          margin-bottom: ${mobile ? '6px' : '6px'};
          font-size: ${smallFontSize};
          line-height: 1.3;
        ">
          ${price}
        </div>
        ${city ? `
          <div style="
            color: #6b7280;
            font-size: ${mobile ? '11px' : '12px'};
            margin-bottom: ${mobile ? '10px' : '10px'};
            word-break: break-word;
            line-height: 1.3;
          ">
            From: ${city}
          </div>
        ` : ""}
        <button 
          id="job-btn-${job.id}"
          style="
            width: 100%;
            background-color: #2563eb;
            color: white;
            border: none;
            padding: ${buttonPadding};
            border-radius: 8px;
            font-weight: 500;
            cursor: pointer;
            font-size: ${smallFontSize};
            transition: background-color 0.2s, transform 0.1s;
            touch-action: manipulation;
            -webkit-tap-highlight-color: transparent;
            min-height: ${mobile ? '44px' : '40px'};
            display: flex;
            align-items: center;
            justify-content: center;
            user-select: none;
            white-space: nowrap;
          "
          onmouseover="this.style.backgroundColor='#1d4ed8'; this.style.transform='scale(0.98)'"
          onmouseout="this.style.backgroundColor='#2563eb'; this.style.transform='scale(1)'"
          ontouchstart="this.style.backgroundColor='#1d4ed8'; this.style.transform='scale(0.98)'"
          ontouchend="this.style.backgroundColor='#2563eb'; this.style.transform='scale(1)'"
        >
          View & Book
        </button>
      </div>
    `;
  };

  const calculateMarkerOffset = (lat, lng, count) => {
    const offsetDistance = 0.0001;
    const angle = (count * 60) * (Math.PI / 180);
    return {
      lat: lat + (count > 0 ? offsetDistance * Math.cos(angle) : 0),
      lng: lng + (count > 0 ? offsetDistance * Math.sin(angle) : 0)
    };
  };

  const createMarkerIcon = (isOverlapping) => ({
    path: window.google.maps.SymbolPath.CIRCLE,
    scale: isOverlapping ? 14 : 12,
    fillColor: "#3b82f6",
    fillOpacity: 1,
    strokeColor: "#ffffff",
    strokeWeight: 2,
  });

  const fitMapBounds = (map, bounds, markers) => {
    if (markers.length === 1) {
      map.setCenter(markers[0].getPosition());
      map.setZoom(14);
      return;
    }

    try {
      const boundsNorth = bounds.getNorthEast().lat();
      const boundsSouth = bounds.getSouthWest().lat();
      const boundsEast = bounds.getNorthEast().lng();
      const boundsWest = bounds.getSouthWest().lng();
      
      const latDiff = Math.abs(boundsNorth - boundsSouth);
      const lngDiff = Math.abs(boundsEast - boundsWest);
      
      if (latDiff < 0.001 && lngDiff < 0.001) {
        map.setCenter({ 
          lat: (boundsNorth + boundsSouth) / 2, 
          lng: (boundsEast + boundsWest) / 2 
        });
        map.setZoom(15);
      } else {
        map.fitBounds(bounds, { padding: 50 });
      }
    } catch (error) {
      console.error('Error fitting bounds:', error);
      if (markers.length > 0) {
        map.setCenter(markers[0].getPosition());
        map.setZoom(14);
      }
    }
  };

  const clearMarkers = () => {
    markersRef.current.forEach((marker) => {
      if (marker) marker.setMap(null);
    });
    infoWindowsRef.current.forEach((infoWindow) => {
      if (infoWindow) infoWindow.close();
    });
    markersRef.current = [];
    infoWindowsRef.current = [];
  };

  useEffect(() => {
    if (!isGoogleMapsLoaded || !mapRef.current || !window.google) return;

    const initMap = () => {
      if (mapInstanceRef.current) return;

      const map = new window.google.maps.Map(mapRef.current, {
        center: { lat: 0, lng: 0 },
        zoom: 2,
        mapTypeControl: true,
        streetViewControl: false,
        fullscreenControl: true,
        styles: [{
          featureType: "poi",
          elementType: "labels",
          stylers: [{ visibility: "off" }],
        }],
      });

      mapInstanceRef.current = map;
      setIsMapInitialized(true);
    };

    initMap();
  }, [isGoogleMapsLoaded]);

  useEffect(() => {
    if (!isMapInitialized || !mapInstanceRef.current || !window.google) return;

    const map = mapInstanceRef.current;
    clearMarkers();

    const bounds = new window.google.maps.LatLngBounds();
    let hasValidLocations = false;
    const positionCounts = new Map();

    jobs.forEach((job) => {
      let lat = job.pickupLat ?? job.pickup_lat ?? null;
      let lng = job.pickupLng ?? job.pickup_lng ?? null;

      if (lat === null || lat === undefined || lat === '' || 
          lng === null || lng === undefined || lng === '') {
        return;
      }

      lat = parseFloat(lat);
      lng = parseFloat(lng);

      if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) {
        return;
      }

      const positionKey = `${lat.toFixed(4)}_${lng.toFixed(4)}`;
      const count = positionCounts.get(positionKey) || 0;
      positionCounts.set(positionKey, count + 1);
      
      const offset = calculateMarkerOffset(lat, lng, count);
      const position = { lat: offset.lat, lng: offset.lng };
      const originalPosition = { lat, lng };
      
      bounds.extend(originalPosition);
      hasValidLocations = true;

      const marker = new window.google.maps.Marker({
        position: position,
        map: map,
        icon: createMarkerIcon(count > 0),
        title: count > 0 ? `${job.title} (${count + 1} jobs at this location)` : job.title,
        animation: window.google.maps.Animation.DROP,
        originalPosition: originalPosition,
      });

      const currentIsMobile = typeof window !== 'undefined' && window.innerWidth < 768;
      const infoContent = createInfoWindowContent(job, currentIsMobile);
      const maxWidth = currentIsMobile ? Math.min(window.innerWidth - 32, 360) : 360;
      const infoWindow = new window.google.maps.InfoWindow({
        content: infoContent,
        maxWidth: maxWidth,
        pixelOffset: new window.google.maps.Size(0, -10),
      });

      clickHandlerRef.current = onJobClick;

      marker.addListener("click", () => {
        infoWindowsRef.current.forEach((iw) => {
          if (iw && iw !== infoWindow) iw.close();
        });
        infoWindow.open(map, marker);
      });

      infoWindow.addListener("domready", () => {
        const button = document.getElementById(`job-btn-${job.id}`);
        if (button && clickHandlerRef.current) {
          const newButton = button.cloneNode(true);
          button.parentNode.replaceChild(newButton, button);
          
          newButton.addEventListener('click', () => {
            if (clickHandlerRef.current) {
              clickHandlerRef.current(job);
              infoWindow.close();
            }
          });
        }
      });

      markersRef.current.push(marker);
      infoWindowsRef.current.push(infoWindow);
    });

    if (hasValidLocations && markersRef.current.length > 0) {
      fitMapBounds(map, bounds, markersRef.current);
    }
  }, [jobs, isMapInitialized, onJobClick]);

  useEffect(() => {
    clickHandlerRef.current = onJobClick;
  }, [onJobClick]);

  useEffect(() => {
    return () => {
      clearMarkers();
    };
  }, []);

  if (!isGoogleMapsLoaded) {
    return (
      <div className="w-full h-[600px] flex items-center justify-center bg-gray-100 rounded-lg">
        <div className="text-center">
          <div className="spinner-border text-blue-600" role="status">
            <span className="visually-hidden">Loading map...</span>
          </div>
          <p className="mt-2 text-gray-600">Loading map...</p>
        </div>
      </div>
    );
  }

  const jobsWithLocation = jobs.filter(job => 
    job.pickupLat && job.pickupLng && 
    !isNaN(parseFloat(job.pickupLat)) && 
    !isNaN(parseFloat(job.pickupLng))
  );

  return (
    <div className="w-full relative">
      <div ref={mapRef} className="w-full h-[400px] sm:h-[500px] md:h-[600px] rounded-lg overflow-hidden border border-gray-200" />
      {jobsWithLocation.length === 0 && jobs.length > 0 && (
        <div className="mt-4 text-center text-gray-500">
          <span className="text-2xl block mb-2">📍</span>
          <p className="text-sm sm:text-base">No jobs with location data to display on map</p>
        </div>
      )}
    </div>
  );
}
