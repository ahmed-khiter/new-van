export const getNewJobNotificationEmail = (emailData) => {
  const { name, job } = emailData;
  const { title, category, price, id } = job;
  const jobUrl = `${process.env.NEXTAUTH_URL}/provider-jobs/${id}`;
  const priceText = price ? `£${price.toFixed(2)}` : "Price to be discussed";

  return `
        <p style="font-size:20px;color:#0e0e0e;">Hi ${name},</p>

        <p style="font-size:16px;color:#0e0e0e;padding-top:16px;">
            <strong>Great news! A new ${category} job has been posted that matches your services.</strong>
        </p>

        <div style="background-color:#f8f9fa;padding:20px;border-radius:8px;margin:20px 0;border-left:4px solid #0052cc;">
            <h3 style="margin:0 0 10px 0;color:#0052cc;font-size:18px;">Job Details</h3>
            <p style="margin:5px 0;font-size:14px;color:#0e0e0e;"><strong>Title:</strong> ${title}</p>
            <p style="margin:5px 0;font-size:14px;color:#0e0e0e;"><strong>Category:</strong> ${category}</p>
            <p style="margin:5px 0;font-size:14px;color:#0e0e0e;"><strong>Price:</strong> ${priceText}</p>
        </div>

        <p style="font-size:14px;color:#0e0e0e;padding-top:16px;">
            This job is perfect for your ${category} services. Don't miss out on this opportunity to connect with a new customer and grow your business!
        </p>

        <p style="font-size:14px;color:#0e0e0e;padding-top:16px;">
            <strong>What's next?</strong>
        </p>

        <p style="font-size:14px;color:#0e0e0e;">
            1. <strong>View Full Details</strong> – Click below to see complete job information<br />
            2. <strong>Accept the Job</strong> – If you're interested, accept it right away<br />
            3. <strong>Get Started</strong> – Connect with the customer and begin the work
        </p>

        <p style="text-align:center;padding-top:20px;">
            <a href="${jobUrl}" style="background-color:#0052cc;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;display:inline-block;">
                View Details
            </a>
        </p>

        <p style="font-size:14px;color:#0e0e0e;padding-top:16px;">
            <strong>Quick Tips:</strong><br />
            • Jobs are first-come, first-served – act fast!<br />
            • Check the job details carefully before accepting<br />
            • Communicate clearly with customers for the best experience
        </p>

        <p style="font-size:14px;color:#0e0e0e;padding-top:16px;">
            Need help or have questions? Our support team is here to assist you. Just reply to this email or contact us at ${process.env.NEXT_PUBLIC_SUPPORT_EMAIL}.
        </p>

        <p style="font-size:14px;color:#0e0e0e;padding-top:16px;">
            Happy to help you grow your business,<br />
            The Swipped Team
        </p>

        <div style="margin-top:30px;padding-top:20px;border-top:1px solid #e9ecef;font-size:12px;color:#6c757d;">
            <p style="margin:0;">
                This email was sent because you have approved ${category} services on Swipped. 
                You can manage your notification preferences in your account settings.
            </p>
        </div>
    `;
};
