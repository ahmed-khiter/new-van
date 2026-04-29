import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export const POST = async (request) => {
    const userId = request.headers.get('user-id');

    const { password, confirm_password } = await request.json();

    if (!password || !confirm_password) {
        return NextResponse.json({ message : "Both new password and confirm password are required." }, { status: 400 });
    }

    if (password !== confirm_password) {
        return NextResponse.json({ message : "New passwords do not match." }, { status: 400 });
    }

    try {
        const user = await prisma.users.findUnique({
            where: { id: parseInt(userId, 10) },
        });

        if (!user) {
            return NextResponse.json({ message : "User not found." }, { status: 404 });
        }

        const isSamePassword = await bcrypt.compare(password, user.password);
        if (isSamePassword) {
            return NextResponse.json({ message : "New password cannot be the same as the current password." }, { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await prisma.users.update({
            where: { id: parseInt(userId, 10) },
            data: {
                password: hashedPassword,
                updatedAt: new Date(),
            },
        });

        return NextResponse.json({ message: "Password updated successfully" }, { status: 200 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ message : error.message || "Internal server error." }, { status: 500 });
    }
};

