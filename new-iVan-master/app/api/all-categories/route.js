import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getFileUrl } from "@/utils/helper";
export const dynamic = 'force-dynamic';

export const GET = async (req) => {
    try {
        const { searchParams } = new URL(req.url);
        const search = searchParams.get("search") || "";
        const type = searchParams.get("type") || null; // "shop" or "restaurant"

        let whereClause = {};

        if (search) {
            whereClause.name = { contains: search };
        }

        if (type) {
            whereClause.type = type;
        }

        // Initialize positions for categories that don't have one yet (one-time migration)
        // Check if all categories have position 0 (indicating uninitialized state)
        const totalCount = await prisma.categories.count();
        const initializedCount = await prisma.categories.count({
            where: { position: { gt: 0 } }
        });

        // If we have categories but none are initialized (all have position 0), initialize them
        if (totalCount > 0 && initializedCount === 0) {
            // Initialize all categories with positions based on creation date
            const allCategories = await prisma.categories.findMany({
                orderBy: { createdAt: 'asc' }
            });
            
            // Update positions for all categories based on creation date
            await Promise.all(
                allCategories.map((category, index) =>
                    prisma.categories.update({
                        where: { id: category.id },
                        data: { position: index }
                    })
                )
            );
        }

        const categories = await prisma.categories.findMany({
            where: whereClause,
            orderBy: { position: 'asc' }
        });

        const categoriesWithFullUrls = categories.map(category => ({
            ...category,
            image: getFileUrl(category.image)
        }));

        return NextResponse.json({ categories: categoriesWithFullUrls }, { status: 200 });
    } catch (error) {
        console.error('Error fetching categories:', error);
        return NextResponse.json({ error: error.message || "Failed to fetch categories" }, { status: 500 });
    }
};
