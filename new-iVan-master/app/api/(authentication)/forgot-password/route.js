import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { sendEmail } from "@/lib/sendEmail";
import { getUserFullName } from "@/utils/helper";

export const POST = async (request) => {
  try {
    const { email } = await request.json();

    // Email validation regex
    const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
    if (!emailRegex.test(email)) {
        return NextResponse.json({ message: "Invalid email format" }, { status: 400 });
    }

    const user = await prisma.users.findUnique({
      where: { email, deletedAt: null },
    });

    if (!user) {
      return NextResponse.json({ message: "Invalid credentials" }, { status: 400 });
    }


    const resetToken = jwt.sign(
      { email: user.email, userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );


    await prisma.users.update({
      where: { email , deletedAt: null },
      data: {
        resetToken,
        updatedAt: new Date()
      },
    });

    const resetPasswordLink = `${process.env.NEXTAUTH_URL}/reset-password?token=${resetToken}`;
    const { firstName, lastName } = user
    await sendEmail({
      type: "resetPassword",
      name: getUserFullName(firstName, lastName),
      email: email,
      activationLink: resetPasswordLink,
      subject: "Reset Your Swipped Password",
    });
    return NextResponse.json({ message: "Password reset link has been sent to your email" }, { status: 200 });
  } catch (err) {
    console.error("Forgot password error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
};
