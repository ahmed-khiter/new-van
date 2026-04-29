import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { uploadFileToS3 } from "@/utils/s3Helper";
export const dynamic = 'force-dynamic';

const getOwnerShopWhereClause = (userId, userRole) => ({
    createdById: Number(userId),
    ...(userRole === "restaurant" ? { type: "restaurant" } : { type: { not: "restaurant" } }),
});

export const GET = async (req) => {
    try {
        const userRole = req.headers.get("role");
        const userId = req.headers.get("user-id");
        const { searchParams } = new URL(req.url);
        const search = searchParams.get("search") || "";
        const category = searchParams.get("category") || "";
        const status = searchParams.get("status") || "";
        const stock = searchParams.get("stock") || "";
        const dateFrom = searchParams.get("dateFrom") || "";
        const dateTo = searchParams.get("dateTo") || "";
        const shopId = searchParams.get("shopId") || "";

        let whereClause = {};

        if (search) {
            whereClause.OR = [
                { name: { contains: search} },
                // { description: { contains: search} },
                { category: { contains: search} },
            ];
        }

        if (category) {
            whereClause.category = category;
        }

        if (status) {
            whereClause.isActive = status === 'active';
        }

        if (stock) {
            if (stock === 'in-stock') {
                whereClause.stock = { gt: 0 };
            } else if (stock === 'out-of-stock') {
                whereClause.stock = { lte: 0 };
            }
        }

        if (dateFrom || dateTo) {
            whereClause.createdAt = {};
            if (dateFrom) {
                whereClause.createdAt.gte = new Date(dateFrom);
            }
            if (dateTo) {
                whereClause.createdAt.lte = new Date(dateTo + 'T23:59:59.999Z');
            }
        }

        if (shopId) {
            // Check if the shop/restaurant is active before showing its products
            const shop = await prisma.shops.findFirst({
                where: { id: shopId },
                select: { status: true, type: true }
            });

            if (!shop || shop.status !== 'active') {
                // Return empty array if shop is not active or doesn't exist
                return NextResponse.json({ products: [] }, { status: 200 });
            }

            whereClause.shopId = shopId;
        }

        // Filter by availability for restaurants (isAvailable field)
        const availability = searchParams.get("availability") || "";
        if (availability) {
            if (availability === 'available') {
                whereClause.isAvailable = true;
            } else if (availability === 'unavailable') {
                whereClause.isAvailable = false;
            }
        }

        // Filter by cuisine for restaurants
        const cuisine = searchParams.get("cuisine") || "";
        if (cuisine) {
            whereClause.cuisine = cuisine;
        }

        // Restrict shop owners and restaurants to their own products
        if (userId) {
            whereClause.createdById = Number(userId);
        }
        const products = await prisma.products.findMany({
            where: whereClause,
            include: {
                createdBy: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({ products }, { status: 200 });
    } catch (error) {
        console.error('Error fetching products:', error);
        return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
    }
};

export const POST = async (req) => {
    try {
        const userId = req.headers.get("user-id");
        const userRole = req.headers.get("role");
        
        if (userRole !== "admin" && userRole !== 'shop-owner' && userRole !== 'restaurant') {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
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
        const imageFile = formData.get("image");
        const additionalImages = formData.getAll("images");
        const isActive = formData.get("isActive");
        const variantsRaw = formData.get("variants");
        // Restaurant-specific fields
        const cuisine = formData.get("cuisine");
        const menuCategory = formData.get("menuCategory");
        const isAvailable = formData.get("isAvailable");
        const preparationTime = formData.get("preparationTime");
        const allergens = formData.get("allergens");
        const dietaryInfo = formData.get("dietaryInfo");
        const calories = formData.get("calories");

        // Parse variants early to check if variants are enabled
        let variantsParsed = null;
        if (variantsRaw && variantsRaw.trim()) {
            try {
                variantsParsed = JSON.parse(variantsRaw);
            } catch (e) {
                variantsParsed = null;
            }
        }
        const hasVariants = variantsParsed?.enabled && variantsParsed?.items?.length > 0;

        // Validate required fields — price is not required when variants are enabled
        if (!name || (!hasVariants && !price)) {
            return NextResponse.json({ error: "Name and price are required" }, { status: 400 });
        }

        // For shop owners and restaurants, require at least one image
        const hasMainImage = imageFile && imageFile.size > 0;
        const hasAdditionalImages = additionalImages && additionalImages.some(f => f && f.size > 0);
        if (userRole === 'shop-owner' || userRole === 'restaurant') {
            if (!hasMainImage && !hasAdditionalImages) {
                return NextResponse.json({ error: "Product photo is required" }, { status: 400 });
            }
        }

        // For shop owners and restaurants, validate that they have a shop/restaurant
        if (userRole === 'shop-owner' || userRole === 'restaurant') {
            const shop = await prisma.shops.findFirst({ 
                where: getOwnerShopWhereClause(userId, userRole),
                select: { 
                    id: true,
                    address1: true,
                    city: true,
                    postCode: true,
                    latitude: true,
                    longitude: true
                }
            });

            if (!shop) {
                return NextResponse.json({ 
                    error: `${userRole === "restaurant" ? "Restaurant" : "Shop"} not found. Please create your business profile first.` 
                }, { status: 400 });
            }

            // Check if shop has complete address information
            if (shop.latitude === null || shop.longitude === null) {
                return NextResponse.json({ 
                    error: `${userRole === "restaurant" ? "Restaurant" : "Shop"} address is incomplete. Please update your ${userRole === "restaurant" ? "restaurant" : "shop"} address with complete location details before adding products.` 
                }, { status: 400 });
            }
        }

        // Handle image uploads (up to 8 total)
        let imageFileName = null;
        let allImageKeys = [];

        // Upload main image first (backward compat "image" field)
        if (imageFile && imageFile.size > 0) {
            try {
                imageFileName = await uploadFileToS3(imageFile);
                allImageKeys.push(imageFileName);
            } catch (uploadError) {
                console.error('Error uploading image:', uploadError);
                return NextResponse.json({ error: "Failed to upload image" }, { status: 500 });
            }
        }

        // Upload additional images
        if (additionalImages && additionalImages.length > 0) {
            for (const file of additionalImages) {
                if (file && file.size > 0 && allImageKeys.length < 8) {
                    try {
                        const key = await uploadFileToS3(file);
                        allImageKeys.push(key);
                    } catch (uploadError) {
                        console.error('Error uploading additional image:', uploadError);
                    }
                }
            }
        }

        // Set main image to first uploaded image if not already set
        if (!imageFileName && allImageKeys.length > 0) {
            imageFileName = allImageKeys[0];
        }

        // Prepare dimensions object
        const dimensions = (length && width && height) ? {
            length: parseFloat(length),
            width: parseFloat(width),
            height: parseFloat(height)
        } : null;

 
        let shopId = null;
        let shopAddress = null;
        let shopCity = null;
        let shopPostCode = null;
        let shopLat = null;
        let shopLng = null;

        if (userRole === 'shop-owner' || userRole === 'restaurant') {
            const shop = await prisma.shops.findFirst({ 
                where: getOwnerShopWhereClause(userId, userRole),
                select: { 
                    id: true,
                    address1: true,
                    city: true,
                    postCode: true,
                    latitude: true,
                    longitude: true
                } 
            });
            shopId = shop?.id || null;
            
            // Use shop's address details as default pickup location
            if (shop) {
                shopAddress = shop.address1;
                shopCity = shop.city;
                shopPostCode = shop.postCode;
                shopLat = shop.latitude;
                shopLng = shop.longitude;
            }
        }

        // Parse JSON fields for restaurant-specific data
        let allergensParsed = null;
        if (allergens) {
            try {
                allergensParsed = JSON.parse(allergens);
            } catch (e) {
                // If not valid JSON, treat as comma-separated string
                allergensParsed = allergens.split(',').map(a => a.trim()).filter(Boolean);
            }
        }

        let dietaryInfoParsed = null;
        if (dietaryInfo) {
            try {
                dietaryInfoParsed = JSON.parse(dietaryInfo);
            } catch (e) {
                dietaryInfoParsed = dietaryInfo.split(',').map(d => d.trim()).filter(Boolean);
            }
        }

        const product = await prisma.products.create({
            data: {
                name: name,
                description: description || null,
                price: price ? parseFloat(price) : 0,
                image: imageFileName,
                images: allImageKeys.length > 0 ? allImageKeys : null,
                category: category || null,
                subcategory: subcategory || null,
                stock: parseInt(stock) || 0,
                weight: weight ? parseFloat(weight) : null,
                dimensions: dimensions,
                pickupAddress: pickupAddress || shopAddress || null,
                pickupCity: pickupCity || shopCity || null,
                pickupPostCode: pickupPostCode || shopPostCode || null,
                pickupLat: pickupLat ? parseFloat(pickupLat) : (shopLat ? parseFloat(shopLat) : null),
                pickupLng: pickupLng ? parseFloat(pickupLng) : (shopLng ? parseFloat(shopLng) : null),
                createdById: parseInt(userId),
                shopId: shopId,
                isActive: isActive === 'true' || isActive === true,
                variants: variantsParsed,
                // Restaurant-specific fields
                cuisine: cuisine || null,
                menuCategory: menuCategory || null,
                isAvailable: isAvailable !== null && isAvailable !== undefined ? (isAvailable === 'true' || isAvailable === true) : true,
                preparationTime: preparationTime ? parseInt(preparationTime) : null,
                allergens: allergensParsed,
                dietaryInfo: dietaryInfoParsed,
                calories: calories ? parseInt(calories) : null
            }
        });

        // Save product/menu image to gallery if shopId exists and image was uploaded
        if (shopId && imageFileName && (userRole === 'shop-owner' || userRole === 'restaurant')) {
            try {
                // Determine gallery type based on user role
                const galleryType = userRole === "restaurant" ? "menu" : "product";
                
                // Get the maximum order value to add new item at the end for this type
                const maxOrderResult = await prisma.shop_gallery.aggregate({
                    where: { 
                        shopId: shopId,
                        type: galleryType
                    },
                    _max: { order: true }
                });
                const newOrder = (maxOrderResult._max.order ?? -1) + 1;

                // Create gallery item linked to the product
                await prisma.shop_gallery.create({
                    data: {
                        shopId: shopId,
                        image: imageFileName,
                        caption: name, // Use product name as caption
                        type: galleryType,
                        productId: product.id,
                        order: newOrder
                    }
                });
            } catch (galleryError) {
                console.error('Error saving to gallery:', galleryError);
                // Don't fail the product creation if gallery save fails
                // Product is already created, just log the error
            }
        }

        return NextResponse.json({ product }, { status: 201 });
    } catch (error) {
        console.error('Error creating product:', error);
        return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
    }
};
