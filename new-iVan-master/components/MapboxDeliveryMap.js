"use client";

import { useRef, useEffect } from "react";

const MAPBOX_TOKEN =
  process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || "";

const UK_CENTER = [-1.5, 52.5];
const UK_ZOOM = 5;
const MARKER_ZOOM = 14;

export default function MapboxDeliveryMap({ location, zoom = MARKER_ZOOM, className = "", style = {} }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const mapboxglRef = useRef(null);
  const locationRef = useRef(location);
  locationRef.current = location;

  useEffect(() => {
    if (!containerRef.current) return;

    let cancelled = false;

    import("mapbox-gl").then((mod) => {
      if (cancelled || !containerRef.current) return;
      const mapboxgl = mod.default;
      mapboxglRef.current = mapboxgl;
      import("mapbox-gl/dist/mapbox-gl.css");

      if (!MAPBOX_TOKEN) {
        console.error("Missing NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN for Mapbox.");
        return;
      }

      mapboxgl.accessToken = MAPBOX_TOKEN;
      const map = new mapboxgl.Map({
        container: containerRef.current,
        style: "mapbox://styles/mapbox/light-v11",
        center: UK_CENTER,
        zoom: UK_ZOOM,
        attributionControl: false,
      });

      mapRef.current = map;

      const lat = locationRef.current?.lat != null ? parseFloat(locationRef.current.lat) : null;
      const lng = locationRef.current?.lng != null ? parseFloat(locationRef.current.lng) : null;
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        map.flyTo({ center: [lng, lat], zoom, duration: 0 });
        const el = document.createElement("div");
        el.style.cssText = "width: 32px; height: 32px; background: #E31C5F; border: 3px solid #fff; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); box-shadow: 0 2px 8px rgba(0,0,0,0.25);";
        markerRef.current = new mapboxgl.Marker({ element: el }).setLngLat([lng, lat]).addTo(map);
      }
    });

    return () => {
      cancelled = true;
      if (mapRef.current) {
        markerRef.current?.remove();
        markerRef.current = null;
        mapboxglRef.current = null;
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const mapboxgl = mapboxglRef.current;
    if (!map || !mapboxgl) return;

    const lat = location?.lat != null ? parseFloat(location.lat) : null;
    const lng = location?.lng != null ? parseFloat(location.lng) : null;
    const hasCoords = Number.isFinite(lat) && Number.isFinite(lng);

    if (markerRef.current) {
      markerRef.current.remove();
      markerRef.current = null;
    }

    if (hasCoords) {
      const center = [lng, lat];
      map.flyTo({ center, zoom, duration: 800 });

      const el = document.createElement("div");
      el.className = "mapbox-delivery-marker";
      el.style.cssText = [
        "width: 32px; height: 32px;",
        "background: #E31C5F; border: 3px solid #fff;",
        "border-radius: 50% 50% 50% 0; transform: rotate(-45deg);",
        "box-shadow: 0 2px 8px rgba(0,0,0,0.25);",
      ].join(" ");
      markerRef.current = new mapboxgl.Marker({ element: el }).setLngLat(center).addTo(map);
    } else {
      map.flyTo({ center: UK_CENTER, zoom: UK_ZOOM, duration: 600 });
    }
  }, [location?.lat, location?.lng, zoom]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ width: "100%", height: "100%", minHeight: 180, ...style }}
    />
  );
}
