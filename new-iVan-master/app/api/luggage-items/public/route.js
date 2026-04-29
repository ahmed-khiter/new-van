import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const type = searchParams.get("type"); // Filter by type: "luggage" or "Dry cleaning"

    let whereClause = {
      isActive: true // Only show active items for public
    };

    // Type filter - map serviceType to database type
    if (type) {
      // Map 'cleaning' to 'Dry cleaning', 'luggage' to 'luggage'
      const dbType = type === 'cleaning' ? 'Dry cleaning' : 'luggage';
      whereClause.type = dbType;
    }

    // Search filter
    if (search) {
      whereClause.name = { contains: search };
    }

    const luggageItems = await prisma.luggage_items.findMany({
      where: whereClause,
      orderBy: { name: 'asc' }
    });

    return NextResponse.json({ luggageItems });
  } catch (error) {
    console.error("Error fetching luggage items:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

