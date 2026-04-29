import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export const PATCH = async (req) => {
    try {
        const userRole = req.headers.get("role");
        
        if (userRole !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const body = await req.json();
        const { categoryId, direction } = body; // direction: 'up' or 'down'

        if (!categoryId || !direction) {
            return NextResponse.json({ error: "Category ID and direction are required" }, { status: 400 });
        }

        if (!['up', 'down'].includes(direction)) {
            return NextResponse.json({ error: "Direction must be 'up' or 'down'" }, { status: 400 });
        }

        const category = await prisma.categories.findUnique({
            where: { id: parseInt(categoryId) }
        });

        if (!category) {
            return NextResponse.json({ error: "Category not found" }, { status: 404 });
        }

        const currentPosition = category.position;

        // Find the category to swap with
        const swapCategory = await prisma.categories.findFirst({
            where: direction === 'up' 
                ? { position: { lt: currentPosition } }
                : { position: { gt: currentPosition } },
            orderBy: direction === 'up' 
                ? { position: 'desc' }
                : { position: 'asc' }
        });

        if (!swapCategory) {
            return NextResponse.json({ 
                error: `Cannot move category ${direction === 'up' ? 'up' : 'down'}. Already at ${direction === 'up' ? 'top' : 'bottom'}.` 
            }, { status: 400 });
        }

        // Swap positions
        await prisma.$transaction([
            prisma.categories.update({
                where: { id: parseInt(categoryId) },
                data: { position: swapCategory.position }
            }),
            prisma.categories.update({
                where: { id: swapCategory.id },
                data: { position: currentPosition }
            })
        ]);

        return NextResponse.json({ 
            message: "Category position updated successfully" 
        }, { status: 200 });
    } catch (error) {
        console.error('Error updating category position:', error);
        return NextResponse.json({ error: "Failed to update category position" }, { status: 500 });
    }
};

