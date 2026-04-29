import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request, { params }) {
  try {
    const vehicleTypeId = params.id;
    const vehicleType = await prisma.vehicle_types.findUnique({
      where: { id: vehicleTypeId }
    });

    if (!vehicleType) {
      return NextResponse.json({ error: "Vehicle type not found" }, { status: 404 });
    }

    return NextResponse.json(vehicleType);
  } catch (error) {
    console.error("Error fetching vehicle type:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const vehicleTypeId = params.id;
    const body = await request.json();
    const { name, serviceId, pricePerMile, callOutCharge, isActive } = body;

    // Validation
    if (pricePerMile === undefined || callOutCharge === undefined) {
      return NextResponse.json(
        { error: "pricePerMile and callOutCharge are required" },
        { status: 400 }
      );
    }

    // Check if vehicle type exists
    const existing = await prisma.vehicle_types.findUnique({
      where: { id: vehicleTypeId }
    });

    if (!existing) {
      return NextResponse.json({ error: "Vehicle type not found" }, { status: 404 });
    }

    // If name or serviceId is being changed, check for duplicates
    if (name && name !== existing.name) {
      const duplicate = await prisma.vehicle_types.findFirst({
        where: {
          name: name,
          serviceId: serviceId || existing.serviceId,
          id: { not: vehicleTypeId }
        }
      });

      if (duplicate) {
        return NextResponse.json(
          { error: "Vehicle type with this name already exists for this service" },
          { status: 400 }
        );
      }
    }

    const updateData = {
      pricePerMile: parseFloat(pricePerMile),
      callOutCharge: parseFloat(callOutCharge),
      isActive: isActive !== undefined ? Boolean(isActive) : existing.isActive
    };

    if (name) updateData.name = name;
    if (serviceId) updateData.serviceId = serviceId;

    const updatedVehicleType = await prisma.vehicle_types.update({
      where: { id: vehicleTypeId },
      data: updateData
    });

    return NextResponse.json(updatedVehicleType);
  } catch (error) {
    if (error.code === 'P2025') {
      return NextResponse.json({ error: "Vehicle type not found" }, { status: 404 });
    }
    console.error("Error updating vehicle type:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const vehicleTypeId = params.id;
    
    await prisma.vehicle_types.delete({
      where: { id: vehicleTypeId }
    });

    return NextResponse.json({ message: "Vehicle type deleted successfully" });
  } catch (error) {
    if (error.code === 'P2025') {
      return NextResponse.json({ error: "Vehicle type not found" }, { status: 404 });
    }
    console.error("Error deleting vehicle type:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

