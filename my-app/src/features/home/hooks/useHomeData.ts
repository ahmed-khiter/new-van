import { useEffect, useMemo, useState } from "react";
import { fetchHomeServices, fetchSession, fetchStats } from "../api/home.api";
import type { HomeServicesResponse, Location } from "@/src/shared/types/home";

const EMPTY_SECTIONS: HomeServicesResponse = {
  ordering: [],
  reservation: [],
  booking: [],
  catalog: [],
};

export function useHomeData(location: Location | null) {
  const [sections, setSections] = useState<HomeServicesResponse>(EMPTY_SECTIONS);
  const [globalUserCount, setGlobalUserCount] = useState<number | null>(null);
  const [locationUserCount, setLocationUserCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const locationKey = `${location?.code ?? ""}:${location?.lat ?? ""}:${location?.lng ?? ""}`;

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      setLoading(true);
      setError(null);

      try {
        const shouldFetchScopedServices = Boolean(location?.code);
        const shouldFetchScopedStats = Boolean(location?.lat && location?.lng);

        const [
          ,
          baseServices,
          baseStats,
          scopedServices,
          scopedStats,
        ] = await Promise.all([
          fetchSession(),
          fetchHomeServices(),
          fetchStats(),
          shouldFetchScopedServices ? fetchHomeServices(location?.code) : Promise.resolve(null),
          shouldFetchScopedStats ? fetchStats(location) : Promise.resolve(null),
        ]);

        if (cancelled) return;

        const services = scopedServices ?? baseServices;
        const stats = scopedStats ?? baseStats;

        setSections({
          ordering: services.ordering ?? [],
          reservation: services.reservation ?? [],
          booking: services.booking ?? [],
          catalog: services.catalog ?? [],
        });
        setGlobalUserCount(typeof stats.globalUserCount === "number" ? stats.globalUserCount : null);
        setLocationUserCount(
          typeof stats.locationUserCount === "number" ? stats.locationUserCount : null,
        );
      } catch (e) {
        if (cancelled) return;
        setSections(EMPTY_SECTIONS);
        setGlobalUserCount(null);
        setLocationUserCount(null);
        setError(e instanceof Error ? e.message : "Failed to load homepage data");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadData();
    return () => {
      cancelled = true;
    };
  }, [location, locationKey]);

  const totalServices = useMemo(() => sections.catalog.length, [sections.catalog.length]);

  return {
    sections,
    totalServices,
    globalUserCount,
    locationUserCount,
    loading,
    error,
  };
}
