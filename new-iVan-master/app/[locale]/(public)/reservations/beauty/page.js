"use client";
import ReservationPageLayout from "@/components/ReservationPageLayout";

export default function ReservationsBeautyPage() {
  return (
    <ReservationPageLayout
      serviceType="beauty"
      title="Book Your Beauty Appointment"
      description="Book your beauty appointment at premium salons. Schedule your haircut, styling, manicure, pedicure, or other beauty services at a time that suits you."
      defaultTime={{ hours: 10, minutes: 0 }}
      defaultGuests={1}
      maxGuests={5}
      guestsLabel="Guests"
      guestsSingular="guest"
      guestsPlural="guests"
      emptyStateIcon="bi-scissors"
      emptyStateMessage="No beauty salons nearby yet — more are coming soon."
      partnerLinkAnchor="#beauty"
      serviceName="Beauty Salon"
      serviceDisplayName="beauty salon"
      errorMessage="Failed to fetch beauty salons"
    />
  );
}

