import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { uploadFileToS3, deleteFileFromS3 } from "@/utils/s3Helper";
import { getFileUrl } from "@/utils/helper";

export const GET = async (req, { params }) => {
    try {
        const { id } = params;

        const category = await prisma.categories.findUnique({
            where: { id: parseInt(id) }
        });

        if (!category) {
            return NextResponse.json({ error: "Category not found" }, { status: 404 });
        }

        const categoryWithFullUrl = {
            ...category,
            image: getFileUrl(category.image)
        };

        return NextResponse.json({ category: categoryWithFullUrl }, { status: 200 });
    } catch (error) {
        console.error('Error fetching category:', error);
        return NextResponse.json({ error: "Failed to fetch category" }, { status: 500 });
    }
};

export const PUT = async (req, { params }) => {
    try {
        const userRole = req.headers.get("role");
        
        if (userRole !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const { id } = params;
        const formData = await req.formData();
        
        const name = formData.get("name");
        const imageFile = formData.get("image");
        const removeImage = formData.get("removeImage") === "true";
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
        const existingCategory = await prisma.categories.findUnique({
            where: { id: parseInt(id) }
        });

        if (!existingCategory) {
            return NextResponse.json({ error: "Category not found" }, { status: 404 });
        }

        let imageFileName = existingCategory.image;

        if (removeImage && existingCategory.image) {
            try {
                await deleteFileFromS3(existingCategory.image);
                imageFileName = null;
            } catch (error) {
                console.error('Error deleting old image:', error);
            }
        }

        if (imageFile && imageFile.size > 0) {
            const allowedTypes = ['image/png', 'image/jpg', 'image/jpeg', 'image/webp'];
            if (!allowedTypes.includes(imageFile.type)) {
                return NextResponse.json({ error: "Only PNG, JPG, JPEG, and WEBP images are allowed" }, { status: 400 });
            }

            if (existingCategory.image) {
                try {
                    await deleteFileFromS3(existingCategory.image);
                } catch (error) {
                    console.error('Error deleting old image:', error);
                }
            }

            try {
                imageFileName = await uploadFileToS3(imageFile);
            } catch (uploadError) {
                return NextResponse.json({ error: "Failed to upload image" }, { status: 500 });
            }
        }

        const category = await prisma.categories.update({
            where: { id: parseInt(id) },
            data: {
                name: name,
                image: imageFileName,
                type: type,
                subcategories: subcategories
            }
        });

        const categoryWithFullUrl = {
            ...category,
            image: getFileUrl(category.image)
        };

        return NextResponse.json({ category: categoryWithFullUrl }, { status: 200 });
    } catch (error) {
        console.error('Error updating category:', error);
        return NextResponse.json({ error: "Failed to update category" }, { status: 500 });
    }
};

export const DELETE = async (req, { params }) => {
    try {
        const userRole = req.headers.get("role");
        
        if (userRole !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const { id } = params;

        const category = await prisma.categories.findUnique({
            where: { id: parseInt(id) }
        });

        if (!category) {
            return NextResponse.json({ error: "Category not found" }, { status: 404 });
        }

        if (category.image) {
            try {
                await deleteFileFromS3(category.image);
            } catch (error) {
                console.error('Error deleting image from S3:', error);
            }
        }

        await prisma.categories.delete({
            where: { id: parseInt(id) }
        });

        return NextResponse.json({ message: "Category deleted successfully" }, { status: 200 });
    } catch (error) {
        console.error('Error deleting category:', error);
        return NextResponse.json({ error: "Failed to delete category" }, { status: 500 });
    }
};

