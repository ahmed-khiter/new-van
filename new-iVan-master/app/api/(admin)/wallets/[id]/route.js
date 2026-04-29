import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";


// Get single wallet
export async function GET(req, { params }) {
    try {
        const wallet = await prisma.wallets.findUnique({
            where: { id: params.id },
            include: { provider: true },
        });

        if (!wallet) {
            return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
        }

        return NextResponse.json(wallet);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch wallet" }, { status: 500 });
    }
}

// Update wallet
export async function PUT(req, { params }) {
    try {
        const body = await req.json();
        const { amount, default: isDefault } = body;

        // Find wallet to update (to get providerId)
        const wallet = await prisma.wallets.findUnique({
            where: { id: params.id },
        });

        if (!wallet) {
            return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
        }

        // If marking as default, unset all others first
        if (isDefault) {
            await prisma.wallets.updateMany({
                where: { providerId: wallet.providerId },
                data: { default: false },
            });
        }

        // Update this wallet (only once)
        const updatedWallet = await prisma.wallets.update({
            where: { id: params.id },
            data: {
                ...(amount !== undefined && { amount }), // only update if provided
                ...(isDefault !== undefined && { default: isDefault }),
            },
        });

        return NextResponse.json(updatedWallet);
    } catch (error) {
        return NextResponse.json({ error: "Failed to update wallet" }, { status: 500 });
    }
}



// Delete wallet
export async function DELETE(req, { params }) {
    try {
        await prisma.wallets.delete({
            where: { id: params.id },
        });

        return NextResponse.json({ message: "Wallet deleted successfully" });
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete wallet" }, { status: 500 });
    }
}
