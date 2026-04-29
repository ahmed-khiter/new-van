import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const userRole = request.headers.get("role");
    
    // Admin can see all locations, public only sees active
    const whereClause = userRole === "admin" ? {} : { isActive: true };
    
    const luggageLocations = await prisma.luggage_locations.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ luggageLocations });
  } catch (error) {
    console.error("Error fetching luggage locations:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const userRole = request.headers.get("role");
    
    if (userRole !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const { address1, city, postCode, latitude, longitude, isActive } = body;

    // Validation
    if (!address1 || latitude === undefined || longitude === undefined) {
      return NextResponse.json(
        { error: "Address, latitude, and longitude are required" },
        { status: 400 }
      );
    }

    const newLocation = await prisma.luggage_locations.create({
      data: {
        address1,
        city: city || null,
        postCode: postCode || null,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        isActive: isActive !== undefined ? Boolean(isActive) : true
      }
    });

    return NextResponse.json(newLocation, { status: 201 });
  } catch (error) {
    console.error("Error creating luggage location:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

