const fallbackBaseUrl = "https://www.swippednetwork.com";

export function getApiBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
  if (fromEnv) {
    return fromEnv.replace(/\/+$/, "");
  }
  return fallbackBaseUrl;
}
