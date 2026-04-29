"use client";
import ReservationPageLayout from "@/components/ReservationPageLayout";

export default function ReservationsEntertainmentPage() {
  return (
    <ReservationPageLayout
      serviceType="entertainment"
      title="Book Your Entertainment Experience"
      description="Book exciting entertainment experiences. Reserve VR experiences, bowling, karaoke rooms, and more for unforgettable fun."
      defaultTime={{ hours: 18, minutes: 0 }}
      defaultGuests={2}
      maxGuests={20}
      guestsLabel="Guests"
      guestsSingular="guest"
      guestsPlural="guests"
      emptyStateIcon="bi-joystick"
      emptyStateMessage="No entertainment venues nearby yet — more are coming soon."
      partnerLinkAnchor="#entertainment"
      serviceName="Entertainment Venue"
      serviceDisplayName="entertainment venue"
      errorMessage="Failed to fetch entertainment venues"
    />
  );
}
