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
};

export type ServiceItem = {
  id: string;
  name: string;
  image?: string;
  images?: ServiceImageSet;
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
