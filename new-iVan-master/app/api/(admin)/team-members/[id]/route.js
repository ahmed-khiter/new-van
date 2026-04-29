import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// PUT - Update team member
export async function PUT(req, { params }) {
  try {
    const { id } = params;
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

    // Check if user exists
    const existingUser = await prisma.users.findUnique({
      where: {
        id: parseInt(id),
        deletedAt: null
      }
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: "Team member not found" },
        { status: 404 }
      );
    }

    // Check if email is already taken by another user
    if (email !== existingUser.email) {
      const emailExists = await prisma.users.findUnique({
        where: {
          email,
          deletedAt: null
        }
      });

      if (emailExists) {
        return NextResponse.json(
          { error: "Email is already taken by another user" },
          { status: 400 }
        );
      }
    }

    // Update user
    await prisma.users.update({
      where: {
        id: parseInt(id)
      },
      data: {
        firstName,
        lastName: lastName || null,
        email,
        role
      }
    });

    return NextResponse.json({
      success: true,
      message: "Team member updated successfully"
    });
  } catch (error) {
    console.error("Error updating team member:", error);
    return NextResponse.json(
      { error: "Failed to update team member" },
      { status: 500 }
    );
  }
}

// DELETE - Delete team member (soft delete)
export async function DELETE(req, { params }) {
  try {
    const { id } = params;

    // Check if user exists
    const existingUser = await prisma.users.findUnique({
      where: {
        id: parseInt(id),
        deletedAt: null
      }
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: "Team member not found" },
        { status: 404 }
      );
    }

    // Soft delete user
    await prisma.users.update({
      where: {
        id: parseInt(id)
      },
      data: {
        deletedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      message: "Team member deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting team member:", error);
    return NextResponse.json(
      { error: "Failed to delete team member" },
      { status: 500 }
    );
  }
}
