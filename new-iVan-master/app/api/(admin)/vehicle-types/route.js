import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const serviceId = searchParams.get("serviceId");
    const search = searchParams.get("search");

    let whereClause = {};

    if (serviceId) {
      whereClause.serviceId = serviceId;
    }

    if (search) {
      whereClause.name = { contains: search };
    }

    const vehicleTypes = await prisma.vehicle_types.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ vehicleTypes });
  } catch (error) {
    console.error("Error fetching vehicle types:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, serviceId, pricePerMile, callOutCharge, isActive } = body;

    // Validation
    if (!name || !serviceId || pricePerMile === undefined || callOutCharge === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: name, serviceId, pricePerMile, and callOutCharge are required" },
        { status: 400 }
      );
    }

    // Verify service exists
    const service = await prisma.services.findUnique({
      where: { id: serviceId }
    });

    if (!service) {
      return NextResponse.json(
        { error: "Service not found" },
        { status: 404 }
      );
    }

    // Check if vehicle type with same name already exists for this service
    const existing = await prisma.vehicle_types.findFirst({
      where: {
        name: name,
        serviceId: serviceId
      }
    });

    if (existing) {
      return NextResponse.json(
        { error: "Vehicle type with this name already exists for this service" },
        { status: 400 }
      );
    }

    const newVehicleType = await prisma.vehicle_types.create({
      data: {
        name,
        serviceId,
        pricePerMile: parseFloat(pricePerMile),
        callOutCharge: parseFloat(callOutCharge),
        isActive: isActive !== undefined ? Boolean(isActive) : true
      }
    });

    return NextResponse.json(newVehicleType, { status: 201 });
  } catch (error) {
    console.error("Error creating vehicle type:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

