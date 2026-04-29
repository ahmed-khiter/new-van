export const getJobAcceptanceEmail = (emailData) => {
  const { providerName, job, customerName } = emailData;
  const { title, category, price, id, notes, pickupAddressLine1, pickupCity, dropOffAddressLine1, dropOffCity } = job;
  const jobUrl = `${process.env.NEXTAUTH_URL}/provider-jobs/${id}`;
  const priceText = price ? `£${price.toFixed(2)}` : "Price to be discussed";

  return `
        <p style="font-size:20px;color:#0e0e0e;">Congratulations ${providerName}!</p>

        <p style="font-size:16px;color:#0e0e0e;padding-top:16px;">
            <strong>Great news! You have successfully accepted a ${category} job.</strong>
        </p>

        <div style="background-color:#f8f9fa;padding:20px;border-radius:8px;margin:20px 0;border-left:4px solid #28a745;">
            <h3 style="margin:0 0 15px 0;color:#28a745;font-size:18px;">Job Details</h3>
            <p style="margin:5px 0;font-size:14px;color:#0e0e0e;"><strong>Title:</strong> ${title}</p>
            <p style="margin:5px 0;font-size:14px;color:#0e0e0e;"><strong>Category:</strong> ${category}</p>
            <p style="margin:5px 0;font-size:14px;color:#0e0e0e;"><strong>Price:</strong> ${priceText}</p>
            <p style="margin:5px 0;font-size:14px;color:#0e0e0e;"><strong>Customer:</strong> ${customerName}</p>
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

        <p style="font-size:14px;color:#0e0e0e;padding-top:16px;">
            <strong>What happens next?</strong>
        </p>

        <p style="font-size:14px;color:#0e0e0e;">
            1. <strong>Review Job Details</strong> – Click below to see complete job information<br />
            2. <strong>Contact Customer</strong> – Use the chat feature to communicate with ${customerName}<br />
            3. <strong>Complete the Job</strong> – Follow the job requirements and deliver excellent service<br />
            4. <strong>Get Paid</strong> – Receive payment once the job is completed
        </p>

        <p style="text-align:center;padding-top:20px;">
            <a href="${jobUrl}" style="background-color:#28a745;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;display:inline-block;">
                View Job Details
            </a>
        </p>

        <div style="background-color:#fff3cd;padding:15px;border-radius:6px;margin:20px 0;border-left:4px solid #ffc107;">
            <p style="margin:0;font-size:14px;color:#856404;">
                <strong>💡 Pro Tip:</strong> Communication is key! Make sure to contact the customer promptly to discuss job details, timing, and any questions you might have.
            </p>
        </div>

        <p style="font-size:14px;color:#0e0e0e;padding-top:16px;">
            <strong>Important Reminders:</strong><br />
            • Always maintain professional communication with customers<br />
            • Complete the job according to the specified requirements<br />
            • Update job status in your dashboard as you progress<br />
            • Contact support if you encounter any issues
        </p>

        <p style="font-size:14px;color:#0e0e0e;padding-top:16px;">
            Need help or have questions? Our support team is here to assist you. Just reply to this email or contact us at ${process.env.NEXT_PUBLIC_SUPPORT_EMAIL}.
        </p>

        <p style="font-size:14px;color:#0e0e0e;padding-top:16px;">
            Best of luck with your new job!<br />
            The Swipped Team
        </p>

        <div style="margin-top:30px;padding-top:20px;border-top:1px solid #e9ecef;font-size:12px;color:#6c757d;">
            <p style="margin:0;">
                This email confirms your acceptance of job #${id}. You can view and manage this job in your provider dashboard.
            </p>
        </div>
    `;
};
