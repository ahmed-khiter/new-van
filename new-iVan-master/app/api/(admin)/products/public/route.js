import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getFileUrl } from "@/utils/helper";

export const dynamic = 'force-dynamic';
export const GET = async (req) => {
    try {
        const { searchParams } = new URL(req.url);
        const productId = searchParams.get("id");
        const userId = searchParams.get("userId");
        
        // If requesting a single product by ID
        if (productId) {
            const product = await prisma.products.findFirst({
                where: {
                    id: productId,
                    isActive: true
                },
                include: {
                    shop: {
                        select: { status: true }
                    }
                }
            });

            if (!product) {
                return NextResponse.json({ error: "Product not found" }, { status: 404 });
            }

            // Check if the shop is active
            if (!product.shop || product.shop.status !== 'active') {
                return NextResponse.json({ error: "Product not available" }, { status: 404 });
            }

            // Remove shop data from response
            const { shop, ...productData } = product;
            
            // Add imageUrl, imageUrls, and isFavorite field for single product request
            const imgArray = Array.isArray(productData.images) ? productData.images : 
                (productData.image ? [productData.image] : []);
            let productWithFavorite = { 
                ...productData, 
                imageUrl: getFileUrl(productData.image),
                imageUrls: imgArray.map(key => getFileUrl(key)),
                isFavorite: false 
            };
            
            if (userId) {
                const favorite = await prisma.favorite_products.findFirst({
                    where: {
                        userId: Number(userId),
                        productId: productId
                    }
                });
                productWithFavorite.isFavorite = !!favorite;
            }

            return NextResponse.json({ product: productWithFavorite }, { status: 200 });
        }

        // Otherwise, return paginated list
        const search = searchParams.get("search") || "";
        const category = searchParams.get("category") || "";
        const minPrice = parseFloat(searchParams.get("minPrice"));
        const maxPrice = parseFloat(searchParams.get("maxPrice"));
        const inStockOnly = searchParams.get("inStockOnly") === "true";
        const shopId = searchParams.get("shopId");
        const subcategoriesOnly = searchParams.get("subcategoriesOnly") === "true";
        const sortBy = searchParams.get("sortBy") || "created_desc";
        const showFavorites = searchParams.get("showFavorites") === "true";
        const page = parseInt(searchParams.get("page")) || 1;
        const limit = parseInt(searchParams.get("limit")) || 12;
        const skip = (page - 1) * limit;

        let whereClause = {
            isActive: true // Only show active products to public
        };

        // Search filter
        if (search) {
            whereClause.OR = [
                { name: { contains: search } },
                { description: { contains: search } },
                { category: { contains: search } }
            ];
        }

        // Category filter
        if (category) {
            whereClause.category = category;
        }

        // Subcategory filter
        const subcategory = searchParams.get("subcategory") || "";
        if (subcategory) {
            whereClause.subcategory = subcategory;
        }

        // Price range filter
        if (!isNaN(minPrice) || !isNaN(maxPrice)) {
            whereClause.price = {};
            if (!isNaN(minPrice)) {
                whereClause.price.gte = minPrice;
            }
            if (!isNaN(maxPrice)) {
                whereClause.price.lte = maxPrice;
            }
        }

        // Stock filter
        if (inStockOnly) {
            whereClause.stock = {
                gt: 0
            };
        }


        // Filter by cuisine for restaurants
        const cuisine = searchParams.get("cuisine") || "";
        if (cuisine) {
            whereClause.cuisine = cuisine;
        }

        // Filter by menuCategory for restaurants
        const menuCategory = searchParams.get("menuCategory") || "";
        if (menuCategory) {
            whereClause.menuCategory = menuCategory;
        }

        if (shopId) {
            // Check if the shop is active before showing its products
            const shop = await prisma.shops.findUnique({
                where: { id: shopId },
                select: { 
                    status: true,
                    type: true
                }
            });

            if (!shop || shop.status !== 'active') {
                // Return empty array if shop is not active or doesn't exist
                return NextResponse.json({
                    products: [],
                    pagination: {
                        currentPage: page,
                        totalPages: 0,
                        totalCount: 0,
                        limit,
                        hasNextPage: false,
                        hasPrevPage: false,
                    }
                }, { status: 200 });
            }

            // For restaurants, also filter by isAvailable
            if (shop.type === "restaurant") {
                whereClause.isAvailable = true; // Only show available items for restaurants
            }

            whereClause.shopId = shopId;
        }

        if (subcategoriesOnly) {
            const subcategoryRows = await prisma.products.groupBy({
                by: ["subcategory"],
                where: {
                    ...whereClause,
                    subcategory: {
                        not: null
                    }
                },
                _count: {
                    subcategory: true
                }
            });

            const subcategories = subcategoryRows
                .map((row) => ({
                    name: String(row.subcategory || "").trim(),
                    count: row._count?.subcategory || 0
                }))
                .filter((row) => row.name.length > 0)
                .sort((a, b) => a.name.localeCompare(b.name));

            return NextResponse.json({ subcategories }, { status: 200 });
        }

        if (showFavorites && userId) {
            whereClause.favorites = {
                some: {
                    userId: Number(userId)
                }
            };
        }

        // Get total count for pagination
        const totalCount = await prisma.products.count({
            where: whereClause
        });

        // Build orderBy clause based on sortBy parameter
        let orderBy = { createdAt: 'desc' }; // default
        switch (sortBy) {
            case 'name_asc':
                orderBy = { name: 'asc' };
                break;
            case 'name_desc':
                orderBy = { name: 'desc' };
                break;
            case 'price_asc':
                orderBy = { price: 'asc' };
                break;
            case 'price_desc':
                orderBy = { price: 'desc' };
                break;
            case 'created_asc':
                orderBy = { createdAt: 'asc' };
                break;
            case 'created_desc':
            default:
                orderBy = { createdAt: 'desc' };
                break;
        }

        const products = await prisma.products.findMany({
            where: whereClause,
            select: {
                id: true,
                name: true,
                description: true,
                price: true,
                image: true,
                images: true,
                category: true,
                subcategory: true,
                cuisine: true,
                menuCategory: true,
                stock: true,
                weight: true,
                dimensions: true,
                variants: true,
                isAvailable: true,
                createdAt: true
            },
            orderBy: orderBy,
            skip: skip,
            take: limit
        });

        const totalPages = Math.ceil(totalCount / limit);
        let productsWithFavorites = products;
        if (userId) {
            const productIds = products.map(p => p.id);
            const favorites = await prisma.favorite_products.findMany({
                where: {
                    userId: Number(userId),
                    productId: { in: productIds }
                },
                select: { productId: true }
            });

            const favoriteProductIds = new Set(favorites.map(f => f.productId));
            
            productsWithFavorites = products.map(product => {
                const imgs = Array.isArray(product.images) ? product.images : 
                    (product.image ? [product.image] : []);
                return {
                    ...product,
                    imageUrl: getFileUrl(product.image),
                    imageUrls: imgs.map(key => getFileUrl(key)),
                    createdAt: product.createdAt,
                    isFavorite: favoriteProductIds.has(product.id)
                };
            });
        }else{
            productsWithFavorites = products.map(product => {
                const imgs = Array.isArray(product.images) ? product.images : 
                    (product.image ? [product.image] : []);
                return {
                    ...product,
                    imageUrl: getFileUrl(product.image),
                    imageUrls: imgs.map(key => getFileUrl(key)),
                    createdAt: product.createdAt,
                    isFavorite: false
                };
            });
        }

        return NextResponse.json({ 
            products: productsWithFavorites,
            pagination: {
                currentPage: page,
                totalPages,
                totalCount,
                limit,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            }
        }, { status: 200 });
    } catch (error) {
        console.error('Error fetching public products:', error);
        return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
    }
};
