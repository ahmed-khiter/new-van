import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createJobPaymentSession } from "@/utils/paymentService";
import { getFileUrl } from "@/utils/helper";

export const POST = async (req) => {
  try {
    const { jobId } = await req.json();
    const userId = req.headers.get("user-id");
    const userRole = req.headers.get("role");

    if (!jobId) {
      return NextResponse.json({ error: "Job ID is required" }, { status: 400 });
    }
    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 401 });
    }
    if (userRole !== "visitor") {
      return NextResponse.json(
        { error: "Only visitors can create job payment sessions" },
        { status: 403 }
      );
    }

    const job = await prisma.jobs.findUnique({
      where: { id: jobId },
      select: { id: true, title: true, price: true, status: true, createdById: true },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }
    if (job.createdById !== parseInt(userId, 10)) {
      return NextResponse.json({ error: "Unauthorized access to job" }, { status: 403 });
    }
    if (job.status !== "draft") {
      return NextResponse.json({ error: "Job is not in draft status" }, { status: 400 });
    }
    if (!job.price || job.price <= 0) {
      return NextResponse.json({ error: "Job does not have a valid price" }, { status: 400 });
    }

    // Default payment data
    let totalAmount = parseFloat(job.price);
    let paymentDescription = `Job Payment: ${job.title}`;
    let additionalMetadata = {};
    let orderItems = [];

    const existingOrder = await prisma.product_orders.findFirst({
      where: { jobId: jobId, status: "pending" },
      include: {
        cart: {
          include: {
            cartItems: {
              include: { product: { select: { name: true, price: true, image: true } } },
            },
          },
        },
      },
    });

    if (existingOrder) {
      const totalCartPrice = parseFloat(existingOrder.totalCartPrice);
      const deliveryPrice = parseFloat(existingOrder.deliveryPrice);
      const totalPrice = totalCartPrice + deliveryPrice;

      orderItems = (existingOrder.cart?.cartItems || []).map((item) => ({
        name: item.product.name,
        price: item.product.price,
        quantity: item.quantity,
        image: item.product.image  ? getFileUrl(item.product.image) : null,
      }));

      additionalMetadata = {
        orderId: existingOrder.id,
        jobPrice: parseFloat(job.price),
        cartPrice: totalCartPrice,
        totalPrice,
        itemCount: orderItems.length,
        deliveryPrice,
      };

      paymentDescription = `Order Payment for ${orderItems.length} items`;
      totalAmount = totalPrice;
    }

    const paymentUrl = await createJobPaymentSession(
      job.id,
      totalAmount,
      paymentDescription,
      userId,
      additionalMetadata,
      orderItems 
    );

    return NextResponse.json(
      { paymentUrl, jobId: job.id, amount: totalAmount, hasExistingOrder: !!existingOrder },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error creating job payment session:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create payment session" },
      { status: 500 }
    );
  }
};
