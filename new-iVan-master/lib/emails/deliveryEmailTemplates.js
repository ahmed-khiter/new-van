/**
 * Delivery Email Templates
 * Templates for delivery-related email notifications
 */

/**
 * Shop Order Confirmation Required Email
 * Sent to shop owner when a new order requires confirmation
 */
export const getShopOrderConfirmationRequiredEmail = (emailData) => {
  const { shopOwnerName, order, customerName, orderItems, orderUrl } = emailData;
  const orderId = order?.id || 'N/A';
  const orderDate = order?.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A';

  return `
    <div style="padding: 20px; font-family: Arial, sans-serif;">
      <h2 style="color: #333;">New Order Requires Your Confirmation</h2>
      
      <p>Dear ${shopOwnerName},</p>
      
      <p>A new order has been placed and requires your confirmation before delivery providers can be notified.</p>
      
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Order Details</h3>
        <p><strong>Order ID:</strong> #${orderId.substring(0, 8)}</p>
        <p><strong>Customer:</strong> ${customerName}</p>
        <p><strong>Order Date:</strong> ${orderDate}</p>
        <p><strong>Total Amount:</strong> $${order?.totalCartPrice || 0}</p>
        <p><strong>Delivery Fee:</strong> $${order?.deliveryPrice || 0}</p>
        <p><strong>Delivery Address:</strong> ${order?.deliveryAddress || 'N/A'}, ${order?.deliveryCity || 'N/A'}</p>
      </div>

      ${orderItems && orderItems.length > 0 ? `
        <div style="margin: 20px 0;">
          <h3>Order Items:</h3>
          <ul>
            ${orderItems.map(item => `
              <li>${item.name} - Qty: ${item.quantity} - $${item.price}</li>
            `).join('')}
          </ul>
        </div>
      ` : ''}

      <div style="margin: 30px 0;">
        <a href="${orderUrl || '#'}" 
           style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
          Confirm Order Now
        </a>
      </div>

      <p style="color: #666; font-size: 14px;">
        Please confirm this order as soon as possible so delivery providers can be notified and the customer can receive their order promptly.
      </p>
    </div>
  `;
};

/**
 * Delivery In Transit Email
 * Sent to customer when their order is out for delivery
 */
export const getDeliveryInTransitEmail = (emailData) => {
  const { customerName, orderId, deliveryAddress } = emailData;

  return `
    <div style="padding: 20px; font-family: Arial, sans-serif;">
      <h2 style="color: #28a745;">Your Order is Out for Delivery! 🚚</h2>
      
      <p>Dear ${customerName},</p>
      
      <p>Great news! Your order #${orderId.substring(0, 8)} has been picked up and is now on its way to you.</p>
      
      <div style="background-color: #d4edda; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #28a745;">
        <p><strong>Delivery Address:</strong></p>
        <p>${deliveryAddress || 'N/A'}</p>
      </div>

      <p>You can track your delivery in real-time through your account dashboard.</p>

      <p style="color: #666; font-size: 14px;">
        Please ensure someone is available to receive the delivery at the address above.
      </p>
    </div>
  `;
};

/**
 * Delivery Completed Email
 * Sent to customer when their order has been delivered
 */
export const getDeliveryCompletedEmail = (emailData) => {
  const { customerName, orderId, deliveryAddress, deliveredAt } = emailData;
  const deliveryDate = deliveredAt ? new Date(deliveredAt).toLocaleString() : 'N/A';

  return `
    <div style="padding: 20px; font-family: Arial, sans-serif;">
      <h2 style="color: #28a745;">Your Order Has Been Delivered! ✅</h2>
      
      <p>Dear ${customerName},</p>
      
      <p>Your order #${orderId.substring(0, 8)} has been successfully delivered!</p>
      
      <div style="background-color: #d4edda; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #28a745;">
        <p><strong>Delivered To:</strong></p>
        <p>${deliveryAddress || 'N/A'}</p>
        <p><strong>Delivery Time:</strong> ${deliveryDate}</p>
      </div>

      <p>We hope you're satisfied with your order. If you have any questions or concerns, please don't hesitate to contact us.</p>

      <p style="color: #666; font-size: 14px; margin-top: 30px;">
        Thank you for choosing us!
      </p>
    </div>
  `;
};

/**
 * Delivery Completed to Shop Owner Email
 * Sent to shop owner when an order has been delivered
 */
export const getDeliveryCompletedToShopEmail = (emailData) => {
  const { shopOwnerName, orderId, customerName } = emailData;

  return `
    <div style="padding: 20px; font-family: Arial, sans-serif;">
      <h2 style="color: #28a745;">Order Delivered Successfully</h2>
      
      <p>Dear ${shopOwnerName},</p>
      
      <p>Order #${orderId.substring(0, 8)} has been successfully delivered to the customer.</p>
      
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p><strong>Order ID:</strong> #${orderId.substring(0, 8)}</p>
        <p><strong>Customer:</strong> ${customerName}</p>
        <p><strong>Delivery Status:</strong> Completed</p>
      </div>

      <p style="color: #666; font-size: 14px;">
        The delivery has been completed and the customer has been notified.
      </p>
    </div>
  `;
};

/**
 * Delivery Assigned Email
 * Sent to customer when a provider accepts their delivery
 */
export const getDeliveryAssignedEmail = (emailData) => {
  const { customerName, orderId, providerName, estimatedArrival } = emailData;

  return `
    <div style="padding: 20px; font-family: Arial, sans-serif;">
      <h2 style="color: #007bff;">Delivery Provider Assigned</h2>
      
      <p>Dear ${customerName},</p>
      
      <p>A delivery provider has been assigned to your order #${orderId.substring(0, 8)}.</p>
      
      <div style="background-color: #e7f3ff; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #007bff;">
        <p><strong>Provider:</strong> ${providerName || 'Assigned Provider'}</p>
        ${estimatedArrival ? `<p><strong>Estimated Arrival:</strong> ${estimatedArrival}</p>` : ''}
      </div>

      <p>Your order will be prepared and dispatched shortly. You'll receive another notification when it's out for delivery.</p>
    </div>
  `;
};

