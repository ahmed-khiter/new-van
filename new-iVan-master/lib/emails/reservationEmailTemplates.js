export const getReservationConfirmationEmail = (emailData) => {
  const { customerName, restaurantName, reservationDate, reservationTime, numberOfGuests, reservationId } = emailData;
  
  const formattedDate = new Date(reservationDate).toLocaleDateString('en-GB', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  const reservationUrl = `${process.env.NEXTAUTH_URL}/customer/reservations/${reservationId}`;

  return `
        <p style="font-size:20px;color:#0e0e0e;">Thank you ${customerName}!</p>

        <p style="font-size:16px;color:#0e0e0e;padding-top:16px;">
            <strong>Your reservation request has been received.</strong>
        </p>

        <div style="background-color:#f8f9fa;padding:20px;border-radius:8px;margin:20px 0;border-left:4px solid #ffc107;">
            <h3 style="margin:0 0 15px 0;color:#ffc107;font-size:18px;">Reservation Details</h3>
            <p style="margin:5px 0;font-size:14px;color:#0e0e0e;"><strong>Restaurant:</strong> ${restaurantName}</p>
            <p style="margin:5px 0;font-size:14px;color:#0e0e0e;"><strong>Date:</strong> ${formattedDate}</p>
            <p style="margin:5px 0;font-size:14px;color:#0e0e0e;"><strong>Time:</strong> ${reservationTime}</p>
            <p style="margin:5px 0;font-size:14px;color:#0e0e0e;"><strong>Number of Guests:</strong> ${numberOfGuests}</p>
            <p style="margin:5px 0;font-size:14px;color:#0e0e0e;"><strong>Reservation ID:</strong> #${reservationId}</p>
        </div>


        <div style="background-color:#fff3cd;padding:15px;border-radius:6px;margin:20px 0;border-left:4px solid #ffc107;">
            <p style="margin:0;font-size:14px;color:#856404;">
                <strong>⏳ Status: Pending Approval</strong><br />
                Your reservation is currently pending approval from the restaurant. You will receive another email once the restaurant has reviewed and confirmed your reservation.
            </p>
        </div>

        <p style="font-size:14px;color:#0e0e0e;padding-top:16px;">
            <strong>What happens next?</strong>
        </p>

        <p style="font-size:14px;color:#0e0e0e;">
            1. <strong>Restaurant Review</strong> – The restaurant will review your reservation request<br />
            2. <strong>Confirmation</strong> – You'll receive an email once your reservation is accepted<br />
            3. <strong>Dining Experience</strong> – Enjoy your meal at the restaurant<br />
            4. <strong>If Rejected</strong> – The restaurant will notify you if they cannot accommodate your reservation
        </p>

        <p style="text-align:center;padding-top:20px;">
            <a href="${reservationUrl}" style="background-color:#0052cc;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;display:inline-block;">
                View Reservation Details
            </a>
        </p>

        <p style="font-size:14px;color:#0e0e0e;padding-top:16px;">
            <strong>Need Help?</strong><br />
            • Track your reservation status in your account<br />
            • Contact the restaurant directly if you have special requests<br />
            • Reach out to our support team if you have any questions
        </p>

        <p style="font-size:14px;color:#0e0e0e;padding-top:16px;">
            Questions or need assistance? Our support team is here to help. Just reply to this email or contact us at ${process.env.NEXT_PUBLIC_SUPPORT_EMAIL}.
        </p>

        <p style="font-size:14px;color:#0e0e0e;padding-top:16px;">
            Thank you for choosing Swipped!<br />
            The Swipped Team
        </p>

        <div style="margin-top:30px;padding-top:20px;border-top:1px solid #e9ecef;font-size:12px;color:#6c757d;">
            <p style="margin:0;">
                This email confirms that your reservation #${reservationId} has been submitted successfully. 
                You can view and track this reservation in your customer dashboard.
            </p>
        </div>
    `;
};

export const getReservationAcceptedEmail = (emailData) => {
  const { customerName, restaurantName, reservationDate, reservationTime, numberOfGuests, reservationId, restaurantAddress, restaurantPhone } = emailData;
  
  const formattedDate = new Date(reservationDate).toLocaleDateString('en-GB', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  const reservationUrl = `${process.env.NEXTAUTH_URL}/customer/reservations/${reservationId}`;

  return `
        <p style="font-size:20px;color:#0e0e0e;">Great news ${customerName}!</p>

        <p style="font-size:16px;color:#0e0e0e;padding-top:16px;">
            <strong>Your reservation has been confirmed by ${restaurantName}!</strong>
        </p>

        <div style="background-color:#d4edda;padding:20px;border-radius:8px;margin:20px 0;border-left:4px solid #28a745;">
            <h3 style="margin:0 0 15px 0;color:#28a745;font-size:18px;">✅ Reservation Confirmed</h3>
            <p style="margin:5px 0;font-size:14px;color:#0e0e0e;"><strong>Restaurant:</strong> ${restaurantName}</p>
            <p style="margin:5px 0;font-size:14px;color:#0e0e0e;"><strong>Date:</strong> ${formattedDate}</p>
            <p style="margin:5px 0;font-size:14px;color:#0e0e0e;"><strong>Time:</strong> ${reservationTime}</p>
            <p style="margin:5px 0;font-size:14px;color:#0e0e0e;"><strong>Number of Guests:</strong> ${numberOfGuests}</p>
            <p style="margin:5px 0;font-size:14px;color:#0e0e0e;"><strong>Reservation ID:</strong> #${reservationId}</p>
            ${restaurantAddress ? `<p style="margin:5px 0;font-size:14px;color:#0e0e0e;"><strong>Address:</strong> ${restaurantAddress}</p>` : ''}
            ${restaurantPhone ? `<p style="margin:5px 0;font-size:14px;color:#0e0e0e;"><strong>Phone:</strong> ${restaurantPhone}</p>` : ''}
        </div>


        <p style="text-align:center;padding-top:20px;">
            <a href="${reservationUrl}" style="background-color:#28a745;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;display:inline-block;">
                View Reservation Details
            </a>
        </p>

        <p style="font-size:14px;color:#0e0e0e;padding-top:16px;">
            <strong>What to expect:</strong><br />
            • Arrive on time for your reservation<br />
            • The restaurant is expecting you and your party<br />
            • If you need to make changes, contact the restaurant directly
        </p>

        <p style="font-size:14px;color:#0e0e0e;padding-top:16px;">
            We hope you have a wonderful dining experience!<br />
            The Swipped Team
        </p>

        <div style="margin-top:30px;padding-top:20px;border-top:1px solid #e9ecef;font-size:12px;color:#6c757d;">
            <p style="margin:0;">
                This email confirms that your reservation #${reservationId} has been accepted by ${restaurantName}. 
                You can view and manage this reservation in your customer dashboard.
            </p>
        </div>
    `;
};

export const getReservationRejectedEmail = (emailData) => {
  const { customerName, restaurantName, reservationDate, reservationTime, numberOfGuests, reservationId } = emailData;
  
  const formattedDate = new Date(reservationDate).toLocaleDateString('en-GB', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  const reservationUrl = `${process.env.NEXTAUTH_URL}/customer/reservations/${reservationId}`;

  return `
        <p style="font-size:20px;color:#0e0e0e;">Hello ${customerName},</p>

        <p style="font-size:16px;color:#0e0e0e;padding-top:16px;">
            We're sorry to inform you that ${restaurantName} was unable to accommodate your reservation request.
        </p>

        <div style="background-color:#f8f9fa;padding:20px;border-radius:8px;margin:20px 0;border-left:4px solid #6c757d;">
            <h3 style="margin:0 0 15px 0;color:#6c757d;font-size:18px;">Reservation Details</h3>
            <p style="margin:5px 0;font-size:14px;color:#0e0e0e;"><strong>Restaurant:</strong> ${restaurantName}</p>
            <p style="margin:5px 0;font-size:14px;color:#0e0e0e;"><strong>Date:</strong> ${formattedDate}</p>
            <p style="margin:5px 0;font-size:14px;color:#0e0e0e;"><strong>Time:</strong> ${reservationTime}</p>
            <p style="margin:5px 0;font-size:14px;color:#0e0e0e;"><strong>Number of Guests:</strong> ${numberOfGuests}</p>
            <p style="margin:5px 0;font-size:14px;color:#0e0e0e;"><strong>Reservation ID:</strong> #${reservationId}</p>
        </div>


        <p style="text-align:center;padding-top:20px;">
            <a href="${reservationUrl}" style="background-color:#0052cc;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;display:inline-block;">
                View Reservation Details
            </a>
        </p>

        <p style="font-size:14px;color:#0e0e0e;padding-top:16px;">
            <strong>What's next?</strong><br />
            • You can try booking a different date or time<br />
            • Explore other restaurants on our platform<br />
            • Contact the restaurant directly if you have questions
        </p>

        <p style="font-size:14px;color:#0e0e0e;padding-top:16px;">
            We apologize for any inconvenience. If you have any questions or need assistance finding an alternative reservation, 
            please don't hesitate to contact our support team at ${process.env.NEXT_PUBLIC_SUPPORT_EMAIL}.
        </p>

        <p style="font-size:14px;color:#0e0e0e;padding-top:16px;">
            Thank you for using Swipped!<br />
            The Swipped Team
        </p>

        <div style="margin-top:30px;padding-top:20px;border-top:1px solid #e9ecef;font-size:12px;color:#6c757d;">
            <p style="margin:0;">
                This email confirms that your reservation #${reservationId} was not accepted by ${restaurantName}. 
                You can view the details in your customer dashboard.
            </p>
        </div>
    `;
};

export const getReservationCancelledCustomerEmail = (emailData) => {
  const { customerName, restaurantName, reservationDate, reservationTime, numberOfGuests, reservationId, depositAmount, refundId } = emailData;
  
  const formattedDate = new Date(reservationDate).toLocaleDateString('en-GB', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  const reservationUrl = `${process.env.NEXTAUTH_URL}/customer/reservations/${reservationId}`;

  return `
        <p style="font-size:20px;color:#0e0e0e;">Hello ${customerName},</p>

        <p style="font-size:16px;color:#0e0e0e;padding-top:16px;">
            <strong>Your reservation at ${restaurantName} has been cancelled.</strong>
        </p>

        <div style="background-color:#f8f9fa;padding:20px;border-radius:8px;margin:20px 0;border-left:4px solid #dc3545;">
            <h3 style="margin:0 0 15px 0;color:#dc3545;font-size:18px;">Cancelled Reservation Details</h3>
            <p style="margin:5px 0;font-size:14px;color:#0e0e0e;"><strong>Restaurant:</strong> ${restaurantName}</p>
            <p style="margin:5px 0;font-size:14px;color:#0e0e0e;"><strong>Date:</strong> ${formattedDate}</p>
            <p style="margin:5px 0;font-size:14px;color:#0e0e0e;"><strong>Time:</strong> ${reservationTime}</p>
            <p style="margin:5px 0;font-size:14px;color:#0e0e0e;"><strong>Number of Guests:</strong> ${numberOfGuests}</p>
            <p style="margin:5px 0;font-size:14px;color:#0e0e0e;"><strong>Reservation ID:</strong> #${reservationId}</p>
        </div>

        ${depositAmount && Number(depositAmount) > 0 ? `
        <div style="background-color:#d1ecf1;padding:15px;border-radius:6px;margin:20px 0;border-left:4px solid #0c5460;">
            <p style="margin:0;font-size:14px;color:#0c5460;">
                <strong>Deposit Refund:</strong><br />
                Your deposit of £${Number(depositAmount).toFixed(2)} ${refundId ? 'has been refunded' : 'will be refunded'} to your original payment method.
                ${refundId ? `Refund ID: ${refundId}` : 'Please allow 5-10 business days for the refund to process.'}
            </p>
        </div>
        ` : ''}

        <p style="text-align:center;padding-top:20px;">
            <a href="${reservationUrl}" style="background-color:#0052cc;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;display:inline-block;">
                View Reservation Details
            </a>
        </p>

        <p style="font-size:14px;color:#0e0e0e;padding-top:16px;">
            <strong>What's next?</strong><br />
            • You can make a new reservation at any time<br />
            • Explore other restaurants on our platform<br />
            • Contact us if you have any questions about your refund
        </p>

        <p style="font-size:14px;color:#0e0e0e;padding-top:16px;">
            If you have any questions or need assistance, please contact our support team at ${process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'support@swipped.com'}.
        </p>

        <p style="font-size:14px;color:#0e0e0e;padding-top:16px;">
            Thank you for using Swipped!<br />
            The Swipped Team
        </p>

        <div style="margin-top:30px;padding-top:20px;border-top:1px solid #e9ecef;font-size:12px;color:#6c757d;">
            <p style="margin:0;">
                This email confirms that your reservation #${reservationId} has been cancelled. 
                You can view the details in your customer dashboard.
            </p>
        </div>
    `;
};

export const getReservationCancelledRestaurantEmail = (emailData) => {
  const { restaurantOwnerName, customerName, restaurantName, reservationDate, reservationTime, numberOfGuests, reservationId } = emailData;
  
  const formattedDate = new Date(reservationDate).toLocaleDateString('en-GB', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  const reservationUrl = `${process.env.NEXTAUTH_URL}/restaurant/reservations/reservation/${reservationId}`;

  return `
        <p style="font-size:20px;color:#0e0e0e;">Hello ${restaurantOwnerName},</p>

        <p style="font-size:16px;color:#0e0e0e;padding-top:16px;">
            <strong>A reservation at ${restaurantName} has been cancelled by the customer.</strong>
        </p>

        <div style="background-color:#f8f9fa;padding:20px;border-radius:8px;margin:20px 0;border-left:4px solid #dc3545;">
            <h3 style="margin:0 0 15px 0;color:#dc3545;font-size:18px;">Cancelled Reservation Details</h3>
            <p style="margin:5px 0;font-size:14px;color:#0e0e0e;"><strong>Customer:</strong> ${customerName}</p>
            <p style="margin:5px 0;font-size:14px;color:#0e0e0e;"><strong>Date:</strong> ${formattedDate}</p>
            <p style="margin:5px 0;font-size:14px;color:#0e0e0e;"><strong>Time:</strong> ${reservationTime}</p>
            <p style="margin:5px 0;font-size:14px;color:#0e0e0e;"><strong>Number of Guests:</strong> ${numberOfGuests}</p>
            <p style="margin:5px 0;font-size:14px;color:#0e0e0e;"><strong>Reservation ID:</strong> #${reservationId}</p>
        </div>

        <p style="text-align:center;padding-top:20px;">
            <a href="${reservationUrl}" style="background-color:#0052cc;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;display:inline-block;">
                View Reservation Details
            </a>
        </p>

        <p style="font-size:14px;color:#0e0e0e;padding-top:16px;">
            <strong>Note:</strong><br />
            • This reservation has been cancelled by the customer<br />
            • The table is now available for other reservations<br />
            • Any deposit paid by the customer will be refunded to them
        </p>

        <p style="font-size:14px;color:#0e0e0e;padding-top:16px;">
            If you have any questions, please contact our support team at ${process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'support@swipped.com'}.
        </p>

        <p style="font-size:14px;color:#0e0e0e;padding-top:16px;">
            Thank you for using Swipped!<br />
            The Swipped Team
        </p>

        <div style="margin-top:30px;padding-top:20px;border-top:1px solid #e9ecef;font-size:12px;color:#6c757d;">
            <p style="margin:0;">
                This email confirms that reservation #${reservationId} at ${restaurantName} has been cancelled by the customer.
            </p>
        </div>
    `;
};

