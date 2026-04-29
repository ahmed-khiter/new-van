export const SERVICE_CONFIG = {
  shop: {
    label: "Shop",
    labelPlural: "Shops",
    ownerLabel: "Shop Owner",
    dashboardTitle: "Shop Dashboard",
    detailsTitle: "Shop Details",
    hasProducts: true,
    hasOrders: true,
    hasReservations: false,
    icon: "bi-shop",
    route: "/shop",
    menuItems: ["dashboard", "products", "orders", "payouts"]
  },
  restaurant: {
    label: "Restaurant",
    labelPlural: "Restaurants",
    ownerLabel: "Restaurant Owner",
    dashboardTitle: "Restaurant Dashboard",
    detailsTitle: "Restaurant Details",
    hasProducts: true,
    hasOrders: true,
    hasReservations: true,
    reservationsLabel: "Reservations",
    icon: "bi-cup-hot",
    route: "/restaurant",
    menuItems: ["dashboard", "menu-items", "orders", "reservations", "payouts"]
  },
  mot: {
    label: "MOT Center",
    labelPlural: "MOT Centers",
    ownerLabel: "MOT Center Owner",
    dashboardTitle: "MOT Center Dashboard",
    detailsTitle: "MOT Center Details",
    hasProducts: true,
    hasOrders: false,
    hasReservations: true,
    reservationsLabel: "MOT & Repairs",
    icon: "bi-wrench-adjustable-circle",
    route: "/shop",
    menuItems: ["dashboard", "products", "reservations", "payouts"]
  },
  shisha: {
    label: "Shisha lounges",
    labelPlural: "Shisha lounges",
    ownerLabel: "Shisha lounges Owner",
    dashboardTitle: "Shisha lounges Dashboard",
    detailsTitle: "Shisha lounges Details",
    hasProducts: true,
    hasOrders: false,
    hasReservations: true,
    reservationsLabel: "Reservations",
    icon: "bi-cup-straw",
    route: "/shop",
    menuItems: ["dashboard", "products", "reservations", "payouts"]
  },
  spa: {
    label: "Spa",
    labelPlural: "Spas",
    ownerLabel: "Spa Owner",
    dashboardTitle: "Spa Dashboard",
    detailsTitle: "Spa Details",
    hasProducts: true,
    hasOrders: false,
    hasReservations: true,
    reservationsLabel: "Appointments",
    icon: "bi-flower1",
    route: "/shop",
    menuItems: ["dashboard", "products", "reservations", "payouts"]
  },
  beauty: {
    label: "Beauty Salon",
    labelPlural: "Beauty Salons",
    ownerLabel: "Beauty Salon Owner",
    dashboardTitle: "Beauty Salon Dashboard",
    detailsTitle: "Beauty Salon Details",
    hasProducts: true,
    hasOrders: false,
    hasReservations: true,
    reservationsLabel: "Appointments",
    icon: "bi-scissors",
    route: "/shop",
    menuItems: ["dashboard", "products", "reservations", "payouts"]
  },
  healthcare: {
    label: "Healthcare Provider",
    labelPlural: "Healthcare Providers",
    ownerLabel: "Healthcare Provider",
    dashboardTitle: "Healthcare Dashboard",
    detailsTitle: "Healthcare Details",
    hasProducts: true,
    hasOrders: false,
    hasReservations: true,
    reservationsLabel: "Appointments",
    icon: "bi-hospital",
    route: "/shop",
    menuItems: ["dashboard", "products", "reservations", "payouts"]
  },
  events: {
    label: "Events Provider",
    labelPlural: "Events Providers",
    ownerLabel: "Events Provider",
    dashboardTitle: "Events Dashboard",
    detailsTitle: "Events Details",
    hasProducts: true,
    hasOrders: false,
    hasReservations: true,
    reservationsLabel: "Bookings",
    icon: "bi-music-note-beamed",
    route: "/shop",
    menuItems: ["dashboard", "products", "reservations", "payouts"]
  },
  entertainment: {
    label: "Entertainment Venue",
    labelPlural: "Entertainment Venues",
    ownerLabel: "Entertainment Venue Owner",
    dashboardTitle: "Entertainment Dashboard",
    detailsTitle: "Entertainment Details",
    hasProducts: true,
    hasOrders: false,
    hasReservations: true,
    reservationsLabel: "Reservations",
    icon: "bi-joystick",
    route: "/shop",
    menuItems: ["dashboard", "products", "reservations", "payouts"]
  }
};

export function getServiceConfig(shopType) {
  return SERVICE_CONFIG[shopType] || SERVICE_CONFIG.shop;
}

export function getDefaultLabel(shopType) {
  const config = getServiceConfig(shopType);
  return config.label;
}

export function getInventoryLabels(shopType) {
  const config = getServiceConfig(shopType);
  const useServiceNaming = config.hasReservations && !config.hasOrders;

  return {
    singular: useServiceNaming ? "Service" : "Product",
    plural: useServiceNaming ? "Services" : "Products",
  };
}

