import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");

    const whereClause = search ? {
      OR: [
        { name: { contains: search } },
        { description: { contains: search } }
      ]
    } : {};

    let services = [];
    try {
      services = await prisma.services.findMany({
        where: whereClause,
        orderBy: [{ sortOrder: "asc" }, { homeSection: "asc" }, { createdAt: "desc" }],
      });
    } catch (error) {
      // Migration-safe fallback for environments missing homepage columns.
      if (error?.code === "P2022") {
        services = await prisma.services.findMany({
          where: whereClause,
          orderBy: { createdAt: "desc" },
        });
      } else {
        throw error;
      }
    }

    return NextResponse.json({ services });
  } catch (error) {
    console.error("Error fetching services:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
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

    const newService = await prisma.services.create({
      data: {
        name,
        description: description ?? null,
        price: parseFloat(price),
        base_price: base_price !== undefined ? parseFloat(base_price) : 0.0,
        isActive: Boolean(isActive),
        legacyKey: legacyKey || null,
        homeSection: homeSection || null,
        sortOrder: sortOrder !== undefined ? Number(sortOrder) || 0 : 0,
        cardTitle: cardTitle || null,
        listImage: listImage || null,
        sliderImage: sliderImage || null,
        previewVideo: previewVideo || null,
        previewPoster: previewPoster || null,
        routeHref: routeHref || null,
        locationFilter: locationFilter ?? null,
      },
    });

    return NextResponse.json(newService, { status: 201 });
  } catch (error) {
    console.error("Error creating service:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
