export const getJobPostedAndPaidEmail = (emailData) => {
  const { customerName, job, paymentAmount, transactionId } = emailData;
  const { title, category, price, id, notes, pickupAddressLine1, pickupCity, dropOffAddressLine1, dropOffCity } = job;
  const jobUrl = `${process.env.NEXTAUTH_URL}/customer/jobs/${id}`;
  const priceText = price ? `£${price.toFixed(2)}` : "Price to be discussed";

  return `
        <p style="font-size:20px;color:#0e0e0e;">Thank you ${customerName}!</p>

        <p style="font-size:16px;color:#0e0e0e;padding-top:16px;">
            <strong>Great news! Your ${category} job has been successfully posted and payment has been processed.</strong>
        </p>

        <div style="background-color:#f8f9fa;padding:20px;border-radius:8px;margin:20px 0;border-left:4px solid #28a745;">
            <h3 style="margin:0 0 15px 0;color:#28a745;font-size:18px;">Job Details</h3>
            <p style="margin:5px 0;font-size:14px;color:#0e0e0e;"><strong>Title:</strong> ${title}</p>
            <p style="margin:5px 0;font-size:14px;color:#0e0e0e;"><strong>Category:</strong> ${category}</p>
            <p style="margin:5px 0;font-size:14px;color:#0e0e0e;"><strong>Price:</strong> ${priceText}</p>
            <p style="margin:5px 0;font-size:14px;color:#0e0e0e;"><strong>Job ID:</strong> #${id}</p>
            ${notes ? `<p style="margin:5px 0;font-size:14px;color:#0e0e0e;"><strong>Notes:</strong> ${notes}</p>` : ''}
        </div>

        ${pickupAddressLine1 || dropOffAddressLine1 ? `
        <div style="background-color:#e3f2fd;padding:20px;border-radius:8px;margin:20px 0;border-left:4px solid #2196f3;">
            <h3 style="margin:0 0 15px 0;color:#2196f3;font-size:18px;">Location Details</h3>
            ${pickupAddressLine1 ? `
            <p style="margin:5px 0;font-size:14px;color:#0e0e0e;"><strong>Pickup:</strong> ${pickupAddressLine1}${pickupCity ? `, ${pickupCity}` : ''}</p>
            ` : ''}
            ${dropOffAddressLine1 ? `
            <p style="margin:5px 0;font-size:14px;color:#0e0e0e;"><strong>Drop-off:</strong> ${dropOffAddressLine1}${dropOffCity ? `, ${dropOffCity}` : ''}</p>
            ` : ''}
        </div>
        ` : ''}

        <div style="background-color:#d4edda;padding:20px;border-radius:8px;margin:20px 0;border-left:4px solid #28a745;">
            <h3 style="margin:0 0 15px 0;color:#28a745;font-size:18px;">Payment Confirmation</h3>
            <p style="margin:5px 0;font-size:14px;color:#0e0e0e;"><strong>Amount Paid:</strong> £${paymentAmount.toFixed(2)}</p>
            <p style="margin:5px 0;font-size:14px;color:#0e0e0e;"><strong>Transaction ID:</strong> ${transactionId}</p>
            <p style="margin:5px 0;font-size:14px;color:#0e0e0e;"><strong>Status:</strong> Payment Successful ✅</p>
        </div>

        <p style="font-size:14px;color:#0e0e0e;padding-top:16px;">
            <strong>What happens next?</strong>
        </p>

        <p style="font-size:14px;color:#0e0e0e;">
            1. <strong>Job is Live</strong> – Your job is now active and visible to qualified service providers<br />
            2. <strong>Provider Matching</strong> – We'll notify providers who match your job requirements<br />
            3. <strong>Job Acceptance</strong> – A provider will accept your job and contact you directly<br />
            4. <strong>Service Delivery</strong> – The provider will complete your job as specified
        </p>

        <p style="text-align:center;padding-top:20px;">
            <a href="${jobUrl}" style="background-color:#0052cc;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;display:inline-block;">
                View Job Details
            </a>
        </p>

        <div style="background-color:#fff3cd;padding:15px;border-radius:6px;margin:20px 0;border-left:4px solid #ffc107;">
            <p style="margin:0;font-size:14px;color:#856404;">
                <strong>💡 Important:</strong> Keep an eye on your email and phone for messages from service providers who accept your job. They'll contact you directly to coordinate the service delivery.
            </p>
        </div>

        <p style="font-size:14px;color:#0e0e0e;padding-top:16px;">
            <strong>Need Help?</strong><br />
            • Track your job status in your dashboard<br />
            • Contact providers directly through the platform<br />
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
                This email confirms that your job #${id} has been posted and payment has been processed successfully. 
                You can view and manage this job in your customer dashboard.
            </p>
        </div>
    `;
};
