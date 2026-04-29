import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { deleteFileFromS3 } from "@/utils/s3Helper";

export const dynamic = 'force-dynamic';

export const DELETE = async (req, { params }) => {
  try {
    const userId = req.headers.get("user-id");
    const role = req.headers.get("role");
    const { id } = params;
    
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

    const galleryItem = await prisma.shop_gallery.findUnique({
      where: { id },
      select: { id: true, shopId: true, image: true, type: true, productId: true }
    });

    if (!galleryItem) {
      return NextResponse.json({ error: "Gallery item not found" }, { status: 404 });
    }

    if (galleryItem.shopId !== shop.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (galleryItem.productId && (galleryItem.type === "product" || galleryItem.type === "menu")) {
      try {
        const product = await prisma.products.findUnique({
          where: { id: galleryItem.productId },
          select: { image: true }
        });

        await prisma.products.delete({
          where: { id: galleryItem.productId }
        });

        if (product?.image && product.image !== galleryItem.image) {
          try {
            await deleteFileFromS3(product.image);
          } catch (s3Error) {
            console.error("Error deleting product image from S3:", s3Error);
          }
        }
      } catch (productError) {
        console.error("Error deleting product:", productError);
        // Continue with gallery deletion even if product deletion fails
      }
    }

    try {
      if (galleryItem.image) {
        await deleteFileFromS3(galleryItem.image);
      }
    } catch (s3Error) {
      console.error("Error deleting image from S3:", s3Error);
    }

    await prisma.shop_gallery.delete({
      where: { id }
    });

    return NextResponse.json({ message: "Gallery item deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting gallery item:", error);
    return NextResponse.json(
      { error: "Failed to delete gallery item" },
      { status: 500 }
    );
  }
};

