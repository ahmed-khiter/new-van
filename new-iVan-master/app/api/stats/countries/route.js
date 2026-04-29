import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export const GET = async (request) => {
  try {
    // Get user counts grouped by country (including role for admin classification)
    const users = await prisma.users.findMany({
      where: {
        deletedAt: null,
      },
      select: {
        country: true,
        role: true
      }
    });

    // Count users by country
    // Admin and affiliate users are counted as UK users
    const countryCounts = {};
    const adminRoles = ["admin", "affiliate"];
    
    users.forEach(user => {
      let country = user.country;
      
      // Treat admin and affiliate as UK users
      if (adminRoles.includes(user.role)) {
        country = "United Kingdom";
      }
      
      if (country) {
        countryCounts[country] = (countryCounts[country] || 0) + 1;
      }
    });

    // Convert to array and sort by count (descending)
    const countryStats = Object.entries(countryCounts)
      .map(([country, count]) => ({
        country,
        count
      }))
      .sort((a, b) => b.count - a.count);

    // Get total global count (only count users with a country or admin roles)
    const globalUserCount = countryStats.reduce((total, stat) => total + stat.count, 0);

    return NextResponse.json({
      globalUserCount,
      countries: countryStats
    }, { status: 200 });
  } catch (error) {
    console.error("Error fetching country stats:", error);
    return NextResponse.json({
      error: error.message || "Failed to fetch country stats",
      globalUserCount: 0,
      countries: []
    }, { status: 500 });
  }
};

