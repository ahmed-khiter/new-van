import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { uploadFileToS3 } from "@/utils/s3Helper";
import { getFileUrl } from "@/utils/helper";
import { deleteFileFromS3 } from "@/utils/s3Helper";

export const dynamic = 'force-dynamic';

export const GET = async (req) => {
  try {
    const userId = req.headers.get("user-id");
    const role = req.headers.get("role");
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    
    if (!userId || (role !== "shop-owner" && role !== "restaurant")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const shopType = role === "restaurant" ? "restaurant" : "shop";
    const shop = await prisma.shops.findFirst({
      where: { 
        createdById: Number(userId),
        type: shopType
      },
      select: { id: true }
    });

    if (!shop) {
      return NextResponse.json({ error: "Shop not found" }, { status: 404 });
    }

    const whereClause = { shopId: shop.id };
    if (type && (type === "gallery" || type === "product" || type === "menu")) {
      whereClause.type = type;
    }

    const galleryItems = await prisma.shop_gallery.findMany({
      where: whereClause,
      orderBy: { order: 'asc' },
      select: {
        id: true,
        image: true,
        caption: true,
        type: true,
        productId: true,
        order: true,
        createdAt: true,
        updatedAt: true
      }
    });

    const galleryWithUrls = galleryItems.map(item => ({
      ...item,
      imageUrl: getFileUrl(item.image)
    }));

    return NextResponse.json({ gallery: galleryWithUrls }, { status: 200 });
  } catch (error) {
    console.error("Error fetching gallery:", error);
    return NextResponse.json(
      { error: "Failed to fetch gallery" },
      { status: 500 }
    );
  }
};

export const POST = async (req) => {
  try {
    const userId = req.headers.get("user-id");
    const role = req.headers.get("role");
    
    if (!userId || (role !== "shop-owner" && role !== "restaurant")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const shopType = role === "restaurant" ? "restaurant" : "shop";
    const shop = await prisma.shops.findFirst({
      where: { 
        createdById: Number(userId),
        type: shopType
      },
      select: { id: true }
    });

    if (!shop) {
      return NextResponse.json({ error: "Shop not found" }, { status: 404 });
    }

    const formData = await req.formData();
    const imageFile = formData.get("image");
    const caption = formData.get("caption") || null;
    const productId = formData.get("productId") || null;
    const galleryType = formData.get("type") || "gallery";

    if (!["gallery", "product", "menu"].includes(galleryType)) {
      return NextResponse.json({ 
        error: "Invalid type. Must be 'gallery', 'product', or 'menu'" 
      }, { status: 400 });
    }

    if (productId) {
      const product = await prisma.products.findUnique({
        where: { id: productId },
        select: { id: true, shopId: true }
      });

      if (!product) {
        return NextResponse.json({ error: "Product not found" }, { status: 404 });
      }

      if (product.shopId !== shop.id) {
        return NextResponse.json({ error: "Product does not belong to this shop" }, { status: 403 });
      }
    }

    if (!imageFile || imageFile.size === 0) {
      return NextResponse.json({ error: "Image file is required" }, { status: 400 });
    }

    const allowedTypes = ['image/png', 'image/jpg', 'image/jpeg', 'image/webp'];
    if (!allowedTypes.includes(imageFile.type)) {
      return NextResponse.json({ 
        error: "Invalid file type. Only PNG, JPG, JPEG, and WEBP images are allowed" 
      }, { status: 400 });
    }

    const maxSize = 10 * 1024 * 1024;
    if (imageFile.size > maxSize) {
      return NextResponse.json({ 
        error: "Image size must be less than 10MB" 
      }, { status: 400 });
    }

    // Upload image to S3
    let imageFileName;
    try {
      imageFileName = await uploadFileToS3(imageFile);
    } catch (uploadError) {
      console.error('Error uploading image:', uploadError);
      return NextResponse.json({ 
        error: `Failed to upload image: ${uploadError.message}` 
      }, { status: 500 });
    }

    const maxOrderResult = await prisma.shop_gallery.aggregate({
      where: { 
        shopId: shop.id,
        type: galleryType
      },
      _max: { order: true }
    });
    const newOrder = (maxOrderResult._max.order ?? -1) + 1;

    const galleryItem = await prisma.shop_gallery.create({
      data: {
        shopId: shop.id,
        image: imageFileName,
        caption: caption,
        type: galleryType,
        productId: productId,
        order: newOrder
      }
    });

    return NextResponse.json({ 
      galleryItem: {
        ...galleryItem,
        imageUrl: getFileUrl(galleryItem.image)
      }
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating gallery item:", error);
    return NextResponse.json(
      { error: "Failed to create gallery item" },
      { status: 500 }
    );
  }
};

