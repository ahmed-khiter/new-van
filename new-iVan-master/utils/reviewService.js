import prisma from "@/lib/prisma";

const REVIEW_SUBMITTED_STATUS = "submitted";

const parseReservationDateTime = (reservationDate, reservationTime) => {
  if (!reservationDate) return null;

  const [hours = "0", minutes = "0"] = String(reservationTime || "00:00")
    .split(":")
    .slice(0, 2);

  const date = new Date(reservationDate);
  if (Number.isNaN(date.getTime())) return null;

  date.setHours(Number(hours), Number(minutes), 0, 0);
  return date;
};

const isReservationFinished = (reservation) => {
  if (!reservation) return false;
  if (reservation.status === "completed") return true;
  if (reservation.status !== "accepted") return false;

  const scheduledAt = parseReservationDateTime(
    reservation.reservationDate,
    reservation.reservationTime,
  );

  if (!scheduledAt) return false;
  return scheduledAt <= new Date();
};

export async function ensurePendingFeedbacksForUser(userId) {
  const parsedUserId = Number(userId);
  if (!parsedUserId) return { createdOrders: 0, createdReservations: 0 };

  const existingFeedbackLinks = await prisma.feedbacks.findMany({
    where: {
      userId: parsedUserId,
      OR: [{ orderId: { not: null } }, { bookingId: { not: null } }],
    },
    select: {
      orderId: true,
      bookingId: true,
    },
  });

  const existingOrderIds = new Set(
    existingFeedbackLinks.map((item) => item.orderId).filter(Boolean),
  );
  const existingBookingIds = new Set(
    existingFeedbackLinks.map((item) => item.bookingId).filter(Boolean),
  );

  const eligibleOrders = await prisma.product_orders.findMany({
    where: {
      userId: parsedUserId,
      shopId: { not: null },
      OR: [{ deliveryStatus: "delivered" }, { status: "completed" }],
    },
    select: {
      id: true,
      shopId: true,
    },
  });

  const orderFeedbackRows = eligibleOrders
    .filter((order) => !existingOrderIds.has(order.id))
    .map((order) => ({
      userId: parsedUserId,
      itemType: "order",
      itemId: order.id,
      orderId: order.id,
      businessId: order.shopId,
      status: "pending",
    }));

  if (orderFeedbackRows.length > 0) {
    await prisma.feedbacks.createMany({
      data: orderFeedbackRows,
    });
  }

  const eligibleReservations = await prisma.reservations.findMany({
    where: {
      customerId: parsedUserId,
      restaurantId: { not: null },
      status: { in: ["accepted", "completed"] },
    },
    select: {
      id: true,
      status: true,
      reservationDate: true,
      reservationTime: true,
      restaurantId: true,
    },
  });

  const reservationFeedbackRows = eligibleReservations
    .filter((reservation) => isReservationFinished(reservation))
    .filter((reservation) => !existingBookingIds.has(reservation.id))
    .map((reservation) => ({
      userId: parsedUserId,
      itemType: "reservation",
      itemId: reservation.id,
      bookingId: reservation.id,
      businessId: reservation.restaurantId,
      status: "pending",
    }));

  if (reservationFeedbackRows.length > 0) {
    await prisma.feedbacks.createMany({
      data: reservationFeedbackRows,
    });
  }

  return {
    createdOrders: orderFeedbackRows.length,
    createdReservations: reservationFeedbackRows.length,
  };
}

export async function getBusinessRatingSummaries(businessIds = []) {
  const uniqueBusinessIds = [...new Set((businessIds || []).filter(Boolean))];
  if (uniqueBusinessIds.length === 0) return {};

  const grouped = await prisma.feedbacks.groupBy({
    by: ["businessId"],
    where: {
      businessId: { in: uniqueBusinessIds },
      status: REVIEW_SUBMITTED_STATUS,
      rating: { not: null },
    },
    _avg: {
      rating: true,
    },
    _count: {
      id: true,
    },
  });

  return grouped.reduce((acc, row) => {
    acc[row.businessId] = {
      averageRating: Number((row._avg.rating || 0).toFixed(1)),
      reviewCount: row._count.id || 0,
    };
    return acc;
  }, {});
}

export async function getBusinessReviews(businessId, options = {}) {
  const page = Number(options.page || 1);
  const limit = Number(options.limit || 10);
  const safePage = page > 0 ? page : 1;
  const safeLimit = limit > 0 ? limit : 10;
  const skip = (safePage - 1) * safeLimit;

  const whereClause = {
    businessId,
    status: REVIEW_SUBMITTED_STATUS,
    rating: { not: null },
  };

  const [reviews, totalCount] = await Promise.all([
    prisma.feedbacks.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePicture: true,
          },
        },
      },
      orderBy: [{ feedbackAt: "desc" }, { createdAt: "desc" }],
      skip,
      take: safeLimit,
    }),
    prisma.feedbacks.count({ where: whereClause }),
  ]);

  return {
    reviews,
    totalCount,
    page: safePage,
    totalPages: Math.ceil(totalCount / safeLimit) || 1,
  };
}
