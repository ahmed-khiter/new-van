import type { Location, PromoFeature } from "@/features/home/types";

export const TYPEWRITER_PHRASES = [
  "restaurants nearby",
  "groceries delivered",
  "a taxi ride",
  "book a table",
  "cleaning & repairs",
  "retail stores near me",
  "supermarket delivery",
  "a spa appointment",
];

export const HERO_IMAGES = [
  "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=280&q=80",
  "https://images.unsplash.com/photo-1556742111-a301076d9d18?auto=format&fit=crop&w=240&q=80",
  "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=220&q=80",
  "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=260&q=80",
  "https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=240&q=80",
];

export const DEFAULT_LOCATION: Location = {
  name: "United Kingdom",
  flag: "🇬🇧",
  code: "GB",
  lat: 51.5074,
  lng: -0.1278,
};

export const LOCATION_OPTIONS: Location[] = [
  { code: "GB", name: "United Kingdom", flag: "🇬🇧", lat: 51.5074, lng: -0.1278 },
  { code: "US", name: "United States", flag: "🇺🇸", lat: 38.9072, lng: -77.0369 },
  { code: "SA", name: "Saudi Arabia", flag: "🇸🇦", lat: 24.7136, lng: 46.6753 },
  { code: "AE", name: "United Arab Emirates", flag: "🇦🇪", lat: 25.2048, lng: 55.2708 },
  { code: "EG", name: "Egypt", flag: "🇪🇬", lat: 30.0444, lng: 31.2357 },
  { code: "CY", name: "Cyprus", flag: "🇨🇾", lat: 35.1856, lng: 33.3823 },
  { code: "MA", name: "Morocco", flag: "🇲🇦", lat: 34.0209, lng: -6.8416 },
  { code: "AU", name: "Australia", flag: "🇦🇺", lat: -33.8688, lng: 151.2093 },
];

export const FEATURE_GRID: PromoFeature[] = [
  {
    id: "global",
    title: "Global Reach",
    description: "Access services in multiple countries.",
    color: "#DBEAFE",
  },
  {
    id: "trusted",
    title: "Trusted Partners",
    description: "Verified providers and quality support.",
    color: "#FCE7F3",
  },
  {
    id: "fast",
    title: "Fast Response",
    description: "Instant dispatch and quick booking.",
    color: "#D1FAE5",
  },
  {
    id: "rewards",
    title: "Rewards",
    description: "Earn points while using daily services.",
    color: "#EDE9FE",
  },
];

export const COMING_SOON_ITEMS: PromoFeature[] = [
  {
    id: "storage",
    title: "Luggage Storage",
    description: "Safe short-term storage near you.",
    color: "#FFF7ED",
  },
  {
    id: "smart-lockers",
    title: "Smart Lockers",
    description: "Secure pickup and drop-off points.",
    color: "#FEF3C7",
  },
  {
    id: "community",
    title: "Community Features",
    description: "Share, rate and follow local spots.",
    color: "#FCE4EC",
  },
];
