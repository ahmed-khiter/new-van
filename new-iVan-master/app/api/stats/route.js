import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

const getBoundingBox = (lat, lng, radiusMiles = 50) => {
  const R = 3959;
  const latRad = (lat * Math.PI) / 180;
  const deltaLat = (radiusMiles / R) * (180 / Math.PI);
  const deltaLng = (radiusMiles / (R * Math.cos(latRad))) * (180 / Math.PI);
  return {
    minLat: lat - deltaLat,
    maxLat: lat + deltaLat,
    minLng: lng - deltaLng,
    maxLng: lng + deltaLng
  };
};

export const GET = async (request) => {
  try {
    const { searchParams } = new URL(request.url);
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");
    
    const globalUserCount = await prisma.users.count({
      where: { deletedAt: null }
    });
    
    let locationUserCount = 0;
    if (lat && lng) {
      const box = getBoundingBox(parseFloat(lat), parseFloat(lng), 50);
      locationUserCount = await prisma.users.count({
        where: {
          deletedAt: null,
          latitude: { gte: box.minLat, lte: box.maxLat },
          longitude: { gte: box.minLng, lte: box.maxLng }
        }
      });
    }

    return NextResponse.json({
      userCount: globalUserCount,
      globalUserCount,
      locationUserCount
    }, { status: 200 });
  } catch (error) {
    return NextResponse.json({
      error: error.message || "Failed to fetch user count",
      userCount: 0,
      globalUserCount: 0,
      locationUserCount: 0
    }, { status: 500 });
  }
};

