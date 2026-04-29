import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
export const dynamic = 'force-dynamic';

export const GET = async (request) => {
  try {
    const requestRole = request.headers.get("role");
    const requestUserId = parseInt(request.headers.get("user-id"));
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const role = searchParams.get("role") || "";
    const status = searchParams.get("status") || "";
    const page = parseInt(searchParams.get("page")) || 1;
    const pageSize = parseInt(searchParams.get("pageSize")) || 20;
    const skip = (page - 1) * pageSize;
    let whereClause = {
        role : {
            notIn: ["admin", "team-member"]
        }
    };

    // Affiliates can only see users they invited/created.
    if (requestRole === "affiliate") {
      whereClause.createdById = requestUserId;
    }

    // Add search functionality
    if (search) {
      whereClause.OR = [
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { email: { contains: search } },
      ];
    }

    if (role) {
      whereClause.role = role;
    }
    if (status) {
      whereClause.status = status;
    }
    const users = await prisma.users.findMany({
      where: whereClause,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      skip: skip,
      take: pageSize,
    });
    const totalUsers = await prisma.users.count({ where: whereClause });
    return NextResponse.json(
      {
        pagination: {
          page,
          pageSize,
          total: totalUsers,
          totalPages: Math.ceil(totalUsers / pageSize),
        },
        users,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch users" },
      { status: 500 }
    );
  }
};
