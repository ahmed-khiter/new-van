/** Production API (no trailing slash; paths are joined in httpClient). */
export const API_ORIGIN = "https://dev.swippped.com";

export function getApiBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_BASE_URL?.trim().replace(/\/+$/, "");

  // If an explicit environment variable is set, use it
  if (fromEnv) {
    return fromEnv;
  }

  // Default to the remote development server for all platforms (Web, Android, iOS)
  return API_ORIGIN;
}
