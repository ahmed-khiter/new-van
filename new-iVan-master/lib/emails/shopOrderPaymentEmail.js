export const getShopOrderPaymentEmail = (emailData) => {
  const { customerName, order, paymentAmount, transactionId, orderItems } = emailData;
  const { id, totalCartPrice, deliveryPrice, deliveryAddress, deliveryCity, deliveryPostCode, createdAt } = order;
  const orderUrl = `${process.env.NEXTAUTH_URL}/visitor-orders/${id}`;
  const totalPrice = parseFloat(totalCartPrice) + parseFloat(deliveryPrice);

  return `
        <p style="font-size:20px;color:#0e0e0e;">Thank you ${customerName}!</p>

        <p style="font-size:16px;color:#0e0e0e;padding-top:16px;">
            <strong>Great news! Your shop order has been successfully placed and payment has been processed.</strong>
        </p>

        <div style="background-color:#f8f9fa;padding:20px;border-radius:8px;margin:20px 0;border-left:4px solid #28a745;">
            <h3 style="margin:0 0 15px 0;color:#28a745;font-size:18px;">Order Details</h3>
            <p style="margin:5px 0;font-size:14px;color:#0e0e0e;"><strong>Order ID:</strong> #${id}</p>
            <p style="margin:5px 0;font-size:14px;color:#0e0e0e;"><strong>Order Date:</strong> ${new Date(createdAt).toLocaleDateString()}</p>
            <p style="margin:5px 0;font-size:14px;color:#0e0e0e;"><strong>Total Amount:</strong> £${totalPrice.toFixed(2)}</p>
        </div>

        ${orderItems && orderItems.length > 0 ? `
        <div style="background-color:#e3f2fd;padding:20px;border-radius:8px;margin:20px 0;border-left:4px solid #2196f3;">
            <h3 style="margin:0 0 15px 0;color:#2196f3;font-size:18px;">Items Ordered</h3>
            ${orderItems.map(item => `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid #e9ecef;">
                <div>
                    <p style="margin:0;font-size:14px;color:#0e0e0e;font-weight:bold;">${item.name}</p>
                    <p style="margin:0;font-size:12px;color:#6c757d;">Quantity: ${item.quantity}</p>
                </div>
                <div style="text-align:right;">
                    <p style="margin:0;font-size:14px;color:#0e0e0e;font-weight:bold;">£${(item.price * item.quantity).toFixed(2)}</p>
                </div>
            </div>
            `).join('')}
        </div>
        ` : ''}

        <div style="background-color:#d4edda;padding:20px;border-radius:8px;margin:20px 0;border-left:4px solid #28a745;">
            <h3 style="margin:0 0 15px 0;color:#28a745;font-size:18px;">Payment Confirmation</h3>
            <p style="margin:5px 0;font-size:14px;color:#0e0e0e;"><strong>Amount Paid:</strong> £${paymentAmount.toFixed(2)}</p>
            <p style="margin:5px 0;font-size:14px;color:#0e0e0e;"><strong>Transaction ID:</strong> ${transactionId}</p>
            <p style="margin:5px 0;font-size:14px;color:#0e0e0e;"><strong>Status:</strong> Payment Successful ✅</p>
        </div>

        ${deliveryAddress ? `
        <div style="background-color:#fff3cd;padding:20px;border-radius:8px;margin:20px 0;border-left:4px solid #ffc107;">
            <h3 style="margin:0 0 15px 0;color:#856404;font-size:18px;">Delivery Information</h3>
            <p style="margin:5px 0;font-size:14px;color:#0e0e0e;"><strong>Delivery Address:</strong> ${deliveryAddress}</p>
            ${deliveryCity ? `<p style="margin:5px 0;font-size:14px;color:#0e0e0e;"><strong>City:</strong> ${deliveryCity}</p>` : ''}
            ${deliveryPostCode ? `<p style="margin:5px 0;font-size:14px;color:#0e0e0e;"><strong>Post Code:</strong> ${deliveryPostCode}</p>` : ''}
            <p style="margin:5px 0;font-size:14px;color:#0e0e0e;"><strong>Delivery Fee:</strong> £${parseFloat(deliveryPrice).toFixed(2)}</p>
        </div>
        ` : ''}

        <div style="background-color:#d1ecf1;padding:20px;border-radius:8px;margin:20px 0;border-left:4px solid #17a2b8;">
            <h3 style="margin:0 0 15px 0;color:#17a2b8;font-size:18px;">What Happens Next?</h3>
            <p style="margin:5px 0;font-size:14px;color:#0e0e0e;">
                • <strong>Order Processing</strong> – Your order is being prepared for delivery<br />
                • <strong>Provider Assignment</strong> – We'll assign a delivery provider to your order<br />
                • <strong>Delivery Tracking</strong> – You'll receive updates on your delivery status<br />
                • <strong>Delivery Completion</strong> – Your items will be delivered to your specified address
            </p>
        </div>

        <p style="text-align:center;padding-top:20px;">
            <a href="${orderUrl}" style="background-color:#0052cc;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;display:inline-block;">
                Track Your Order
            </a>
        </p>

        <div style="background-color:#fff3cd;padding:15px;border-radius:6px;margin:20px 0;border-left:4px solid #ffc107;">
            <p style="margin:0;font-size:14px;color:#856404;">
                <strong>💡 Important:</strong> Keep this email as proof of your order. You can track your delivery status and communicate with your delivery provider through our platform.
            </p>
        </div>

        <p style="font-size:14px;color:#0e0e0e;padding-top:16px;">
            <strong>Order Summary:</strong><br />
            • Items: £${parseFloat(totalCartPrice).toFixed(2)}<br />
            • Delivery: £${parseFloat(deliveryPrice).toFixed(2)}<br />
            • Total: £${totalPrice.toFixed(2)}<br />
            • Status: Order Confirmed
        </p>

        <p style="font-size:14px;color:#0e0e0e;padding-top:16px;">
            Questions about your order? Our support team is here to help. Just reply to this email or contact us at ${process.env.NEXT_PUBLIC_SUPPORT_EMAIL}.
        </p>

        <p style="font-size:14px;color:#0e0e0e;padding-top:16px;">
            Thank you for shopping with us!<br />
            The Swipped Team
        </p>

        <div style="margin-top:30px;padding-top:20px;border-top:1px solid #e9ecef;font-size:12px;color:#6c757d;">
            <p style="margin:0;">
                This email confirms that your order #${id} has been placed and payment has been processed successfully. 
                You can view and track this order in your customer dashboard.
            </p>
        </div>
    `;
};
