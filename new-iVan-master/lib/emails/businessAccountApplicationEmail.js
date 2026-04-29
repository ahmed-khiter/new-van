export const getBusinessAccountApplicationEmail = (emailData) => {
  const { 
    firstName, 
    lastName, 
    companyName, 
    companyNumber, 
    email, 
    contactNumber, 
    limitRequest, 
    customLimit,
    submittedAt 
  } = emailData;
  
  const submittedDateFormatted = submittedAt 
    ? new Date(submittedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

  // Determine the limit display
  let limitDisplay = "";
  if (limitRequest === "custom") {
    limitDisplay = customLimit ? `£${parseFloat(customLimit).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "Custom (not specified)";
  } else {
    limitDisplay = `£${parseInt(limitRequest).toLocaleString('en-GB')}`;
  }

  return `
    <p style="font-size:20px;color:#0e0e0e;">Dear Admin,</p>

    <p style="font-size:16px;color:#0e0e0e;padding-top:16px;">
      <strong>A new business account application has been submitted on the Swipped platform.</strong>
    </p>

    <div style="background-color:#f8f9fa;padding:20px;border-radius:8px;margin:20px 0;border-left:4px solid #007bff;">
      <h3 style="margin:0 0 15px 0;color:#007bff;font-size:18px;">Application Details</h3>
      <p style="margin:5px 0;font-size:14px;color:#0e0e0e;"><strong>First Name:</strong> ${firstName || 'N/A'}</p>
      <p style="margin:5px 0;font-size:14px;color:#0e0e0e;"><strong>Last Name:</strong> ${lastName || 'N/A'}</p>
      <p style="margin:5px 0;font-size:14px;color:#0e0e0e;"><strong>Company Name:</strong> ${companyName || 'N/A'}</p>
      <p style="margin:5px 0;font-size:14px;color:#0e0e0e;"><strong>Company Number:</strong> ${companyNumber || 'N/A'}</p>
      <p style="margin:5px 0;font-size:14px;color:#0e0e0e;"><strong>Email:</strong> ${email || 'N/A'}</p>
      <p style="margin:5px 0;font-size:14px;color:#0e0e0e;"><strong>Contact Number:</strong> ${contactNumber || 'N/A'}</p>
      <p style="margin:5px 0;font-size:14px;color:#0e0e0e;"><strong>Requested Limit:</strong> ${limitDisplay}</p>
      <p style="margin:5px 0;font-size:14px;color:#0e0e0e;"><strong>Submitted At:</strong> ${submittedDateFormatted}</p>
    </div>

    <div style="background-color:#fff3cd;padding:20px;border-radius:8px;margin:20px 0;border-left:4px solid #ffc107;">
      <h3 style="margin:0 0 15px 0;color:#856404;font-size:18px;">📋 Action Required</h3>
      <p style="margin:5px 0;font-size:14px;color:#0e0e0e;">
        Please review this business account application in the admin panel. You can contact the applicant at ${email || 'N/A'} or ${contactNumber || 'N/A'} to proceed with the approval process.
      </p>
    </div>

    <p style="font-size:14px;color:#0e0e0e;padding-top:16px;">
      This is an automated notification. You can view and manage business account applications in the admin panel.
    </p>

    <p style="font-size:14px;color:#0e0e0e;padding-top:16px;">
      Best regards,<br />
      The Swipped System
    </p>

    <div style="margin-top:30px;padding-top:20px;border-top:1px solid #e9ecef;font-size:12px;color:#6c757d;">
      <p style="margin:0;">
        This email was automatically generated when a business account application was submitted on ${submittedDateFormatted}.
      </p>
    </div>
  `;
};

