import { apiGet } from "@/services/httpClient";
import type { HomeServicesResponse, Location, StatsResponse } from "@/features/home/types";

export function fetchSession() {
  return apiGet<Record<string, unknown>>("/api/auth/session");
}

export function fetchHomeServices(locationCode?: string) {
  return apiGet<HomeServicesResponse>("/api/public/services", {
    params: { locationCode },
  });
}

export function fetchStats(location?: Location | null) {
  return apiGet<StatsResponse>("/api/stats", {
    params: {
      lat: location?.lat,
      lng: location?.lng,
    },
  });
}
