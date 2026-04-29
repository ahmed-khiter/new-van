import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getFileUrl } from "@/utils/helper";

export const GET = async (req, { params }) => {
    try {
        const { id } = params;

        const shop = await prisma.shops.findUnique({
            where: { id },
            include: {
                createdBy: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true
                    }
                },
                _count: {
                    select: {
                        products: true
                    }
                }
            }
        });

        if (!shop) {
            return NextResponse.json({ error: "Shop not found" }, { status: 404 });
        }

        // Convert image filename to full URL
        const shopWithFullUrl = {
            ...shop,
            image: getFileUrl(shop.image)
        };

        return NextResponse.json({ shop: shopWithFullUrl }, { status: 200 });
    } catch (error) {
        console.error('Error fetching shop:', error);
        return NextResponse.json({ error: error.message || "Failed to fetch shop" }, { status: 500 });
    }
};

export const PATCH = async (req, { params }) => {
    try {
        const { id } = params;
        const data = await req.json();

        // Validate required fields
        if (!data.name) {
            return NextResponse.json({ error: "Shop name is required" }, { status: 400 });
        }

        // Prepare update data
        const updateData = {
            name: data.name,
            phone: data.phone || null,
            address1: data.address1 || null,
            address2: data.address2 || null,
            city: data.city || null,
            postCode: data.postCode || null,
        };

        // Add coordinates if provided
        if (data.latitude && data.longitude) {
            updateData.latitude = parseFloat(data.latitude);
            updateData.longitude = parseFloat(data.longitude);
        }

        // Add shop metadata if provided
        if (data.shop_metadata) {
            updateData.shop_metadata = data.shop_metadata;
        }

        // Add restaurant-specific fields if provided
        if (data.acceptsReservations !== undefined) {
            updateData.acceptsReservations = data.acceptsReservations === true || data.acceptsReservations === 'true';
        }

        const updatedShop = await prisma.shops.update({
            where: { id },
            data: updateData,
            include: {
                createdBy: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true
                    }
                },
                _count: {
                    select: {
                        products: true
                    }
                }
            }
        });

        // Convert image filename to full URL
        const shopWithFullUrl = {
            ...updatedShop,
            image: getFileUrl(updatedShop.image)
        };

        return NextResponse.json({ 
            message: "Shop updated successfully",
            shop: shopWithFullUrl 
        }, { status: 200 });
    } catch (error) {
        console.error('Error updating shop:', error);
        return NextResponse.json({ error: error.message || "Failed to update shop" }, { status: 500 });
    }
};

export const DELETE = async (req, { params }) => {
    try {
        const { id } = params;

        // Check if shop exists
        const existingShop = await prisma.shops.findUnique({
            where: { id },
            include: {
                _count: {
                    select: {
                        products: true
                    }
                }
            }
        });

        if (!existingShop) {
            return NextResponse.json({ error: "Shop not found" }, { status: 404 });
        }

        // Delete shop (this will cascade delete products due to foreign key constraints)
        await prisma.shops.delete({
            where: { id }
        });

        return NextResponse.json({ 
            message: "Shop deleted successfully",
            deletedProductsCount: existingShop._count.products
        }, { status: 200 });
    } catch (error) {
        console.error('Error deleting shop:', error);
        return NextResponse.json({ error: error.message || "Failed to delete shop" }, { status: 500 });
    }
};
