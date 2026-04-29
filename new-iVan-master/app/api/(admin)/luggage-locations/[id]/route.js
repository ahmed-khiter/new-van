import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  try {
    const { id } = params;
    const location = await prisma.luggage_locations.findUnique({
      where: { id: id }
    });

    if (!location) {
      return NextResponse.json({ error: "Location not found" }, { status: 404 });
    }

    return NextResponse.json(location);
  } catch (error) {
    console.error("Error fetching luggage location:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const userRole = request.headers.get("role");
    
    if (userRole !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = params;
    const body = await request.json();
    const { address1, city, postCode, latitude, longitude, isActive } = body;

    // Validation
    if (!address1 || latitude === undefined || longitude === undefined) {
      return NextResponse.json(
        { error: "Address, latitude, and longitude are required" },
        { status: 400 }
      );
    }

    const updatedLocation = await prisma.luggage_locations.update({
      where: { id: id },
      data: {
        address1,
        city: city || null,
        postCode: postCode || null,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        isActive: isActive !== undefined ? Boolean(isActive) : true
      }
    });

    return NextResponse.json(updatedLocation);
  } catch (error) {
    if (error.code === 'P2025') {
      return NextResponse.json({ error: "Location not found" }, { status: 404 });
    }
    console.error("Error updating luggage location:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const userRole = request.headers.get("role");
    
    if (userRole !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = params;
    await prisma.luggage_locations.delete({
      where: { id: id }
    });

    return NextResponse.json({ message: "Location deleted successfully" });
  } catch (error) {
    if (error.code === 'P2025') {
      return NextResponse.json({ error: "Location not found" }, { status: 404 });
    }
    console.error("Error deleting luggage location:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

