import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { geocodePostcode } from "@/utils/geocode";
import { uploadFileToS3 } from "@/utils/s3Helper";
import { getFileUrl } from "@/utils/helper";

export const GET = async (request) => {
  const userId = request.headers.get("user-id");
  const userRole = request.headers.get("role");


  try {
    const userProfile = await prisma.users.findUnique({
      where: { id: parseInt(userId, 10) },
    });

    if (!userProfile) {
      return NextResponse.json({ error: "Profile not found" }, {
        status: 404,
      });
    }

    // Add full URL for profile picture
    const profileWithUrl = {
      ...userProfile,
      phone: userProfile.phone || null,
      profilePictureUrl: getFileUrl(userProfile.profilePicture)
    };

    // If user is a shop owner or restaurant, include shop/restaurant details
    // Now supports all shop types: shop, restaurant, mot, shisha, spa, beauty
    if (userRole === "shop-owner" || userRole === "restaurant") {
      // Find shop by user ID - don't filter by type, get whatever shop they own
      // This allows support for all service types
      const shop = await prisma.shops.findFirst({
        where: { 
          createdById: parseInt(userId, 10)
          // Removed type filter to support all types (shop, restaurant, mot, shisha, spa, beauty)
        }
      });

      const shopWithUrl = shop ? {
        ...shop,
        imageUrl: getFileUrl(shop.image)
      } : null;

      return NextResponse.json({ 
        profile: profileWithUrl,
        shop: shopWithUrl // Always return as 'shop' for consistency
      }, {
        status: 200,
      });
    }

    return NextResponse.json({ profile: profileWithUrl }, {
      status: 200,
    });
  } catch (err) {
    console.error("Error fetching profile:", err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
};


export const POST = async (request) => {
  const userId = request.headers.get("user-id");
  const userRole = request.headers.get("role");

  try {
    const formData = await request.formData();

    // Extract all form values once
    const firstName = formData.get("firstName");
    const lastName = formData.get("lastName");
    const phone = formData.get("phone");
    const preferredLocale = formData.get("preferredLocale");
    const address1 = formData.get("address1");
    const address2 = formData.get("address2");
    const city = formData.get("city");
    const postCode = formData.get("postCode");
    const latStr = formData.get("latitude");
    const lngStr = formData.get("longitude");
    const isFirstTime = formData.get("isFirstTime");
    
    // Shop owner specific fields
    const shopName = formData.get("shopName");
    const shopPhone = formData.get("shopPhone");
    const shopCategory = formData.get("shopCategory");
    const imageFile = formData.get("image");
    const shopMetadataStr = formData.get("shop_metadata");
    const acceptsReservations = formData.get("acceptsReservations");
    
    // Profile picture for all users
    const profilePictureFile = formData.get("profilePicture");
    
    console.log("Shop phone received:", shopPhone, "Type:", typeof shopPhone);

    // Build user update data (common for all users)
    const userUpdate = {};
    if (firstName) userUpdate.firstName = firstName;
    if (lastName) userUpdate.lastName = lastName;
    if (phone !== null && phone !== undefined) {
      userUpdate.phone = phone.trim() === "" ? null : phone;
    }
    if (preferredLocale) userUpdate.preferredLocale = preferredLocale;
    if (address1 !== null && address1 !== undefined) userUpdate.address1 = address1;
    if (address2 !== null && address2 !== undefined) userUpdate.address2 = address2;
    if (city !== null && city !== undefined) userUpdate.city = city;
    if (postCode !== null && postCode !== undefined) userUpdate.postCode = postCode;
    if (latStr && lngStr) {
      userUpdate.latitude = parseFloat(latStr);
      userUpdate.longitude = parseFloat(lngStr);
    }
    if (isFirstTime !== null && isFirstTime !== undefined) {
      userUpdate.isFirstTime = isFirstTime === 'true';
    }

    // Handle profile picture upload for all users
    if (profilePictureFile && profilePictureFile.size > 0) {
      const profilePictureUrl = await uploadFileToS3(profilePictureFile);
      userUpdate.profilePicture = profilePictureUrl;
    }

    // Handle shop owner - update user and shop
    // Now supports all shop types: shop, restaurant, mot, shisha, spa, beauty
    if (userRole === "shop-owner" || userRole === "restaurant") {
      // Find existing shop - don't filter by type to support all service types
      const existingShop = await prisma.shops.findFirst({
        where: { 
          createdById: parseInt(userId, 10)
          // Removed type filter to support all types
        },
        select: { id: true, type: true },
      });

      // Handle image upload
      let imageFileName = undefined;
      if (imageFile && imageFile.size > 0) {
        imageFileName = await uploadFileToS3(imageFile);
      }

      // Build shop update data (only extra fields)
      const shopUpdate = {};
      if (shopName !== null && shopName !== undefined) shopUpdate.name = shopName;
      if (shopPhone !== null && shopPhone !== undefined) {
        shopUpdate.phone = shopPhone.trim() === "" ? null : shopPhone;
        console.log("Shop phone update:", shopUpdate.phone);
      }
      if (shopCategory !== null && shopCategory !== undefined) {
        shopUpdate.category = shopCategory.trim() === "" ? null : shopCategory;
        console.log("Shop category update:", shopUpdate.category);
      }
      if (imageFileName !== undefined) shopUpdate.image = imageFileName;
      if (shopMetadataStr !== null && shopMetadataStr !== undefined) {
        try {
          const parsedMetadata = JSON.parse(shopMetadataStr);
          shopUpdate.shop_metadata = parsedMetadata;
        } catch (e) {
          console.error("Error parsing shop_metadata:", e);
        }
      }
      
      // Restaurant-specific fields
      if (userRole === "restaurant") {
        if (acceptsReservations !== null && acceptsReservations !== undefined) {
          shopUpdate.acceptsReservations = acceptsReservations === 'true' || acceptsReservations === true;
        }
      }
      
      // Sync address to shop
      if (address1 !== null && address1 !== undefined) shopUpdate.address1 = address1;
      if (address2 !== null && address2 !== undefined) shopUpdate.address2 = address2;
      if (city !== null && city !== undefined) shopUpdate.city = city;
      if (postCode !== null && postCode !== undefined) shopUpdate.postCode = postCode;
      if (latStr && lngStr) {
        shopUpdate.latitude = parseFloat(latStr);
        shopUpdate.longitude = parseFloat(lngStr);
      }

      console.log("Final shopUpdate object:", shopUpdate);
      
      // Update in a transaction to keep user/shop consistent
      const result = await prisma.$transaction(async (tx) => {
        const updatedUser = await tx.users.update({
          where: { id: parseInt(userId, 10) },
          data: userUpdate,
        });

        let updatedShop = null;
        if (existingShop) {
          updatedShop = await tx.shops.update({
            where: { id: existingShop.id },
            data: shopUpdate,
          });
        }

        return { updatedUser, updatedShop };
      });

      return NextResponse.json({
        message: "Profile updated successfully",
        profile: {
          ...result.updatedUser,
          phone: result.updatedUser.phone || null,
          profilePictureUrl: getFileUrl(result.updatedUser.profilePicture)
        },
        shop: result.updatedShop ? {
          ...result.updatedShop,
          imageUrl: getFileUrl(result.updatedShop.image)
        } : null
      }, { status: 200 });
    }
    
    const updatedProfile = await prisma.users.update({
      where: { id: parseInt(userId, 10) },
      data: userUpdate,
    });

    return NextResponse.json({
      message: "Profile updated successfully",
      profile: {
        ...updatedProfile,
        phone: updatedProfile.phone || null,
        profilePictureUrl: getFileUrl(updatedProfile.profilePicture)
      },
    }, { status: 200 });
  } catch (err) {
    console.error("Error updating profile:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
};




