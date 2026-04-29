export type Location = {
  name: string;
  flag: string;
  code: string;
};

export type ServiceItem = {
  id: string;
  name: string;
  image: string;
};

export type PromoFeature = {
  id: string;
  title: string;
  description: string;
  color: string;
};

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

export const selectedLocation: Location = {
  name: "United Kingdom",
  flag: "🇬🇧",
  code: "GB",
};

export const stats = {
  totalServices: 42,
  globalUsers: 125600,
  nearbyUsers: 4300,
};

export const orderingServices: ServiceItem[] = [
  {
    id: "shop",
    name: "Retail Stores",
    image:
      "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "restaurant",
    name: "Restaurants",
    image:
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "supermarket",
    name: "Supermarkets",
    image:
      "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80",
  },
];

export const reservationServices: ServiceItem[] = [
  {
    id: "book-table",
    name: "Book a Table",
    image:
      "https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "spa",
    name: "Spa",
    image:
      "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "beauty",
    name: "Beauty",
    image:
      "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=600&q=80",
  },
];

export const bookingServices: ServiceItem[] = [
  {
    id: "cleaning",
    name: "Cleaning",
    image:
      "https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "repairs",
    name: "Repairs",
    image:
      "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "delivery",
    name: "Express Delivery",
    image:
      "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=80",
  },
];

export const featureGrid: PromoFeature[] = [
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

export const comingSoonItems: PromoFeature[] = [
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
