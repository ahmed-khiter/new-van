import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request, { params }) {
  try {
    const userRole = request.headers.get("role");
    
    if (userRole !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const itemId = params.id;
    const item = await prisma.luggage_items.findUnique({
      where: { id: itemId }
    });

    if (!item) {
      return NextResponse.json({ error: "Luggage item not found" }, { status: 404 });
    }

    return NextResponse.json(item);
  } catch (error) {
    console.error("Error fetching luggage item:", error);
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

    const itemId = params.id;
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

    const updatedItem = await prisma.luggage_items.update({
      where: { id: itemId },
      data: {
        name,
        type: type || "luggage",
        price: parseFloat(price),
        isActive: isActive !== undefined ? Boolean(isActive) : true
      }
    });

    return NextResponse.json(updatedItem);
  } catch (error) {
    if (error.code === 'P2025') {
      return NextResponse.json({ error: "Luggage item not found" }, { status: 404 });
    }
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: "An item with this name already exists" },
        { status: 400 }
      );
    }
    console.error("Error updating luggage item:", error);
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

    const itemId = params.id;
    
    await prisma.luggage_items.delete({
      where: { id: itemId }
    });

    return NextResponse.json({ message: "Luggage item deleted successfully" });
  } catch (error) {
    if (error.code === 'P2025') {
      return NextResponse.json({ error: "Luggage item not found" }, { status: 404 });
    }
    console.error("Error deleting luggage item:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

