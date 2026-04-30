import { apiGet } from "@/src/shared/api/httpClient";
import type { HomeServicesResponse, Location, StatsResponse } from "@/src/shared/types/home";

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
