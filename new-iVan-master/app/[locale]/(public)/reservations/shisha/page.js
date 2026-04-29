"use client";
import ReservationPageLayout from "@/components/ReservationPageLayout";

export default function ReservationsShishaPage() {
  return (
    <ReservationPageLayout
      serviceType="shisha"
      title="Book Your Shisha lounges Reservation"
      description="Book your Shisha lounges session. Reserve your table and enjoy a relaxing experience with friends."
      defaultTime={{ hours: 19, minutes: 0 }}
      defaultGuests={2}
      maxGuests={20}
      guestsLabel="Guests"
      guestsSingular="person"
      guestsPlural="people"
      emptyStateIcon="bi-cup-straw"
      emptyStateMessage="No Shisha lounges nearby yet — more are coming soon."
      partnerLinkAnchor="#shisha"
      serviceName="Shisha lounges"
      serviceDisplayName="Shisha lounges"
      errorMessage="Failed to fetch Shisha lounges"
    />
  );
}
