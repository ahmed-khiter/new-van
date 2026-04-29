import prisma from "@/lib/prisma";
import { sendEmail } from "@/lib/sendEmail";
import { getUserFullName, defaultOpeningHours } from "@/utils/helper";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const createdById = parseInt(req.headers.get("user-id"));
    const { firstName, lastName, email, role, shopName, country } = await req.json();

    const inviter = await prisma.users.findUnique({
      where: { id: createdById },
      select: { role: true, firstName: true, lastName: true }
    });

    if (!inviter) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    const isAdminInviter = inviter.role === "admin";
    const isAffiliateInviter = inviter.role === "affiliate";
    if (!isAdminInviter && !isAffiliateInviter) {
      return NextResponse.json(
        { error: "Unauthorized. Only admin or affiliate can invite users." },
        { status: 403 }
      );
    }

    // Validate required fields
    if (!firstName || !email || !role) {
      return NextResponse.json(
        { error: "First name, email, and role are required" },
        { status: 400 }
      );
    }

    // Admin can invite affiliates. Affiliates can invite business owners.
    const allowedRoles = isAdminInviter ? ["affiliate"] : ["restaurant", "shop-owner"];
    if (!allowedRoles.includes(role)) {
      return NextResponse.json(
        { error: `Invalid role. Only ${allowedRoles.join(", ")} can be invited.` },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.users.findUnique({
      where: {
        email,
        deletedAt: null
      }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }

    // Create setup password token (for invited users)
    const setupToken = jwt.sign(
      { email, userId: null, invitedBy: createdById },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Create user with invited status (isActive: true, but needs password setup)
    const newUser = await prisma.users.create({
      data: {
        firstName,
        lastName: lastName || null,
        email,
        role,
        resetToken: setupToken, // Store setup token in resetToken field
        isActive: true, // User is active but needs to set password
        isFirstTime: true,
        status: "active",
        createdById: createdById,
        country: country || null,
      }
    });

    // Update token with userId now that we have it
    const updatedSetupToken = jwt.sign(
      { email, userId: newUser.id, invitedBy: createdById },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
    
    await prisma.users.update({
      where: { id: newUser.id },
      data: { resetToken: updatedSetupToken }
    });

    // If shop-owner or restaurant, create shop
    if ((role === "shop-owner" || role === "restaurant") && shopName) {
      await prisma.shops.create({
        data: {
          name: shopName,
          type: role === "shop-owner" ? "shop" : "restaurant",
          createdById: newUser.id,
          affiliateId: isAffiliateInviter ? createdById : null,
          country: country || null,
          shop_metadata: {
            openingHours: defaultOpeningHours,
            halal: false,
          },
        }
      });
    }

    // Create 2-month free trial subscription for business accounts (provider, shop-owner, restaurant)
    const businessRoles = ["shop-owner", "restaurant"];
    if (businessRoles.includes(role)) {
      try {
        // Map country to plan_region using location options
       

        // Find the free trial plan (plan_id = 1, which is typically the free plan)
        const freePlan = await prisma.plans.findFirst({
          where: {
            name: "Free",
          }
        });

        if (freePlan) {
          const startDate = new Date();
          const endDate = new Date(startDate);
          endDate.setMonth(endDate.getMonth() + 2); // 2 months free trial

          await prisma.subscriptions.create({
            data: {
              user_id: newUser.id,
              plan_id: freePlan.plan_id,
              start_date: startDate,
              end_date: endDate,
              amount_charged: 0.0,
              type: "free_trial",
              status: "active",
            },
          });

          // Sync user usage for the free plan
          const { syncTheUserUsage } = await import("@/utils/subscriptionService");
          await syncTheUserUsage({ userId: newUser.id, planId: freePlan.plan_id });
        }
      } catch (subscriptionError) {
        // Log error but don't fail invitation if subscription creation fails
        console.error("Error creating free trial subscription:", subscriptionError);
      }
    }

    // Create setup password link
    const setupLink = `${process.env.NEXTAUTH_URL}/reset-password?token=${updatedSetupToken}&setup=true`;

    // Send invitation email
    const inviterName = getUserFullName(inviter.firstName, inviter.lastName);
    await sendEmail({
      type: "invitation",
      name: getUserFullName(firstName, lastName),
      email: email,
      invitationLink: setupLink, // Use setup password link
      role: role,
      inviterName: inviterName,
      subject: `You've been invited to join Swipped as a ${role === "affiliate" ? "Affiliate" : role === "restaurant" ? "Restaurant Owner" : "Shop Owner"}!`
    });

    return NextResponse.json({
      success: true,
      message: "User invited successfully. Invitation email sent.",
      user: {
        id: newUser.id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        role: newUser.role,
        status: newUser.status,
        createdAt: newUser.createdAt
      }
    });
  } catch (error) {
    console.error("Error inviting user:", error);
    return NextResponse.json(
      { error: error.message || "Failed to invite user" },
      { status: 500 }
    );
  }
}

