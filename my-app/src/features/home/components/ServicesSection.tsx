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
    <View style={{ paddingHorizontal: 16 }}>
      <ServiceCarousel
        title="ON DEMAND"
        badge="DELIVERED WITHIN 60 MINUTES"
        badgeColor="#d1fae5"
        badgeTextColor="#065f46"
        subtitle="Products, food and groceries — delivered to you."
        services={sections.ordering}
        onPressService={(service) => onSelectService?.(service.id)}
        isCarousel={false}
      />

      <ServiceCarousel
        title="BOOK NOW"
        badge="BOOK IN SECONDS"
        badgeColor="#fef3c7"
        badgeTextColor="#92400e"
        subtitle="Reserve a table, book a session or schedule an appointment."
        services={sections.reservation}
        onPressService={(service) => onSelectService?.(service.id)}
      />

      <ServiceCarousel
        title="SERVICES"
        badge="INSTANT DISPATCH"
        badgeColor="#d1fae5"
        badgeTextColor="#065f46"
        subtitle="Cleaning, repairs, deliveries and more — on demand."
        services={sections.booking}
        onPressService={(service) => onSelectService?.(service.id)}
      />
    </View>
  );
}
