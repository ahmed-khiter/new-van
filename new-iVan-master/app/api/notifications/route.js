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
      return NextResponse.json({ notifications: [] }, { status: 200 });
    }
    
    // Fetch only unread notifications from database
    const notifications = await prisma.notifications.findMany({
      where: {
        userId: userId,
        status: "unread" // Only return unread notifications
      },
      orderBy: {
        createdAt: "desc"
      },
      take: 50 // Get last 50 notifications
    });

    // Format notifications for frontend
    const formattedNotifications = notifications.map(notification => {
      // Parse metadata if it's a string, otherwise use as is
      let metadata = {};
      if (notification.metadata) {
        try {
          metadata = typeof notification.metadata === 'string' 
            ? JSON.parse(notification.metadata) 
            : notification.metadata;
        } catch (e) {
          console.error('Error parsing notification metadata:', e);
          metadata = {};
        }
      }
      
      return {
        id: notification.id,
        type: notification.type,
        title: notification.title,
        status: notification.status,
        createdAt: notification.createdAt,
        readAt: notification.readAt,
        ...metadata // Spread metadata for easy access (chatId, documentId, jobId, etc.)
      };
    });

    return NextResponse.json({ notifications: formattedNotifications }, { status: 200 });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ notifications: [] }, { status: 200 });
  }
}

// Mark notification as read
export async function PATCH(request) {
  try {
    const { notificationId } = await request.json();
    
    if (!notificationId) {
      return NextResponse.json({ error: "Notification ID is required" }, { status: 400 });
    }

    // Get userId from headers
    const headerUserId = request.headers.get("user-id");
    if (!headerUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = parseInt(headerUserId, 10);

    // Update notification status
    const updatedNotification = await prisma.notifications.update({
      where: {
        id: notificationId,
        userId: userId // Ensure user can only mark their own notifications as read
      },
      data: {
        status: "read",
        readAt: new Date()
      }
    });

    return NextResponse.json({ notification: updatedNotification }, { status: 200 });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return NextResponse.json({ error: "Failed to update notification" }, { status: 500 });
  }
}

