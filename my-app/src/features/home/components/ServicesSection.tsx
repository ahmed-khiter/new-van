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
        title="ON DEMAND"
        badge="DELIVERED WITHIN 60 MINUTES"
        badgeColor="#e9eaec"
        badgeTextColor="#c8173a"
        subtitle="Products, food and groceries — delivered to you."
        services={sections.ordering}
        onPressService={(service) => onSelectService?.(service.id)}
        isCarousel={false}
      />

      <ServiceCarousel
        title="BOOK NOW"
        badge="BOOK IN SECONDS"
        badgeColor="#fde8b0"
        badgeTextColor="#b06000"
        subtitle="Reserve a table, book a session or schedule an appointment."
        services={sections.reservation}
        onPressService={(service) => onSelectService?.(service.id)}
      />

      <ServiceCarousel
        title="SERVICES"
        badge="INSTANT DISPATCH"
        badgeColor="#c3f5d4"
        badgeTextColor="#0a8c35"
        subtitle="Cleaning, repairs, deliveries and more — on demand."
        services={sections.booking}
        onPressService={(service) => onSelectService?.(service.id)}
      />
    </View>
  );
}
