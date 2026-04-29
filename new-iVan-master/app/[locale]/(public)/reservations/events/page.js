"use client";
import ReservationPageLayout from "@/components/ReservationPageLayout";

export default function ReservationsEventsPage() {
  return (
    <ReservationPageLayout
      serviceType="events"
      title="Book Your Event Services"
      description="Book professional event services. Schedule DJ hire, live music, character appearances, and more for your special event."
      defaultTime={{ hours: 18, minutes: 0 }}
      defaultGuests={1}
      maxGuests={20}
      guestsLabel="Guests"
      guestsSingular="guest"
      guestsPlural="guests"
      emptyStateIcon="bi-music-note-beamed"
      emptyStateMessage="No event providers nearby yet — more are coming soon."
      partnerLinkAnchor="#events"
      serviceName="Events Provider"
      serviceDisplayName="events provider"
      errorMessage="Failed to fetch event providers"
    />
  );
}
