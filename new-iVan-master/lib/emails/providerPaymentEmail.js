export const getProviderPaymentEmail = (emailData) => {
  const { providerName, job, paymentAmount, paymentDate, paymentMethod } = emailData;
  const { title, category, price, id, completedAt } = job;
  const jobUrl = `${process.env.NEXTAUTH_URL}/provider-jobs/${id}`;
  const priceText = price ? `£${price.toFixed(2)}` : "Price to be discussed";

  return `
        <p style="font-size:20px;color:#0e0e0e;">Congratulations ${providerName}!</p>

        <p style="font-size:16px;color:#0e0e0e;padding-top:16px;">
            <strong>Great news! Your payment for the ${category} job has been processed successfully.</strong>
        </p>

        <div style="background-color:#f8f9fa;padding:20px;border-radius:8px;margin:20px 0;border-left:4px solid #28a745;">
            <h3 style="margin:0 0 15px 0;color:#28a745;font-size:18px;">Job Details</h3>
            <p style="margin:5px 0;font-size:14px;color:#0e0e0e;"><strong>Title:</strong> ${title}</p>
            <p style="margin:5px 0;font-size:14px;color:#0e0e0e;"><strong>Category:</strong> ${category}</p>
            <p style="margin:5px 0;font-size:14px;color:#0e0e0e;"><strong>Job ID:</strong> #${id}</p>
            <p style="margin:5px 0;font-size:14px;color:#0e0e0e;"><strong>Completed:</strong> ${completedAt ? new Date(completedAt).toLocaleDateString() : 'N/A'}</p>
        </div>

        <div style="background-color:#d4edda;padding:20px;border-radius:8px;margin:20px 0;border-left:4px solid #28a745;">
            <h3 style="margin:0 0 15px 0;color:#28a745;font-size:18px;">Payment Details</h3>
            <p style="margin:5px 0;font-size:14px;color:#0e0e0e;"><strong>Amount Paid:</strong> £${paymentAmount.toFixed(2)}</p>
            <p style="margin:5px 0;font-size:14px;color:#0e0e0e;"><strong>Payment Date:</strong> ${paymentDate}</p>
            <p style="margin:5px 0;font-size:14px;color:#0e0e0e;"><strong>Payment Method:</strong> ${paymentMethod || 'Bank Transfer'}</p>
            <p style="margin:5px 0;font-size:14px;color:#0e0e0e;"><strong>Status:</strong> Payment Successful ✅</p>
        </div>

        <div style="background-color:#e3f2fd;padding:20px;border-radius:8px;margin:20px 0;border-left:4px solid #2196f3;">
            <h3 style="margin:0 0 15px 0;color:#2196f3;font-size:18px;">What's Next?</h3>
            <p style="margin:5px 0;font-size:14px;color:#0e0e0e;">
                • <strong>Check Your Account</strong> – The payment should appear in your bank account within 1-3 business days<br />
                • <strong>Keep Records</strong> – Save this email as proof of payment for your records<br />
                • <strong>Tax Purposes</strong> – This payment may be subject to income tax reporting<br />
                • <strong>Continue Working</strong> – Keep accepting new jobs to grow your earnings
            </p>
        </div>

        <p style="text-align:center;padding-top:20px;">
            <a href="${jobUrl}" style="background-color:#0052cc;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;display:inline-block;">
                View Job Details
            </a>
        </p>

        <div style="background-color:#fff3cd;padding:15px;border-radius:6px;margin:20px 0;border-left:4px solid #ffc107;">
            <p style="margin:0;font-size:14px;color:#856404;">
                <strong>💡 Pro Tip:</strong> Keep track of all your payments and job completions. This information will be helpful for tax reporting and financial planning.
            </p>
        </div>

        <p style="font-size:14px;color:#0e0e0e;padding-top:16px;">
            <strong>Important Information:</strong><br />
            • Payment processing typically takes 1-3 business days<br />
            • Contact support if you don't see the payment within 5 business days<br />
            • Keep this email as proof of payment for your records<br />
            • All payments are processed securely through our payment system
        </p>

        <p style="font-size:14px;color:#0e0e0e;padding-top:16px;">
            Questions about your payment? Our support team is here to help. Just reply to this email or contact us at ${process.env.NEXT_PUBLIC_SUPPORT_EMAIL}.
        </p>

        <p style="font-size:14px;color:#0e0e0e;padding-top:16px;">
            Thank you for your excellent work!<br />
            The Swipped Team
        </p>

        <div style="margin-top:30px;padding-top:20px;border-top:1px solid #e9ecef;font-size:12px;color:#6c757d;">
            <p style="margin:0;">
                This email confirms that your payment for job #${id} has been processed successfully. 
                You can view all your payments and job history in your provider dashboard.
            </p>
        </div>
    `;
};
