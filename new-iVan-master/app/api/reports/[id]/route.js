import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

// GET single report by ID
export async function GET(req, { params }) {
  try {
    const userRole = req.headers.get("role");

    if (userRole !== "admin" && userRole !== "affiliate") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = params;

    const report = await prisma.reports.findUnique({
      where: { id },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            category: true,
            status: true,
            createdAt: true
          }
        },
        reportedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true
          }
        }
      }
    });

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    return NextResponse.json({ report });
  } catch (error) {
    console.error("Error fetching report:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch report" },
      { status: 500 }
    );
  }
}

