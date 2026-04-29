"use client";
import ReservationPageLayout from "@/components/ReservationPageLayout";

export default function ReservationsSpaPage() {
  return (
    <ReservationPageLayout
      serviceType="spa"
      title="Book Your Spa Appointment"
      description="Book your spa appointment. Reserve your massage, sauna, or steam room session at a time that suits you."
      defaultTime={{ hours: 19, minutes: 0 }}
      defaultGuests={2}
      maxGuests={20}
      guestsLabel="Guests"
      guestsSingular="person"
      guestsPlural="people"
      emptyStateIcon="bi-flower1"
      emptyStateMessage="No spas nearby yet — more are coming soon."
      partnerLinkAnchor="#spa"
      serviceName="Spa"
      serviceDisplayName="spa"
      errorMessage="Failed to fetch spas"
    />
  );
}
