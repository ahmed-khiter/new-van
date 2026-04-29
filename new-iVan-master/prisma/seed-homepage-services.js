/**
 * Syncs homepage / Book Now / Services tiles into `services`.
 * Run: node prisma/seed-homepage-services.js
 *
 * Requires: migration `add_homepage_service_fields` applied and `npx prisma generate`.
 */
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const defs = [
  {
    legacyKey: "Taxi Rides",
    name: "Taxi Rides",
    description:
      "Book your ride with Taxi Rides. Coming soon - convenient, reliable transportation at your fingertips.",
    price: 0,
    base_price: 0,
    homeSection: "ordering",
    sortOrder: 1,
    listImage: "/assets/img/categories/rides-poster.jpg",
    sliderImage: "/assets/img/slider/slider_13.jpg",
    previewVideo: "/assets/video/rides-preview.mp4",
    previewPoster: "/assets/img/categories/rides-poster.jpg",
    routeHref: "/swipped-rides",
  },
  {
    legacyKey: "shop",
    name: "Retail Stores",
    description:
      "Grab what you want, when you want it. From everyday essentials to last-minute gifts, we bring the shop to your door",
    price: 0,
    base_price: 0,
    homeSection: "ordering",
    sortOrder: 2,
    listImage: "/assets/img/categories/shop-poster.jpg",
    sliderImage: "/assets/img/slider/slider_10.jpg",
    previewVideo: "/assets/video/shop-preview.mp4",
    previewPoster: "/assets/img/categories/shop-poster.jpg",
    routeHref: "/shops?category=all",
  },
  {
    legacyKey: "restaurant",
    name: "Restaurants",
    description:
      "Get your favourite meals delivered straight to you with ease. Browse restaurants, explore new flavours, and place your order in just a few taps",
    price: 0,
    base_price: 0,
    homeSection: "ordering",
    sortOrder: 3,
    listImage: "/assets/img/categories/restaurant-poster.jpg",
    sliderImage: "/assets/img/slider/slider_9.jpg",
    previewVideo: "/assets/video/restaurant-preview.mp4",
    previewPoster: "/assets/img/categories/restaurant-poster.jpg",
    routeHref: "/restaurants?category=all",
  },
  {
    legacyKey: "supermarket",
    name: "Supermarkets",
    description:
      "Shop for groceries and everyday essentials from your favorite supermarkets. Fast delivery straight to your door",
    price: 0,
    base_price: 0,
    homeSection: "ordering",
    sortOrder: 4,
    listImage: "/assets/img/categories/supermarket-poster.jpg",
    sliderImage: "/assets/img/slider/slider_11.jpg",
    previewVideo: "/assets/video/supermarket-preview.mp4",
    previewPoster: "/assets/img/categories/supermarket-poster.jpg",
    routeHref: "/shops?category=supermarket",
  },
  {
    legacyKey: "Book a Table",
    name: "Restaurant booking",
    description:
      "You can now book a table at your favorite restaurant directly on Swipped. No calls, no queues — just tap, reserve, and enjoy.",
    price: 25,
    base_price: 0,
    homeSection: "reservation",
    sortOrder: 1,
    listImage:
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80",
    sliderImage: "/assets/img/slider/slider_12.jpg",
    routeHref: "/reservations?service=restaurant",
  },
  {
    legacyKey: "MOT & Repairs",
    name: "MOT &  Repairs",
    description:
      "Book trusted MOT tests and car servicing with certified professionals to keep your vehicle road ready.",
    price: 0,
    base_price: 0,
    homeSection: "reservation",
    sortOrder: 2,
    listImage:
      "https://images.unsplash.com/photo-1625047509248-ec889cbff17f?auto=format&fit=crop&w=600&q=80",
    sliderImage: "/assets/img/slider/slider_14.jpeg",
    routeHref: "/reservations?service=mot",
  },
  {
    legacyKey: "Shisha lounges",
    name: "Shisha lounges",
    description:
      "Reserve your spot at the best Shisha lounges. Book your table and enjoy a relaxing evening with friends.",
    price: 0,
    base_price: 0,
    homeSection: "reservation",
    sortOrder: 3,
    listImage:
      "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=600&q=80",
    sliderImage: "/assets/img/slider/slider_15.jpeg",
    routeHref: "/reservations?service=shisha",
  },
  {
    legacyKey: "Spa",
    name: "Spa treatments ",
    description:
      "Book your spa appointment and treat yourself to a day of relaxation and rejuvenation.",
    price: 0,
    base_price: 0,
    homeSection: "reservation",
    sortOrder: 4,
    listImage:
      "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=600&q=80",
    sliderImage: "/assets/img/slider/slider_16.jpeg",
    routeHref: "/reservations?service=spa",
  },
  {
    legacyKey: "Beauty",
    name: "Beauty appointments",
    description:
      "Book your beauty appointment at top salons. From haircuts to treatments, reserve your slot today.",
    price: 0,
    base_price: 0,
    homeSection: "reservation",
    sortOrder: 5,
    listImage:
      "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=600&q=80",
    sliderImage: "/assets/img/slider/slider_17.jpeg",
    routeHref: "/reservations?service=beauty",
  },
  {
    legacyKey: "Healthcare",
    name: "Healthcare appointments",
    description:
      "Book your healthcare appointment with trusted providers. Dentist, clinic, IV drip, and more health services.",
    price: 0,
    base_price: 0,
    homeSection: "reservation",
    sortOrder: 6,
    listImage:
      "https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?auto=format&fit=crop&w=600&q=80",
    sliderImage: "/assets/img/slider/slider_18.jpeg",
    routeHref: "/reservations?service=healthcare",
  },
  {
    legacyKey: "Events",
    name: "Events services",
    description:
      "Book professional event services. DJ hire, live music, character appearances, and more for your special events.",
    price: 0,
    base_price: 0,
    homeSection: "reservation",
    sortOrder: 7,
    listImage:
      "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=600&q=80",
    sliderImage: "/assets/img/slider/slider_19.jpeg",
    routeHref: "/reservations?service=events",
  },
  {
    legacyKey: "Entertainment",
    name: "Entertainment venues",
    description:
      "Book exciting entertainment experiences. VR experiences, bowling, karaoke rooms, and unforgettable fun.",
    price: 0,
    base_price: 0,
    homeSection: "reservation",
    sortOrder: 8,
    listImage:
      "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=600&q=80",
    sliderImage: "/assets/img/slider/slider_20.jpeg",
    routeHref: "/reservations?service=entertainment",
  },
  {
    legacyKey: "Luggage Storage",
    name: "Luggage Storage",
    description:
      "Travel light and stress-free. Store your bags with us for a few hours, a few days, or even a few weeks—whatever suits your plans.",
    price: 25,
    base_price: 0,
    homeSection: "booking",
    sortOrder: 1,
    listImage:
      "https://images.unsplash.com/photo-1565026057447-bc90a3dceb87?auto=format&fit=crop&w=600&q=80",
    sliderImage: "/assets/img/slider/luggage.jpg",
    routeHref: "/booking?service=Luggage Storage",
    locationFilter: { onlyIn: ["GB"] },
  },
  {
    legacyKey: "Dry Cleaning Pick-Up",
    name: "Dry Cleaning",
    description:
      "Enjoy perfectly cleaned clothes without leaving your home. We collect your garments straight from your doorstep, get them professionally dry cleaned, and deliver them back fresh",
    price: 10,
    base_price: 0,
    homeSection: "booking",
    sortOrder: 2,
    listImage:
      "https://images.unsplash.com/photo-1545173168-9f1947eebb7f?auto=format&fit=crop&w=600&q=80",
    sliderImage: "/assets/img/slider/cleaning.jpg",
    routeHref: "/booking?service=cleaning",
    locationFilter: { excludeIn: ["GB"] },
    matchNameContains: "Dry Cleaning",
    preservePricingFields: true,
  },
  {
    legacyKey: "Recovery",
    name: "Breakdown Assistance",
    description:
      "Stranded on the road? Our dedicated recovery team is just one tap away. No matter where you are, our nationwide network operates 24/7, providing fast, safe, and reliable assistance.",
    price: 80,
    base_price: 40,
    homeSection: "booking",
    sortOrder: 3,
    listImage:
      "https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=600&q=80",
    sliderImage: "/assets/img/slider/slider_2.jpg",
    routeHref: "/booking?service=Recovery",
    matchNameContains: "Breakdown",
    preservePricingFields: true,
  },
  {
    legacyKey: "Cleaning",
    name: "Professional Cleaning",
    description:
      "From homes to commercial spaces to Airbnb properties — weve got you covered. Urgent call-out or a scheduled appointment, our professionals are ready to help.",
    price: 40,
    base_price: 20,
    homeSection: "booking",
    sortOrder: 4,
    listImage:
      "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=600&q=80",
    sliderImage: "/assets/img/slider/slider_4.jpg",
    routeHref: "/booking?service=Cleaning",
    matchNameContains: "Professional",
    preservePricingFields: true,
  },
  {
    legacyKey: "Locksmith",
    name: "Lock & Key Replacement",
    price: 60,
    base_price: 30,
    homeSection: "booking",
    sortOrder: 5,
    listImage:
      "https://images.unsplash.com/photo-1582139329536-e7284fece509?auto=format&fit=crop&w=600&q=80",
    sliderImage: "/assets/img/slider/slider_6.jpg",
    routeHref: "/booking?service=Locksmith",
    matchNameContains: "Locksmith",
    preservePricingFields: true,
  },
  {
    legacyKey: "Car Key Replacement",
    name: "Mobile car key replacement",
    price: 100,
    base_price: 50,
    homeSection: "booking",
    sortOrder: 6,
    listImage:
      "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=600&q=80",
    sliderImage: "/assets/img/slider/slider_8.jpg",
    routeHref: "/booking?service=Car Key Replacement",
    matchNameContains: "Mobile car key",
    preservePricingFields: true,
  },
  {
    legacyKey: "Removals",
    name: "Rubbish Removals",
    price: 70,
    base_price: 35,
    homeSection: "booking",
    sortOrder: 7,
    listImage:
      "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=600&q=80",
    sliderImage: "/assets/img/slider/slider_7.jpg",
    routeHref: "/booking?service=Removals",
    matchNameContains: "Rubbish",
    preservePricingFields: true,
  },
  {
    legacyKey: "Click & Collect",
    name: "Click & Collect Delivery",
    price: 30,
    base_price: 15,
    homeSection: "booking",
    sortOrder: 8,
    listImage:
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=600&q=80",
    sliderImage: "/assets/img/slider/slider_5.jpg",
    routeHref: "/booking?service=Click & Collect",
    locationFilter: { onlyIn: ["GB"] },
    matchNameContains: "Click & Collect",
    preservePricingFields: true,
  },
  {
    legacyKey: "Van",
    name: "Courier",
    description:
      "Send it fast — send it with Swipped. From small parcels to furniture and pallets, we handle it all with a nationwide fleet ready to assist you instantly.",
    price: 50,
    base_price: 25,
    homeSection: "booking",
    sortOrder: 9,
    listImage:
      "https://images.unsplash.com/photo-1616432043562-3671ea2e5242?auto=format&fit=crop&w=600&q=80",
    sliderImage: "/assets/img/slider/slider_1.jpg",
    routeHref: "/booking?service=Van",
    matchNameContains: "Courier",
    preservePricingFields: true,
  },
];

async function ensureHomepageColumnsExist() {
  const required = [
    "legacyKey",
    "homeSection",
    "sortOrder",
    "cardTitle",
    "listImage",
    "sliderImage",
    "previewVideo",
    "previewPoster",
    "routeHref",
    "locationFilter",
  ];

  const placeholders = required.map(() => "?").join(", ");
  const rows = await prisma.$queryRawUnsafe(
    `
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'services'
        AND COLUMN_NAME IN (${placeholders})
    `,
    ...required
  );

  const existing = new Set(rows.map((r) => r.COLUMN_NAME));
  const missing = required.filter((col) => !existing.has(col));

  if (missing.length > 0) {
    throw new Error(
      [
        "Missing migrated columns on `services`: " + missing.join(", "),
        "Apply DB migration first, then regenerate Prisma client:",
        "1) npx prisma migrate deploy",
        "2) npx prisma generate",
        "3) node prisma/seed-homepage-services.js",
      ].join("\n")
    );
  }
}

async function findExistingRow(def) {
  const byKey = await prisma.services.findUnique({
    where: { legacyKey: def.legacyKey },
  });
  if (byKey) return byKey;

  if (def.matchNameContains) {
    return prisma.services.findFirst({
      where: { name: { contains: def.matchNameContains } },
    });
  }
  return null;
}

async function syncDef(def) {
  const existing = await findExistingRow(def);

  const homepageData = {
    legacyKey: def.legacyKey,
    homeSection: def.homeSection,
    sortOrder: def.sortOrder,
    cardTitle: def.cardTitle ?? null,
    listImage: def.listImage ?? null,
    sliderImage: def.sliderImage ?? null,
    previewVideo: def.previewVideo ?? null,
    previewPoster: def.previewPoster ?? null,
    routeHref: def.routeHref ?? null,
    locationFilter: def.locationFilter ?? null,
  };

  if (existing) {
    const data = def.preservePricingFields
      ? { ...homepageData }
      : {
          ...homepageData,
          name: def.name,
          description: def.description ?? existing.description,
          price: def.price,
          base_price: def.base_price ?? 0,
        };
    await prisma.services.update({
      where: { id: existing.id },
      data,
    });
    console.log(`Updated: ${def.legacyKey} → row ${existing.id}`);
    return;
  }

  await prisma.services.create({
    data: {
      name: def.name,
      description: def.description ?? "",
      price: def.price,
      base_price: def.base_price ?? 0,
      isActive: true,
      ...homepageData,
    },
  });
  console.log(`Created: ${def.legacyKey}`);
}

async function main() {
  await ensureHomepageColumnsExist();
  for (const def of defs) {
    await syncDef(def);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
