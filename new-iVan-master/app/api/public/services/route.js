import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  mapDbServiceToFrontendShape,
  passesHomepageLocationFilter,
} from "@/utils/homepageServices";

export const dynamic = "force-dynamic";

const NAME_TO_KEY = {
  "taxi rides": "Taxi Rides",
  "retail stores": "shop",
  "restaurants": "restaurant",
  "supermarkets": "supermarket",
  "restaurant booking": "Book a Table",
  "mot & repairs": "MOT & Repairs",
  "shisha lounges": "Shisha lounges",
  "spa treatments": "Spa",
  "beauty appointments": "Beauty",
  "healthcare appointments": "Healthcare",
  "events services": "Events",
  "entertainment venues": "Entertainment",
  "luggage storage": "Luggage Storage",
  "dry cleaning": "Dry Cleaning Pick-Up",
  "breakdown assistance": "Recovery",
  "professional cleaning": "Cleaning",
  locksmith: "Locksmith",
  "mobile car key replacement": "Car Key Replacement",
  "rubbish removals": "Removals",
  "click & collect delivery": "Click & Collect",
  courier: "Van",
};

const SECTION_BY_KEY = {
  "Taxi Rides": "ordering",
  shop: "ordering",
  restaurant: "ordering",
  supermarket: "ordering",
  "Book a Table": "reservation",
  "MOT & Repairs": "reservation",
  "Shisha lounges": "reservation",
  Spa: "reservation",
  Beauty: "reservation",
  Healthcare: "reservation",
  Events: "reservation",
  Entertainment: "reservation",
  "Luggage Storage": "booking",
  "Dry Cleaning Pick-Up": "booking",
  Recovery: "booking",
  Cleaning: "booking",
  Locksmith: "booking",
  "Car Key Replacement": "booking",
  Removals: "booking",
  "Click & Collect": "booking",
  Van: "booking",
};

const ROUTE_BY_KEY = {
  "Taxi Rides": "/swipped-rides",
  shop: "/shops?category=all",
  restaurant: "/restaurants?category=all",
  supermarket: "/shops?category=supermarket",
  "Book a Table": "/reservations?service=restaurant",
  "MOT & Repairs": "/reservations?service=mot",
  "Shisha lounges": "/reservations?service=shisha",
  Spa: "/reservations?service=spa",
  Beauty: "/reservations?service=beauty",
  Healthcare: "/reservations?service=healthcare",
  Events: "/reservations?service=events",
  Entertainment: "/reservations?service=entertainment",
  "Luggage Storage": "/booking?service=Luggage Storage",
  "Dry Cleaning Pick-Up": "/booking?service=cleaning",
  Recovery: "/booking?service=Recovery",
  Cleaning: "/booking?service=Cleaning",
  Locksmith: "/booking?service=Locksmith",
  "Car Key Replacement": "/booking?service=Car Key Replacement",
  Removals: "/booking?service=Removals",
  "Click & Collect": "/booking?service=Click & Collect",
  Van: "/booking?service=Van",
};

function normalizeName(v) {
  return String(v || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function withDerivedFields(row) {
  const key = row.legacyKey || NAME_TO_KEY[normalizeName(row.cardTitle || row.name)];
  const section = row.homeSection || (key ? SECTION_BY_KEY[key] : null);
  const routeHref = row.routeHref || (key ? ROUTE_BY_KEY[key] : null);
  return {
    ...row,
    legacyKey: key || null,
    homeSection: section || null,
    routeHref: routeHref || null,
  };
}

export async function GET(request) {
  try {
    const rows = await prisma.services.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });

    const { searchParams } = new URL(request.url);
    const locCode = searchParams.get("locationCode");
    const selectedLocation = locCode ? { code: locCode } : null;

    const ordering = [];
    const reservation = [];
    const booking = [];

    for (const rawRow of rows) {
      const row = withDerivedFields(rawRow);
      if (!row.homeSection || !row.legacyKey) continue;
      if (!passesHomepageLocationFilter(row.locationFilter, selectedLocation)) continue;
      const s = mapDbServiceToFrontendShape(row);
      if (!s) continue;
      if (row.homeSection === "ordering") ordering.push(s);
      else if (row.homeSection === "reservation") reservation.push(s);
      else if (row.homeSection === "booking") booking.push(s);
    }

    return NextResponse.json(
      { ordering, reservation, booking, catalog: [...ordering, ...reservation, ...booking] },
      { status: 200 }
    );
  } catch (error) {
    if (error?.code === "P2022") {
      return NextResponse.json({ ordering: [], reservation: [], booking: [], catalog: [] }, { status: 200 });
    }
    return NextResponse.json({ error: "Failed to load services", ordering: [], reservation: [], booking: [], catalog: [] }, { status: 500 });
  }
}
