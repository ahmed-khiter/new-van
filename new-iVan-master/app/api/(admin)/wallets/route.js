import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";


export async function GET(req) {
    const userId = req.headers.get("user-id");
    try {
        const cards = await prisma.wallets.findMany({
            where: { userId: parseInt(userId) },
            include: { user: true },
        });

        return NextResponse.json(
            { success: true, cards },
            { status: 200 }
        );
    } catch (error) {
        return NextResponse.json(
            { success: false, error: "Failed to fetch wallets" },
            { status: 500 }
        );
    }
}


export async function POST(req) {
    const userId = req.headers.get("user-id");

    if (!userId) {
        return NextResponse.json(
            { success: false, error: "User ID is required" },
            { status: 400 }
        );
    }

    try {
        const body = await req.json();
        const { accountNumber, sortCode, accountHolderName } = body;

        if (!accountNumber || !sortCode) {
            return NextResponse.json(
                { success: false, error: "Account number and sort code are required" },
                { status: 400 }
            );
        }


        const existingWalletCount = await prisma.wallets.count({
            where: { userId: parseInt(userId) },
        });

        const card = await prisma.wallets.create({
            data: {
                accountNumber,
                accountHolderName,
                sortCode,
                userId: parseInt(userId),
                default: existingWalletCount === 0,
            },
        });

        return NextResponse.json(
            { success: true, card },
            { status: 201 }
        );
    } catch (error) {
        return NextResponse.json(
            { success: false, error: error.message || "Failed to create wallet" },
            { status: 500 }
        );
    }
}
