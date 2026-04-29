import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendEmail } from "@/lib/sendEmail";
import { getUserFullName } from "@/utils/helper";

export async function DELETE(req) {
    try {
        const userId = req.headers.get("user-id");
        // Check if user exists
        const user = await prisma.users.findUnique({
            where: { id: parseInt(userId) }
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Check if user is already deleted
        if (user.deletedAt) {
            return NextResponse.json({ error: "Account already deleted" }, { status: 400 });
        }

        // Send email notification to all admin users BEFORE deletion (non-blocking)
        const requestDate = new Date();
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
                const userName = getUserFullName(user.firstName, user.lastName);
                
                // Send email to each admin user
                const emailPromises = adminUsers.map(async (admin) => {
                    try {
                        await sendEmail({
                            type: "accountDeletionNotification",
                            email: admin.email,
                            subject: `Account Deletion Request - ${userName}`,
                            userName: userName,
                            userEmail: user.email,
                            userRole: user.role,
                            requestDate: requestDate
                        });
                        console.log(`Account deletion request notification sent to admin: ${admin.email}`);
                    } catch (emailError) {
                        console.error(`Failed to send email to admin ${admin.email}:`, emailError);
                    }
                });

                // Don't wait for emails to complete, but log if any fail
                Promise.all(emailPromises).catch(err => {
                    console.error("Error sending account deletion request notifications:", err);
                });
            }
        } catch (emailError) {
            // Log error but don't fail the deletion
            console.error("Error sending account deletion request notification to admins:", emailError);
        }

        // Soft delete the user by setting deletedAt timestamp
        await prisma.users.update({
            where: { id: parseInt(userId) },
            data: {
                deletedAt: requestDate
            }
        });

        return NextResponse.json({
            message: "Account deleted successfully"
        }, { status: 200 });
    } catch (err) {
        console.error("Delete account error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

