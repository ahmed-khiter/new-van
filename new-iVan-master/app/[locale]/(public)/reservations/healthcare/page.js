"use client";
import ReservationPageLayout from "@/components/ReservationPageLayout";

export default function ReservationsHealthcarePage() {
  return (
    <ReservationPageLayout
      serviceType="healthcare"
      title="Book Your Healthcare Appointment"
      description="Book your healthcare appointment at trusted providers. Schedule your consultation, dental service, IV drip, or other healthcare services at a time that suits you."
      defaultTime={{ hours: 10, minutes: 0 }}
      defaultGuests={1}
      maxGuests={5}
      guestsLabel="Patients"
      guestsSingular="Patient"
      guestsPlural="Patients"
      emptyStateIcon="bi-hospital"
      emptyStateMessage="No healthcare providers nearby yet — more are coming soon."
      partnerLinkAnchor="#healthcare"
      serviceName="Healthcare Provider"
      serviceDisplayName="healthcare provider"
      errorMessage="Failed to fetch healthcare providers"
    />
  );
}
