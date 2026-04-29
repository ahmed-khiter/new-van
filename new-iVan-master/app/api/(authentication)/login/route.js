import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getUserFullName } from "@/utils/helper";

export async function POST(req) {
    try {
        const { email, password } = await req.json();

        const user = await prisma.users.findUnique({ where: { email, deletedAt: null } });

        if (!user) {
            return NextResponse.json({ error: "Invalid credentials" }, { status: 404 });
        }

        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if (!isPasswordCorrect) {
            return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
        }

        if (!user.isActive) {
            return NextResponse.json({ error: "Account not activated" }, { status: 403 });
        }
        const { password: _, ...userWithoutPassword } = user
        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
                role: user.role,
                name: getUserFullName(user.firstName, user.lastName),
                preferredLocale: user.preferredLocale || null,
            },
            process.env.NEXTAUTH_SECRET,
            { expiresIn: "30d" }
        );

        return NextResponse.json({
            token,
            user: { ...userWithoutPassword, name: getUserFullName(user.firstName, user.lastName) },
            message: "Login Successfully!"
        });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
