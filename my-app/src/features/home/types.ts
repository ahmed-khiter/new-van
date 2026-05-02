export type Location = {
  name: string;
  flag: string;
  code: string;
  lat?: number;
  lng?: number;
};

export type ServiceImageSet = {
  background?: string;
  slider?: string;
  list_service_img?: string;
  preview_video?: string;
  preview_poster?: string;
};

export type ServiceItem = {
  id: string;
  dbId?: string;
  name: string;
  description?: string;
  basePrice?: number;
  routeHref?: string;
  image?: string;
  images?: ServiceImageSet;
  locationFilter?: {
    excludeIn?: string[];
  };
};

export type PromoFeature = {
  id: string;
  title: string;
  description: string;
  color: string;
};

export type HomeServicesResponse = {
  ordering: ServiceItem[];
  reservation: ServiceItem[];
  booking: ServiceItem[];
  catalog: ServiceItem[];
};

export type StatsResponse = {
  userCount?: number;
  globalUserCount?: number;
  locationUserCount?: number;
};
