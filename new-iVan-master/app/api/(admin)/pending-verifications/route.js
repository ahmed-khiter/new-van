import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';
const BASE_URL = process.env.NEXT_PUBLIC_AWS_BASE_URL || "";

export const GET = async (request) => {
    try {
        const userId = request.headers.get("user-id");
        const userRole = request.headers.get("role");

        if (!userId || !userRole) {
            return NextResponse.json(
                { error: "User not authenticated" },
                { status: 401 }
            );
        }

        if (userRole !== "admin" && userRole !== "team-member") {
            return NextResponse.json(
                { error: "Access denied. Admins and team members only." },
                { status: 403 }
            );
        }


        const pendingVerifications = await prisma.documents.findMany({
            where: {
                status: "Waiting For Approval",
            },
            include: {
                job: true
            },
            orderBy: {
                createdAt: "desc",
            },
        });


        const userIds = [...new Set(pendingVerifications.map((doc) => doc.userId))];


        const users = await prisma.users.findMany({
            where: { id: { in: userIds } },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
            }
        });

        const usersMap = users.reduce((acc, user) => {
            acc[user.id] = user;
            return acc;
        }, {});


        const enrichedDocs = pendingVerifications.map((doc) => ({
            ...doc,
            fileUrl: `${BASE_URL}${doc.fileName}`,
            user: usersMap[doc.userId] || null,
        }));

        return NextResponse.json({ pendingVerifications: enrichedDocs }, { status: 200 });
    } catch (err) {
        console.error("Error fetching requirements:", err);
        return NextResponse.json(
            { error: "Server error while fetching requirements" },
            { status: 500 }
        );
    }
};
