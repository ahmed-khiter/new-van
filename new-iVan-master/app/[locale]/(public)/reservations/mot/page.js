"use client";
import ReservationPageLayout from "@/components/ReservationPageLayout";

export default function ReservationsMOTPage() {
  return (
    <ReservationPageLayout
      serviceType="mot"
      title="Book Your MOT or Servicing Appointment."
      description="Book your MOT test at certified centers. Schedule your vehicle inspection at a time that suits you."
      defaultTime={{ hours: 9, minutes: 0 }}
      defaultGuests={1}
      maxGuests={5}
      guestsLabel="Vehicles"
      guestsSingular="vehicle"
      guestsPlural="vehicles"
      emptyStateIcon="bi-wrench"
      emptyStateMessage="No MOT centers nearby yet — more are coming soon."
      partnerLinkAnchor="#mot"
      serviceName="MOT Center"
      serviceDisplayName="MOT center"
      errorMessage="Failed to fetch MOT centers"
    />
  );
}
