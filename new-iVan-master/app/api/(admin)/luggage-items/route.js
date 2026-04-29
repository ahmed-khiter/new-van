import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request) {
  try {
    const userRole = request.headers.get("role");
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const isActive = searchParams.get("isActive");

    let whereClause = {};

    // For public access (non-admin), only show active items
    // For admin, show all items unless isActive filter is specified
    if (userRole !== "admin") {
      whereClause.isActive = true;
    } else if (isActive !== null && isActive !== undefined) {
      whereClause.isActive = isActive === "true";
    }

    // Search filter
    if (search) {
      whereClause.name = { contains: search };
    }

    const luggageItems = await prisma.luggage_items.findMany({
      where: whereClause,
      orderBy: userRole === "admin" ? { createdAt: 'desc' } : { name: 'asc' }
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

export async function POST(request) {
  try {
    const userRole = request.headers.get("role");
    
    if (userRole !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const { name, type, price, isActive } = body;

    // Validation
    if (!name || price === undefined) {
      return NextResponse.json(
        { error: "Name and price are required" },
        { status: 400 }
      );
    }

    // Validate type
    if (type && !["luggage", "Dry cleaning"].includes(type)) {
      return NextResponse.json(
        { error: "Type must be either 'luggage' or 'Dry cleaning'" },
        { status: 400 }
      );
    }

    const newItem = await prisma.luggage_items.create({
      data: {
        name,
        type: type || "luggage",
        price: parseFloat(price),
        isActive: isActive !== undefined ? Boolean(isActive) : true
      }
    });

    return NextResponse.json(newItem, { status: 201 });
  } catch (error) {
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: "An item with this name already exists" },
        { status: 400 }
      );
    }
    console.error("Error creating luggage item:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

