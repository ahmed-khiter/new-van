import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request, { params }) {
  try {
    const serviceId = params.id;
    const service = await prisma.services.findUnique({
      where: { id: serviceId }
    });

    if (!service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    return NextResponse.json(service);
  } catch (error) {
    console.error("Error fetching service:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const serviceId = params.id;
    const body = await request.json();
    const {
      name,
      description,
      price,
      base_price,
      isActive,
      legacyKey,
      homeSection,
      sortOrder,
      cardTitle,
      listImage,
      sliderImage,
      previewVideo,
      previewPoster,
      routeHref,
      locationFilter,
    } = body;

    if (!name || price === undefined || Number.isNaN(parseFloat(price))) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const updatedService = await prisma.services.update({
      where: { id: serviceId },
      data: {
        name,
        description: description ?? null,
        price: parseFloat(price),
        base_price: base_price !== undefined ? parseFloat(base_price) : 0.0,
        isActive: Boolean(isActive),
        legacyKey: legacyKey === undefined ? undefined : legacyKey || null,
        homeSection: homeSection === undefined ? undefined : homeSection || null,
        sortOrder:
          sortOrder === undefined ? undefined : Number(sortOrder) || 0,
        cardTitle: cardTitle === undefined ? undefined : cardTitle || null,
        listImage: listImage === undefined ? undefined : listImage || null,
        sliderImage: sliderImage === undefined ? undefined : sliderImage || null,
        previewVideo: previewVideo === undefined ? undefined : previewVideo || null,
        previewPoster: previewPoster === undefined ? undefined : previewPoster || null,
        routeHref: routeHref === undefined ? undefined : routeHref || null,
        locationFilter:
          locationFilter === undefined ? undefined : locationFilter,
      },
    });

    return NextResponse.json(updatedService);
  } catch (error) {
    if (error.code === 'P2025') {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }
    console.error("Error updating service:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const serviceId = params.id;
    
    await prisma.services.delete({
      where: { id: serviceId }
    });

    return NextResponse.json({ message: "Service deleted successfully" });
  } catch (error) {
    if (error.code === 'P2025') {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }
    console.error("Error deleting service:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
