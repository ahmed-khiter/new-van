import Constants from "expo-constants";
import { Platform } from "react-native";

const PROXY_PORT = 3001;

export function getApiBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_BASE_URL?.trim().replace(/\/+$/, "");

  // On web, requests are same-origin via the dev server proxy
  if (Platform.OS === "web") {
    if (typeof window !== "undefined") return window.location.origin;
    if (fromEnv) return fromEnv;
  }

  // On mobile, localhost doesn't point to the dev machine — derive the IP
  // from Expo's dev server host so the proxy is reachable over the LAN
  const hostUri = Constants.expoConfig?.hostUri; // e.g. "192.168.1.5:8081"
  if (hostUri) {
    const ip = hostUri.split(":")[0];
    if (ip && ip !== "localhost" && ip !== "127.0.0.1") {
      return `http://${ip}:${PROXY_PORT}`;
    }
  }

  // Explicit env override (e.g. production URL, or LAN IP set manually)
  if (fromEnv && !fromEnv.includes("localhost") && !fromEnv.includes("127.0.0.1")) {
    return fromEnv;
  }

  return "https://www.swippednetwork.com";
}
