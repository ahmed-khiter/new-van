import React from "react";
import { View } from "react-native";
import ServiceCarousel from "@/features/home/components/ServiceCarousel";
import type { HomeServicesResponse } from "@/features/home/types";

type Props = {
  sections: HomeServicesResponse;
  onSelectService?: (serviceId: string) => void;
};

export default function ServicesSection({
  sections,
  onSelectService,
}: Props) {
  return (
    <View style={{ paddingHorizontal: 12 }}>
      <ServiceCarousel
        title="On Demand"
        badge="Delivered Within 60 Minutes"
        badgeColor="#e9eaec"
        badgeTextColor="#c8173a"
        subtitle="Products, food and groceries — delivered to you."
        services={sections.ordering}
        onPressService={(service) => onSelectService?.(service.id)}
        isCarousel={false}
      />

      <ServiceCarousel
        title="Book Now"
        badge="Book in Seconds"
        badgeColor="#fde8b0"
        badgeTextColor="#b06000"
        subtitle="Reserve a table, book a session or schedule an appointment."
        services={sections.reservation}
        onPressService={(service) => onSelectService?.(service.id)}
      />

      <ServiceCarousel
        title="Services"
        badge="Instant Dispatch"
        badgeColor="#c3f5d4"
        badgeTextColor="#0a8c35"
        subtitle="Cleaning, repairs, deliveries and more — on demand."
        services={sections.booking}
        onPressService={(service) => onSelectService?.(service.id)}
      />
    </View>
  );
}
