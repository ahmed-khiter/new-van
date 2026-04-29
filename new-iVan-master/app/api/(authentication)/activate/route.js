// pages/api/auth/activate.js

import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

export const GET = async (request) => {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if user was invited (has createdById)
    const user = await prisma.users.findUnique({
      where: { email: decoded.email, deletedAt: null },
      select: { id: true, createdById: true, resetToken: true }
    });

    if (!user) {
      return NextResponse.json({ message: "User not found." }, { status: 404 });
    }

    // If user was invited (has createdById), they should use setup password flow
    if (user.createdById) {
      // Check if they have a setup token
      if (user.resetToken) {
        // Redirect to setup password page
        return NextResponse.json({ 
          message: "Please set up your password.",
          redirectTo: `/reset-password?token=${user.resetToken}&setup=true`,
          isInvited: true
        }, { status: 200 });
      }
    }

    // Regular activation flow for non-invited users
    await prisma.users.update({
      where: { email: decoded.email, deletedAt: null },
      data: { isActive: true, activationToken: null },
    });

    return NextResponse.json({ message: "Account activated successfully." }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ message: "Invalid or expired token." }, { status: 400 });
  }
};
