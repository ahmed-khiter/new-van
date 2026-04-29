import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export const POST = async (request) => {
  const userId = request.headers.get("user-id");

  try {
    const { email } = await request.json();

    // Validate email
    if (!email || !email.trim()) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address" },
        { status: 400 }
      );
    }

    // Get current user
    const currentUser = await prisma.users.findUnique({
      where: { id: parseInt(userId, 10) },
      select: { email: true }
    });

    if (!currentUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const normalizedNewEmail = email.trim().toLowerCase();

    // Check if email is the same as current
    if (currentUser.email.toLowerCase() === normalizedNewEmail) {
      return NextResponse.json(
        { error: "New email must be different from current email" },
        { status: 400 }
      );
    }

    // Check if email is already in use by another user
    // Query for both the exact email and lowercase version to handle existing data
    const existingUser = await prisma.users.findFirst({
      where: {
        OR: [
          { email: normalizedNewEmail },
          { email: email.trim() }
        ],
        id: {
          not: parseInt(userId, 10)
        }
      }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "This email is already in use by another account" },
        { status: 400 }
      );
    }

    // Update email (store as lowercase for consistency)
    const updatedUser = await prisma.users.update({
      where: { id: parseInt(userId, 10) },
      data: { email: normalizedNewEmail }
    });

    return NextResponse.json(
      { 
        message: "Email updated successfully",
        email: updatedUser.email 
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error updating email:", err);
    return NextResponse.json(
      { error: "Failed to update email. Please try again." },
      { status: 500 }
    );
  }
};
