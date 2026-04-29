import { sendEmail } from "@/lib/sendEmail";
import prisma from "@/lib/prisma";

/**
 * Send shop order payment email to customer
 * @param {string} orderId - The order ID
 * @param {number} customerId - The customer who placed the order
 * @param {number} paymentAmount - The amount paid
 * @param {string} transactionId - The payment transaction ID
 * @returns {Promise<Object>} - Email sending result
 */
export const sendShopOrderPaymentEmail = async (orderId, customerId, paymentAmount, transactionId) => {
  try {
    // Get order details with cart items
    const order = await prisma.product_orders.findUnique({
      where: { id: orderId },
      include: {
        cart: {
          include: {
            cartItems: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    price: true,
                    image: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!order) {
      throw new Error(`Order with ID ${orderId} not found`);
    }

    // Get customer details
    const customer = await prisma.users.findUnique({
      where: { id: customerId },
      select: {
        firstName: true,
        lastName: true,
        email: true
      }
    });

    if (!customer) {
      throw new Error(`Customer with ID ${customerId} not found`);
    }

    // Prepare order items for email
    const orderItems = order.cart?.cartItems?.map(item => ({
      name: item.product.name,
      price: parseFloat(item.product.price),
      quantity: item.quantity,
      image: item.product.image
    })) || [];

    // Prepare email data
    const emailData = {
      type: "shopOrderPayment",
      email: customer.email,
      subject: `Order Confirmed: #${orderId}`,
      customerName: `${customer.firstName}${customer.lastName ? ` ${customer.lastName}` : ''}`,
      order: {
        id: order.id,
        totalCartPrice: order.totalCartPrice,
        deliveryPrice: order.deliveryPrice,
        deliveryAddress: order.deliveryAddress,
        deliveryCity: order.deliveryCity,
        deliveryPostCode: order.deliveryPostCode,
        createdAt: order.createdAt
      },
      paymentAmount: paymentAmount,
      transactionId: transactionId,
      orderItems: orderItems
    };

    // Send the email
    const result = await sendEmail(emailData);
    
    console.log(`Shop order payment email sent successfully to ${customer.email} for order ${orderId}`);
    return {
      success: true,
      message: "Shop order payment email sent successfully",
      emailInfo: result
    };

  } catch (error) {
    console.error(`Failed to send shop order payment email for order ${orderId}:`, error);
    return {
      success: false,
      message: `Failed to send shop order payment email: ${error.message}`,
      error: error
    };
  }
};

/**
 * Handle shop order payment email sending (non-blocking)
 * This function is called from the Stripe webhook when order payment is completed
 * @param {string} orderId - The order ID
 * @param {number} customerId - The customer who placed the order
 * @param {number} paymentAmount - The amount paid
 * @param {string} transactionId - The payment transaction ID
 * @returns {Promise<void>}
 */
export const handleShopOrderPaymentEmailSending = async (orderId, customerId, paymentAmount, transactionId) => {
  try {
    console.log(`Starting shop order payment email process for order ${orderId}, customer ${customerId}, amount ${paymentAmount}`);
    
    // Check if required environment variables are set
    if (!process.env.MAILTRAP_HOST || !process.env.MAILTRAP_PORT || !process.env.MAILTRAP_USER || !process.env.MAILTRAP_PASS) {
      console.error("Missing email configuration environment variables");
      return;
    }
    
    if (!process.env.NEXT_PUBLIC_FROM_EMAIL) {
      console.error("Missing NEXT_PUBLIC_FROM_EMAIL environment variable");
      return;
    }
    
    await sendShopOrderPaymentEmail(orderId, customerId, paymentAmount, transactionId);
    console.log(`Shop order payment email handled successfully for order ${orderId}`);
  } catch (error) {
    console.error(`Failed to handle shop order payment email for order ${orderId}:`, error);
    // Don't throw error - email sending failure shouldn't fail payment processing
  }
};

/**
 * Send shop order confirmation required email to shop owner
 * @param {string} orderId - The order ID
 * @returns {Promise<Object>} - Email sending result
 */
export const sendShopOrderConfirmationRequiredEmail = async (orderId) => {
  try {
    // Get order details with cart items and shop owner info
    const order = await prisma.product_orders.findUnique({
      where: { id: orderId },
      include: {
        cart: {
          include: {
            cartItems: {
              include: {
                product: {
                  include: {
                    createdBy: {
                      select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true
                      }
                    }
                  }
                }
              }
            }
          }
        },
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    if (!order) {
      throw new Error(`Order with ID ${orderId} not found`);
    }

    // Get shop owner from the first product
    const firstProduct = order.cart?.cartItems?.[0]?.product;
    const shopOwner = firstProduct?.createdBy;

    if (!shopOwner || !shopOwner.email) {
      console.log(`No shop owner found for order ${orderId}`);
      return {
        success: false,
        message: "Shop owner not found for this order"
      };
    }

    // Prepare order items for email
    const orderItems = order.cart?.cartItems?.map(item => ({
      name: item.product.name,
      price: parseFloat(item.product.price),
      quantity: item.quantity
    })) || [];

    // Prepare email data
    const emailData = {
      type: "shopOrderConfirmationRequired",
      email: shopOwner.email,
      subject: `New Order Requires Confirmation - Order #${orderId.substring(0, 8)}`,
      shopOwnerName: `${shopOwner.firstName}${shopOwner.lastName ? ` ${shopOwner.lastName}` : ''}`,
      order: {
        id: order.id,
        totalCartPrice: order.totalCartPrice,
        deliveryPrice: order.deliveryPrice,
        deliveryAddress: order.deliveryAddress,
        deliveryCity: order.deliveryCity,
        createdAt: order.createdAt
      },
      customerName: `${order.user?.firstName}${order.user?.lastName ? ` ${order.user.lastName}` : ''}`,
      orderItems: orderItems,
      orderUrl: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/shop-orders`
    };

    // Send the email
    const result = await sendEmail(emailData);
    
    console.log(`Shop order confirmation required email sent successfully to ${shopOwner.email} for order ${orderId}`);
    return {
      success: true,
      message: "Shop order confirmation required email sent successfully",
      emailInfo: result
    };

  } catch (error) {
    console.error(`Failed to send shop order confirmation required email for order ${orderId}:`, error);
    return {
      success: false,
      message: `Failed to send shop order confirmation required email: ${error.message}`,
      error: error
    };
  }
};

/**
 * Handle shop order confirmation required email sending (non-blocking)
 * @param {string} orderId - The order ID
 * @returns {Promise<void>}
 */
export const handleShopOrderConfirmationRequiredEmailSending = async (orderId) => {
  try {
    console.log(`Starting shop order confirmation required email process for order ${orderId}`);
    
    // Check if required environment variables are set
    if (!process.env.MAILTRAP_HOST || !process.env.MAILTRAP_PORT || !process.env.MAILTRAP_USER || !process.env.MAILTRAP_PASS) {
      console.error("Missing email configuration environment variables");
      return;
    }
    
    if (!process.env.NEXT_PUBLIC_FROM_EMAIL) {
      console.error("Missing NEXT_PUBLIC_FROM_EMAIL environment variable");
      return;
    }
    
    await sendShopOrderConfirmationRequiredEmail(orderId);
    console.log(`Shop order confirmation required email handled successfully for order ${orderId}`);
  } catch (error) {
    console.error(`Failed to handle shop order confirmation required email for order ${orderId}:`, error);
    // Don't throw error - email sending failure shouldn't fail payment processing
  }
};