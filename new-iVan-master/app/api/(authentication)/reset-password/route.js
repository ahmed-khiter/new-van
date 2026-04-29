import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

export const POST = async (request) => {
  try {
    const { token, newPassword, isSetupPassword } = await request.json();

    if (!token || !newPassword) {
      return NextResponse.json({ 
        message: "Token and new password are required" 
      }, { status: 400 });
    }

    // Verify JWT token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return NextResponse.json({ 
        message: "Invalid or expired token." 
      }, { status: 400 });
    }

    // Find user by email
    const user = await prisma.users.findUnique({
      where: { email: decoded.email, deletedAt: null },
    });

    if (!user) {
      return NextResponse.json({ 
        message: "User not found" 
      }, { status: 404 });
    }

    // SECURITY CHECK: Verify the token matches the one stored in database
    if (user.resetToken !== token) {
      return NextResponse.json({ 
        message: "Invalid or expired token." 
      }, { status: 400 });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and clear reset token
    await prisma.users.update({
      where: { email: decoded.email, deletedAt: null },
      data: {
        password: hashedPassword,
        resetToken: null,
      },
    });

    return NextResponse.json({ 
      message: isSetupPassword ? "Password set up successfully" : "Password reset successfully" 
    }, { status: 200 });
  } catch (err) {
    console.error("Reset password error:", err);
    return NextResponse.json({ 
      message: err.message || "Internal server error" 
    }, { status: 500 });
  }
};
