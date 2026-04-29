export const getJobCancellationEmail = (emailData) => {
  const { customerName, job, providerName, penaltyFee, cancellationReason, replacementJobId } = emailData;
  const { title, category, price, id, pickupAddressLine1, pickupCity, dropOffAddressLine1, dropOffCity } = job;
  const jobUrl = `${process.env.NEXTAUTH_URL}/customer/jobs/${id}`;
  const replacementJobUrl = replacementJobId ? `${process.env.NEXTAUTH_URL}/customer/jobs/${replacementJobId}` : null;
  const priceText = price ? `£${price.toFixed(2)}` : "Price to be discussed";

  return `
        <p style="font-size:20px;color:#0e0e0e;">Dear ${customerName},</p>

        <p style="font-size:16px;color:#0e0e0e;padding-top:16px;">
            <strong>We regret to inform you that your ${category} job has been canceled by the service provider.</strong>
        </p>

        <div style="background-color:#f8f9fa;padding:20px;border-radius:8px;margin:20px 0;border-left:4px solid #dc3545;">
            <h3 style="margin:0 0 15px 0;color:#dc3545;font-size:18px;">Job Details</h3>
            <p style="margin:5px 0;font-size:14px;color:#0e0e0e;"><strong>Title:</strong> ${title}</p>
            <p style="margin:5px 0;font-size:14px;color:#0e0e0e;"><strong>Category:</strong> ${category}</p>
            <p style="margin:5px 0;font-size:14px;color:#0e0e0e;"><strong>Job ID:</strong> #${id}</p>
            <p style="margin:5px 0;font-size:14px;color:#0e0e0e;"><strong>Original Price:</strong> ${priceText}</p>
            <p style="margin:5px 0;font-size:14px;color:#0e0e0e;"><strong>Provider:</strong> ${providerName}</p>
            ${cancellationReason ? `<p style="margin:5px 0;font-size:14px;color:#0e0e0e;"><strong>Reason:</strong> ${cancellationReason}</p>` : ''}
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

        <div style="background-color:#fff3cd;padding:20px;border-radius:8px;margin:20px 0;border-left:4px solid #ffc107;">
            <h3 style="margin:0 0 15px 0;color:#856404;font-size:18px;">Penalty Fee Information</h3>
            <p style="margin:5px 0;font-size:14px;color:#0e0e0e;"><strong>Penalty Fee:</strong> £${penaltyFee.toFixed(2)}</p>
            <p style="margin:5px 0;font-size:14px;color:#0e0e0e;"><strong>Reason for Penalty:</strong> Service provider cancellation</p>
            <p style="margin:5px 0;font-size:14px;color:#0e0e0e;"><strong>Status:</strong> Will be deducted from your refund</p>
        </div>

        <div style="background-color:#d1ecf1;padding:20px;border-radius:8px;margin:20px 0;border-left:4px solid #17a2b8;">
            <h3 style="margin:0 0 15px 0;color:#17a2b8;font-size:18px;">What Happens Next?</h3>
            <p style="margin:5px 0;font-size:14px;color:#0e0e0e;">
                • <strong>Automatic Refund</strong> – Your payment will be refunded minus the penalty fee<br />
                • <strong>New Job Posted</strong> – We've automatically reposted your job for other providers<br />
                • <strong>Provider Search</strong> – We'll notify qualified providers about your job<br />
                • <strong>Quick Replacement</strong> – You should have a new provider soon
            </p>
        </div>

        ${replacementJobUrl ? `
        <p style="text-align:center;padding-top:20px;">
            <a href="${replacementJobUrl}" style="background-color:#0052cc;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;display:inline-block;">
                View New Job Posting
            </a>
        </p>
        ` : ''}

        <div style="background-color:#f8d7da;padding:15px;border-radius:6px;margin:20px 0;border-left:4px solid #dc3545;">
            <p style="margin:0;font-size:14px;color:#721c24;">
                <strong>⚠️ Important:</strong> The penalty fee is applied to cover administrative costs and ensure service quality. This helps maintain a reliable network of providers.
            </p>
        </div>

        <p style="font-size:14px;color:#0e0e0e;padding-top:16px;">
            <strong>Refund Details:</strong><br />
            • Original payment: ${priceText}<br />
            • Penalty fee: £${penaltyFee.toFixed(2)}<br />
            • Refund amount: £${(price - penaltyFee).toFixed(2)}<br />
            • Processing time: 3-5 business days
        </p>

        <p style="font-size:14px;color:#0e0e0e;padding-top:16px;">
            <strong>We apologize for this inconvenience and are working to ensure you get the service you need as quickly as possible.</strong>
        </p>

        <p style="font-size:14px;color:#0e0e0e;padding-top:16px;">
            Questions about the cancellation or refund? Our support team is here to help. Just reply to this email or contact us at ${process.env.NEXT_PUBLIC_SUPPORT_EMAIL}.
        </p>

        <p style="font-size:14px;color:#0e0e0e;padding-top:16px;">
            Thank you for your understanding,<br />
            The Swipped Team
        </p>

        <div style="margin-top:30px;padding-top:20px;border-top:1px solid #e9ecef;font-size:12px;color:#6c757d;">
            <p style="margin:0;">
                This email confirms the cancellation of job #${id} by the service provider. 
                A new job has been posted to find you a replacement provider.
            </p>
        </div>
    `;
};
