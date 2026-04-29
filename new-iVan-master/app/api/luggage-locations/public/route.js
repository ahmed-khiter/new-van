import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    // Public access - only return active locations
    const luggageLocations = await prisma.luggage_locations.findMany({
      where: {
        isActive: true
      },
      orderBy: { address1: 'asc' }
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

