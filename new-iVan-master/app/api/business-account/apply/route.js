import { NextResponse } from "next/server";
import  prisma  from "@/lib/prisma";
import { sendEmail } from "@/lib/sendEmail";

export async function POST(req) {
  try {
    const { firstName, lastName, companyNumber, companyName, email, contactNumber, limitRequest, customLimit } = await req.json();

    // Validate required fields
    if (!firstName || !lastName || !companyNumber || !companyName || !email || !contactNumber || !limitRequest) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Validate custom limit if custom is selected
    if (limitRequest === "custom") {
      if (!customLimit) {
        return NextResponse.json(
          { error: "Custom limit is required" },
          { status: 400 }
        );
      }
      const customLimitValue = parseFloat(customLimit);
      if (isNaN(customLimitValue) || customLimitValue <= 0) {
        return NextResponse.json(
          { error: "Please enter a valid custom limit amount" },
          { status: 400 }
        );
      }
      if (customLimitValue > 25000) {
        return NextResponse.json(
          { error: "Custom limit cannot exceed £25,000" },
          { status: 400 }
        );
      }
    }

    // TODO: Store the application in database
    // For now, we'll just return success
    // You can create a BusinessAccountApplication model in Prisma schema if needed
    
    // Example: Store in database (uncomment when schema is ready)
    /*
    const application = await prisma.businessAccountApplication.create({
      data: {
        firstName,
        lastName,
        companyNumber,
        companyName,
        email,
        contactNumber,
        limitRequest,
        customLimit: limitRequest === "custom" ? customLimit : null,
        status: 'pending',
        createdAt: new Date(),
      },
    });
    */

    // Log the application for now
    console.log("Business Account Application:", {
      firstName,
      lastName,
      companyNumber,
      companyName,
      email,
      contactNumber,
      limitRequest,
      customLimit,
      submittedAt: new Date().toISOString(),
    });

    // Send email to all admin users
    try {
      const adminUsers = await prisma.users.findMany({
        where: {
          role: "admin",
          deletedAt: null,
          isActive: true
        },
        select: {
          email: true,
          firstName: true,
          lastName: true
        }
      });

      if (adminUsers && adminUsers.length > 0) {
        // Send email to each admin user
        const emailPromises = adminUsers.map(async (admin) => {
          try {
            await sendEmail({
              type: "businessAccountApplication",
              email: admin.email,
              subject: `New Business Account Application - ${companyName}`,
              firstName,
              lastName,
              companyName,
              companyNumber,
              email,
              contactNumber,
              limitRequest,
              customLimit: limitRequest === "custom" ? customLimit : null,
              submittedAt: new Date().toISOString()
            });
            console.log(`Business account application notification sent to admin: ${admin.email}`);
          } catch (emailError) {
            console.error(`Failed to send email to admin ${admin.email}:`, emailError);
          }
        });

        // Don't wait for emails to complete, but log if any fail
        Promise.all(emailPromises).catch(err => {
          console.error("Error sending business account application notifications:", err);
        });
      }
    } catch (emailError) {
      // Log error but don't fail the application submission
      console.error("Error sending business account application notification to admins:", emailError);
    }

    return NextResponse.json({
      success: true,
      message: "Application submitted successfully",
    });
  } catch (error) {
    console.error("Error submitting business account application:", error);
    return NextResponse.json(
      { error: error.message || "Failed to submit application" },
      { status: 500 }
    );
  }
}

