"use client";

import { useEffect, useMemo, useState } from "react";

export default function useServicesCatalog() {
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [servicesCatalog, setServicesCatalog] = useState([]);

  useEffect(() => {
    const loadLocation = () => {
      try {
        const savedLocation = localStorage.getItem("selectedLocation");
        setSelectedLocation(savedLocation ? JSON.parse(savedLocation) : null);
      } catch {
        setSelectedLocation(null);
      }
    };

    loadLocation();
    window.addEventListener("locationChanged", loadLocation);
    window.addEventListener("storage", loadLocation);
    return () => {
      window.removeEventListener("locationChanged", loadLocation);
      window.removeEventListener("storage", loadLocation);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const fetchCatalog = async () => {
      try {
        const q = selectedLocation?.code
          ? `?locationCode=${encodeURIComponent(selectedLocation.code)}`
          : "";
        const res = await fetch(`/api/public/home-services${q}`);
        const data = await res.json();
        if (cancelled) return;
        setServicesCatalog(Array.isArray(data?.catalog) ? data.catalog : []);
      } catch {
        if (!cancelled) setServicesCatalog([]);
      }
    };
    fetchCatalog();
    return () => {
      cancelled = true;
    };
  }, [selectedLocation?.code]);

  const serviceMap = useMemo(
    () => Object.fromEntries(servicesCatalog.map((s) => [s.id, s])),
    [servicesCatalog]
  );

  return { servicesCatalog, serviceMap };
}
