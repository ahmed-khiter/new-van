import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export const POST = async (req) => {
    try {
        const userId = req.headers.get("user-id");
        
        if (!userId) {
            return NextResponse.json({
                success: false,
                message: "User ID is required"
            }, { status: 400 });
        }

        const providerId = parseInt(userId);
        const { latitude, longitude } = await req.json();

        if (!latitude || !longitude) {
            return NextResponse.json({
                success: false,
                message: "Latitude and longitude are required"
            }, { status: 400 });
        }

        // Update provider location
        await prisma.users.update({
            where: { id: providerId },
            data: {
                latitude: parseFloat(latitude),
                longitude: parseFloat(longitude)
            }
        });

        return NextResponse.json({
            success: true,
            message: "Location updated successfully"
        }, { status: 200 });

    } catch (error) {
        console.error('Error updating provider location:', error);
        return NextResponse.json({
            success: false,
            message: error.message || "Failed to update location"
        }, { status: 500 });
    }
};

