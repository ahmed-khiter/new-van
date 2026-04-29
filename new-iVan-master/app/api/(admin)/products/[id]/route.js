import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { uploadFileToS3, deleteFileFromS3 } from "@/utils/s3Helper";

export const GET = async (req, { params }) => {
    try {
        const { id } = params;

        const product = await prisma.products.findUnique({
            where: { id },
            include: {
                createdBy: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true
                    }
                }
            }
        });

        if (!product) {
            return NextResponse.json({ error: "Product not found" }, { status: 404 });
        }

        return NextResponse.json({ product }, { status: 200 });
    } catch (error) {
        console.error('Error fetching product:', error);
        return NextResponse.json({ error: error.message || "Failed to fetch product" }, { status: 500 });
    }
};

export const PATCH = async (req, { params }) => {
    try {
        const { id } = params;
        const userId = req.headers.get("user-id");
        const userRole = req.headers.get("role");

        // Check if product exists
        const existingProduct = await prisma.products.findUnique({
            where: { id }
        });

        if (!existingProduct) {
            return NextResponse.json({ error: "Product not found" }, { status: 404 });
        }

        const formData = await req.formData();
        
        // Extract form data
        const name = formData.get("name");
        const description = formData.get("description");
        const price = formData.get("price");
        const category = formData.get("category");
        const subcategory = formData.get("subcategory");
        const stock = formData.get("stock");
        const weight = formData.get("weight");
        const length = formData.get("length");
        const width = formData.get("width");
        const height = formData.get("height");
        const pickupAddress = formData.get("pickupAddress");
        const pickupCity = formData.get("pickupCity");
        const pickupPostCode = formData.get("pickupPostCode");
        const pickupLat = formData.get("pickupLat");
        const pickupLng = formData.get("pickupLng");
        const isActive = formData.get("isActive");
        const imageFile = formData.get("image");
        const removeImage = formData.get("removeImage");
        const newImages = formData.getAll("images");
        const existingImagesRaw = formData.get("existingImages");
        const variantsRaw = formData.get("variants");
        // Restaurant-specific fields
        const cuisine = formData.get("cuisine");
        const menuCategory = formData.get("menuCategory");
        const isAvailable = formData.get("isAvailable");
        const preparationTime = formData.get("preparationTime");
        const allergens = formData.get("allergens");
        const dietaryInfo = formData.get("dietaryInfo");
        const calories = formData.get("calories");

        // Update product data
        const updateData = {};
        if (name !== null) updateData.name = name;
        if (description !== null) updateData.description = description;
        if (price !== null) updateData.price = parseFloat(price);
        if (category !== null) updateData.category = category;
        if (subcategory !== null) updateData.subcategory = subcategory;
        if (stock !== null) updateData.stock = parseInt(stock);
        if (weight !== null) updateData.weight = weight ? parseFloat(weight) : null;
        if (pickupAddress !== null) updateData.pickupAddress = pickupAddress;
        if (pickupCity !== null) updateData.pickupCity = pickupCity;
        if (pickupPostCode !== null) updateData.pickupPostCode = pickupPostCode;
        if (pickupLat !== null) updateData.pickupLat = pickupLat ? parseFloat(pickupLat) : null;
        if (pickupLng !== null) updateData.pickupLng = pickupLng ? parseFloat(pickupLng) : null;
        if (isActive !== null) updateData.isActive = isActive === 'true' || isActive === true;
        // Restaurant-specific fields
        if (cuisine !== null) updateData.cuisine = cuisine;
        if (menuCategory !== null) updateData.menuCategory = menuCategory;
        if (isAvailable !== null) updateData.isAvailable = isAvailable === 'true' || isAvailable === true;
        if (preparationTime !== null) updateData.preparationTime = preparationTime ? parseInt(preparationTime) : null;
        if (allergens !== null) {
            try {
                updateData.allergens = JSON.parse(allergens);
            } catch (e) {
                updateData.allergens = allergens.split(',').map(a => a.trim()).filter(Boolean);
            }
        }
        if (dietaryInfo !== null) {
            try {
                updateData.dietaryInfo = JSON.parse(dietaryInfo);
            } catch (e) {
                updateData.dietaryInfo = dietaryInfo.split(',').map(d => d.trim()).filter(Boolean);
            }
        }
        if (calories !== null) updateData.calories = calories ? parseInt(calories) : null;

        if (variantsRaw !== null) {
            if (variantsRaw && variantsRaw.trim()) {
                try {
                    updateData.variants = JSON.parse(variantsRaw);
                } catch (e) {
                    updateData.variants = null;
                }
            } else {
                updateData.variants = null;
            }
        }

        // Handle dimensions
        if (length !== null && width !== null && height !== null) {
            updateData.dimensions = (length && width && height) ? {
                length: parseFloat(length),
                width: parseFloat(width),
                height: parseFloat(height)
            } : null;
        }

        // Handle multi-image update
        let newImageFileName = null;
        const oldImages = Array.isArray(existingProduct.images) ? existingProduct.images : 
            (existingProduct.image ? [existingProduct.image] : []);

        // Parse which existing images to keep
        let keptImages = [];
        if (existingImagesRaw) {
            try {
                keptImages = JSON.parse(existingImagesRaw);
                if (!Array.isArray(keptImages)) keptImages = [];
            } catch (e) {
                keptImages = [];
            }
        }

        // If existingImages was sent, delete removed images from S3
        if (existingImagesRaw !== null) {
            const removedImages = oldImages.filter(key => !keptImages.includes(key));
            for (const key of removedImages) {
                try {
                    await deleteFileFromS3(key);
                } catch (deleteError) {
                    console.error('Error deleting old image:', deleteError);
                }
            }
        } else {
            keptImages = oldImages;
        }

        // Handle legacy single image field
        if (removeImage === 'true' && existingProduct.image) {
            if (!keptImages.includes(existingProduct.image)) {
                try { await deleteFileFromS3(existingProduct.image); } catch (e) {}
            }
            keptImages = keptImages.filter(k => k !== existingProduct.image);
        } else if (imageFile && imageFile.size > 0) {
            try {
                newImageFileName = await uploadFileToS3(imageFile);
                keptImages = [newImageFileName, ...keptImages.filter(k => k !== existingProduct.image)];
                if (existingProduct.image && !keptImages.includes(existingProduct.image)) {
                    try { await deleteFileFromS3(existingProduct.image); } catch (e) {}
                }
            } catch (uploadError) {
                console.error('Error uploading new image:', uploadError);
                return NextResponse.json({ error: "Failed to upload image" }, { status: 500 });
            }
        }

        // Upload new additional images
        if (newImages && newImages.length > 0) {
            for (const file of newImages) {
                if (file && file.size > 0 && keptImages.length < 8) {
                    try {
                        const key = await uploadFileToS3(file);
                        keptImages.push(key);
                    } catch (uploadError) {
                        console.error('Error uploading additional image:', uploadError);
                    }
                }
            }
        }

        // Update image fields
        updateData.images = keptImages.length > 0 ? keptImages : null;
        updateData.image = keptImages.length > 0 ? keptImages[0] : null;
        if (keptImages.length > 0) {
            newImageFileName = keptImages[0];
        }

        const product = await prisma.products.update({
            where: { id },
            data: updateData
        });

        // Update gallery entry if product has shopId and image was changed
        if (existingProduct.shopId && (newImageFileName !== null || removeImage === 'true')) {
            try {
                // Find existing gallery entry for this product
                const galleryEntry = await prisma.shop_gallery.findFirst({
                    where: {
                        productId: id,
                        shopId: existingProduct.shopId
                    }
                });

                if (galleryEntry) {
                    if (removeImage === 'true') {
                        // Delete gallery entry if image is removed
                        await prisma.shop_gallery.delete({
                            where: { id: galleryEntry.id }
                        });
                    } else if (newImageFileName) {
                        // Update gallery entry with new image
                        await prisma.shop_gallery.update({
                            where: { id: galleryEntry.id },
                            data: {
                                image: newImageFileName,
                                caption: name || existingProduct.name // Update caption if name changed
                            }
                        });
                    }
                } else if (newImageFileName && (userRole === 'shop-owner' || userRole === 'restaurant')) {
                    // Create gallery entry if it doesn't exist but image was added
                    const galleryType = userRole === "restaurant" ? "menu" : "product";
                    
                    const maxOrderResult = await prisma.shop_gallery.aggregate({
                        where: { 
                            shopId: existingProduct.shopId,
                            type: galleryType
                        },
                        _max: { order: true }
                    });
                    const newOrder = (maxOrderResult._max.order ?? -1) + 1;

                    await prisma.shop_gallery.create({
                        data: {
                            shopId: existingProduct.shopId,
                            image: newImageFileName,
                            caption: name || existingProduct.name,
                            type: galleryType,
                            productId: id,
                            order: newOrder
                        }
                    });
                }
            } catch (galleryError) {
                console.error('Error updating gallery:', galleryError);
                // Don't fail the product update if gallery update fails
            }
        }

        return NextResponse.json({ 
            message: "Product updated successfully",
            product
        }, { status: 200 });
    } catch (error) {
        console.error('Error updating product:', error);
        return NextResponse.json({ error: error.message || "Failed to update product" }, { status: 500 });
    }
};

export const DELETE = async (req, { params }) => {
    try {
        const { id } = params;
        const userId = req.headers.get("user-id");
        const userRole = req.headers.get("role");
        // Check if product exists
        const existingProduct = await prisma.products.findUnique({
            where: { id }
        });

        if (!existingProduct) {
            return NextResponse.json({ error: "Product not found" }, { status: 404 });
        }

        // Check if product has orders
        const orderCount = await prisma.product_orders.count({
            where: { cart : {
                cartItems: {
                    some: {
                        productId: id
                    }
                }
            } }
        });
        if (orderCount > 0) {
            return NextResponse.json({ 
                error: "Cannot delete product with existing orders. Deactivate it instead." 
            }, { status: 400 });
        }

        // Delete gallery entry if exists
        if (existingProduct.shopId) {
            try {
                const galleryEntry = await prisma.shop_gallery.findFirst({
                    where: {
                        productId: id,
                        shopId: existingProduct.shopId
                    }
                });

                if (galleryEntry) {
                    await prisma.shop_gallery.delete({
                        where: { id: galleryEntry.id }
                    });
                }
            } catch (galleryError) {
                console.error('Error deleting gallery entry:', galleryError);
                // Continue with product deletion even if gallery deletion fails
            }
        }

        // Delete all product images from S3
        const imagesToDelete = Array.isArray(existingProduct.images) ? existingProduct.images :
            (existingProduct.image ? [existingProduct.image] : []);
        for (const imgKey of imagesToDelete) {
            try {
                await deleteFileFromS3(imgKey);
            } catch (deleteError) {
                console.error('Error deleting product image:', deleteError);
            }
        }

        // Delete product
        await prisma.products.delete({
            where: { id }
        });

        return NextResponse.json({ 
            message: "Product deleted successfully",
            deletedProduct: {
                id: existingProduct.id,
                name: existingProduct.name
            }
        }, { status: 200 });
    } catch (error) {
        console.error('Error deleting product:', error);
        return NextResponse.json({ error: error.message || "Failed to delete product" }, { status: 500 });
    }
};
