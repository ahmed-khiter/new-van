import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { sendEmail } from "@/lib/sendEmail";
import { getUserFullName } from "@/utils/helper";
import bcrypt from "bcryptjs";
// GET - Fetch all team members (admin and team-member roles)
export async function GET(req) {
  try {
    const createdById = req.headers.get("user-id");
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');
    const role = searchParams.get('role');
    const status = searchParams.get('status');

    const where = {
      role: {
        in: ["admin", "team-member"]
      },
      deletedAt: null , 
      createdById: parseInt(createdById)
    };

    if (search) {
      where.OR = [
        {
          firstName: {
            contains: search,
          }
        },
        {
          lastName: {
            contains: search,
          }
        },
        {
          email: {
            contains: search,
          }
        }
      ];
    }

    // Add role filter
    if (role && ['admin', 'team-member'].includes(role)) {
      where.role = role;
    }

    // Add status filter
    if (status) {
      where.status = status;
    }

    const teamMembers = await prisma.users.findMany({
      where,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        status: true,
        createdAt: true
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    return NextResponse.json({
      success: true,
      members: teamMembers
    });
  } catch (error) {
    console.error("Error fetching team members:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch team members" },
      { status: 500 }
    );
  }
}

// POST - Add new team member
export async function POST(req) {
  try {
    const createdById = req.headers.get("user-id");
    const { firstName, lastName, email, role } = await req.json();

    // Validate required fields
    if (!firstName || !email) {
      return NextResponse.json(
        { error: "First name and email are required" },
        { status: 400 }
      );
    }

    // Validate role
    if (!["admin", "team-member"].includes(role)) {
      return NextResponse.json(
        { error: "Invalid role. Must be 'admin' or 'team-member'" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.users.findUnique({
      where: {
        email,
        deletedAt: null
      }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }
    let hashedPassword = null;
    if (process.env.TEAM_MEMBER_PASSWORD) {
      hashedPassword = await bcrypt.hash(process.env.TEAM_MEMBER_PASSWORD, 5);
    }
    // Create user with team member defaults
    const newUser = await prisma.users.create({
      data: {
        firstName,
        lastName: lastName || null,
        email,
        role,
        isActive: true, 
        status: "active",
        isFirstTime: false, 
        password: hashedPassword, 
        createdById: parseInt(createdById),
      }
    });
    const setupToken = jwt.sign(
        { email: email, userId: newUser.id },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );
    await prisma.users.update({
        where: { id: newUser.id },
        data: {
            resetToken: setupToken
        }
    });
    // Create setup password link
    const setupLink = `${process.env.NEXTAUTH_URL}/reset-password?token=${setupToken}&setup=true`;

    // Send setup password email
    await sendEmail({
      type: "setupPassword",
      name: getUserFullName(firstName, lastName),
      email: email,
      setupLink: setupLink,
      subject: "Set up your Swipped account password"
    });

    return NextResponse.json({
      success: true,
      message: "Team member added successfully. Setup email sent.",
      user: {
        id: newUser.id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        role: newUser.role,
        status: newUser.status , 
        createdAt: newUser.createdAt
      }
    });
  } catch (error) {
    console.error("Error adding team member:", error);
    return NextResponse.json(
      { error: error.message || "Failed to add team member" },
      { status: 500 }
    );
  }
}
