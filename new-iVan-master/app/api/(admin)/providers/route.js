import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";



export const GET = async (request) => {
    try {
        const { searchParams } = new URL(request.url);
        const search = searchParams.get("search") || "";

        let whereClause = {
            role: "provider",
        };

        // Add search functionality
        if (search) {
            whereClause.OR = [
                { firstName: { contains: search } },
                { lastName: { contains: search } },
                { email: { contains: search } }
            ];
        }

        const providers = await prisma.users.findMany({
            where: whereClause,
            include: {
                wallets: {
                    where: {
                        default: true
                    }
                }
            },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json(
            {
                providers,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error fetching providers:", error);
        return NextResponse.json(
            { error: error.message || "Failed to fetch providers" },
            { status: 500 }
        );
    }
};

export const DELETE = async (request) => {

    try {
        const { id } = await request.json();

        await prisma.users.delete({
            where: { id },
        });

        return NextResponse.json(
            { message: "Provider deleted successfully" },
            { status: 200 }
        );
    } catch (error) {
        return NextResponse.json(
            { message: "internal server error", error: error.message },
            { status: 500 }
        );
    }
};
