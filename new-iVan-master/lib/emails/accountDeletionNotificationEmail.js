export const getAccountDeletionNotificationEmail = (emailData) => {
  const { userName, userEmail, userRole, requestDate } = emailData;
  
  const requestDateFormatted = requestDate 
    ? new Date(requestDate).toLocaleDateString('en-US', {
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

  return `
    <p style="font-size:20px;color:#0e0e0e;">Dear Admin,</p>

    <p style="font-size:16px;color:#0e0e0e;padding-top:16px;">
      <strong>A user has requested to delete their account from the Swipped platform.</strong>
    </p>

    <div style="background-color:#f8f9fa;padding:20px;border-radius:8px;margin:20px 0;border-left:4px solid #dc3545;">
      <h3 style="margin:0 0 15px 0;color:#dc3545;font-size:18px;">User Account Details</h3>
      <p style="margin:5px 0;font-size:14px;color:#0e0e0e;"><strong>Name:</strong> ${userName}</p>
      <p style="margin:5px 0;font-size:14px;color:#0e0e0e;"><strong>Email:</strong> ${userEmail}</p>
      <p style="margin:5px 0;font-size:14px;color:#0e0e0e;"><strong>Role:</strong> ${userRole || 'N/A'}</p>
      <p style="margin:5px 0;font-size:14px;color:#0e0e0e;"><strong>Request Date:</strong> ${requestDateFormatted}</p>
    </div>

    <div style="background-color:#fff3cd;padding:20px;border-radius:8px;margin:20px 0;border-left:4px solid #ffc107;">
      <h3 style="margin:0 0 15px 0;color:#856404;font-size:18px;">⚠️ Action Required</h3>
      <p style="margin:5px 0;font-size:14px;color:#0e0e0e;">
        This user has submitted a request to delete their account. The account deletion process will proceed automatically. 
        Please review this request in the admin panel if you need to take any action or gather additional information.
      </p>
    </div>

    <p style="font-size:14px;color:#0e0e0e;padding-top:16px;">
      This is an automated notification. You can view and manage user accounts in the admin panel.
    </p>

    <p style="font-size:14px;color:#0e0e0e;padding-top:16px;">
      Best regards,<br />
      The Swipped System
    </p>

    <div style="margin-top:30px;padding-top:20px;border-top:1px solid #e9ecef;font-size:12px;color:#6c757d;">
      <p style="margin:0;">
        This email was automatically generated when user ${userEmail} requested to delete their account.
      </p>
    </div>
  `;
};

