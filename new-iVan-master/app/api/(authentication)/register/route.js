import prisma from "@/lib/prisma";
import { sendEmail } from "@/lib/sendEmail";
import { getLocationOptions, getUserFullName, isBusinessAccountSupported, defaultOpeningHours } from "@/utils/helper";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

export const POST = async (request) => {
  const {
    firstName,
    lastName,
    email,
    password,
    role,
    shopName,
    serviceType,
    country,
    latitude,
    longitude,
    phone,
    affiliateId
  } = await request.json();

  const existingUser = await prisma.users.findUnique({
    where: {
      email,
      deletedAt: null,
    },
  });

  if (existingUser) {
    return NextResponse.json(
      { error: "Email is already in use." },
      { status: 400 }
    );
  }

  // Validate that business accounts (provider, shop-owner, restaurant) are only allowed for supported countries
  const businessRoles = ["provider", "shop-owner", "restaurant"];
  if (businessRoles.includes(role) && country && !isBusinessAccountSupported(country)) {
    return NextResponse.json(
      { error: "Business accounts (Service Provider, Shop Owner, Restaurant Owner) are only available in United Kingdom and Saudi Arabia." },
      { status: 400 }
    );
  }

  const hashedPassword = await bcrypt.hash(password, 5);

  try {
    const userRole = role || "visitor";
    const user = await prisma.users.create({
      data: {
        firstName,
        lastName,
        email,
        role: userRole,
        password: hashedPassword,
        isActive: true,
        phone: phone || null,
        country: country || null,
        latitude: latitude || null,
        longitude: longitude || null,
        address1: country || null,
      },
    });

    let linkedAffiliateId = null;
    if (affiliateId) {
      const affiliateUser = await prisma.users.findFirst({
        where: {
          id: parseInt(affiliateId),
          role: "affiliate",
          status: "active",
        },
        select: { id: true },
      });
      linkedAffiliateId = affiliateUser?.id || null;
    }

    if ((userRole === "shop-owner" || userRole === "restaurant") && shopName) {
      // Determine shop type
      let shopType = "shop"; // default
      
      if (userRole === "restaurant") {
        shopType = "restaurant";
      } else if (serviceType) {
        // For shop-owner, use selected serviceType
        shopType = serviceType; // "shop", "mot", "shisha", "spa", "beauty", "healthcare", "events", "entertainment"
      }

      // Auto-enable reservations for reservation services
      const acceptsReservations = ["restaurant", "shisha", "spa", "beauty", "mot", "healthcare", "events", "entertainment"].includes(shopType);

      await prisma.shops.create({
        data: {
          name: shopName,
          type: shopType, // Now supports: shop, restaurant, mot, shisha, spa, beauty, healthcare, events, entertainment
          acceptsReservations: acceptsReservations,
          createdById: user.id,
          affiliateId: linkedAffiliateId,
          country: country || null,
          latitude: latitude || null,
          longitude: longitude || null,
          address1: country || null,
          shop_metadata: {
            openingHours: defaultOpeningHours,
            halal: false,
          },
        },
      });
    }

    // Create 2-month free trial subscription for business accounts (provider, shop-owner, restaurant)
    if (businessRoles.includes(userRole)) {
      try {
        

        const freePlan = await prisma.plans.findFirst({
          where: {
            name: "Free",
          }
        });

        if (freePlan) {
          const startDate = new Date();
          const endDate = new Date(startDate);
          endDate.setMonth(endDate.getMonth() + 2);

          await prisma.subscriptions.create({
            data: {
              user_id: user.id,
              plan_id: freePlan.plan_id,
              start_date: startDate,
              end_date: endDate,
              amount_charged: 0.0,
              type: "free_trial",
              status: "active",
            },
          });
        }
      } catch (subscriptionError) {
        console.error("Error creating free trial subscription:", subscriptionError);
      }
    }

    const loginLink = `${process.env.NEXTAUTH_URL}/login`;

    await sendEmail({
      type: "registrationWelcome",
      name: getUserFullName(firstName, lastName),
      email: email,
      loginLink,
      subject: "Welcome to Swipped!",
      role: userRole,
    });

    return NextResponse.json(
      {
        message:
          "User registered successfully. Your account is now active. Please check your email.",
      },
      { status: 200 }
    );
  } catch (err) {
    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 }
    );
  }
};
