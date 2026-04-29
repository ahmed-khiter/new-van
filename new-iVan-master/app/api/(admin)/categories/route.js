import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { uploadFileToS3, deleteFileFromS3 } from "@/utils/s3Helper";
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
        return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
    }
};

export const POST = async (req) => {
    try {
        const userRole = req.headers.get("role");
        
        if (userRole !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const formData = await req.formData();
        
        const name = formData.get("name");
        const imageFile = formData.get("image");
        const type = formData.get("type") || null; // "shop" or "restaurant"
        const subcategoriesRaw = formData.get("subcategories");
        let subcategories = null;
        if (subcategoriesRaw) {
            try {
                subcategories = JSON.parse(subcategoriesRaw);
            } catch (e) {
                subcategories = null;
            }
        }

        if (!name) {
            return NextResponse.json({ error: "Name is required" }, { status: 400 });
        }

        let imageFileName = null;
        if (imageFile && imageFile.size > 0) {
            const allowedTypes = ['image/png', 'image/jpg', 'image/jpeg', 'image/webp'];
            if (!allowedTypes.includes(imageFile.type)) {
                return NextResponse.json({ error: "Only PNG, JPG, JPEG, and WEBP images are allowed" }, { status: 400 });
            }

            const maxSize = 5 * 1024 * 1024;
            if (imageFile.size > maxSize) {
                return NextResponse.json({ error: "Image size must be less than 5MB" }, { status: 400 });
            }

            if (!process.env.S3_BUCKET || !process.env.S3_KEY || !process.env.S3_SECRET || !process.env.S3_REGION) {
                return NextResponse.json({ error: "S3 configuration is missing" }, { status: 500 });
            }

            try {
                const uploadPromise = uploadFileToS3(imageFile);
                const timeoutPromise = new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Upload timeout after 30 seconds')), 30000)
                );
                
                imageFileName = await Promise.race([uploadPromise, timeoutPromise]);
            } catch (uploadError) {
                return NextResponse.json({ 
                    error: `Failed to upload image: ${uploadError.message}` 
                }, { status: 500 });
            }
        }

        const categoryCount = await prisma.categories.count();
        
        if (categoryCount === 0) {
            await prisma.$executeRaw`ALTER TABLE categories AUTO_INCREMENT = 5001`;
        }

        // Get the max position and add 1 for new category
        const maxPositionResult = await prisma.categories.aggregate({
            _max: {
                position: true
            }
        });
        const newPosition = (maxPositionResult._max.position ?? -1) + 1;

        const category = await prisma.categories.create({
            data: {
                name: name,
                image: imageFileName,
                type: type,
                subcategories: subcategories,
                position: newPosition
            }
        });

        const categoryWithFullUrl = {
            ...category,
            image: getFileUrl(category.image)
        };

        return NextResponse.json({ category: categoryWithFullUrl }, { status: 201 });
    } catch (error) {
        console.error('Error creating category:', error);
        return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
    }
};

