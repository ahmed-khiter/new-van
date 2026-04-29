import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    // Get from headers (set by middleware) - primary method
    const headerUserId = request.headers.get("user-id");
    const headerRole = request.headers.get("role");

    let userId = null;
    let userRole = null;

    // Use headers first (set by middleware)
    if (headerUserId) {
      userId = parseInt(headerUserId, 10);
      userRole = headerRole;
    }

    if (!userId || isNaN(userId) || userId <= 0) {
      console.error('Invalid userId - no valid headers or session:', {
        headerUserId,
        parsed: userId
      });
      return NextResponse.json({ count: 0 }, { status: 200 });
    }
    
    // Count unread notifications from database
    const unreadCount = await prisma.notifications.count({
      where: {
        userId: userId,
        status: "unread"
      }
    });

    return NextResponse.json({ count: unreadCount }, { status: 200 });
  } catch (error) {
    console.error('Error fetching notification count:', error);
    return NextResponse.json({ count: 0 }, { status: 200 });
  }
}

