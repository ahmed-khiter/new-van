export const getResetPasswordMail = (
  name,
  resetPasswordLink,
) => {
  return ` 
    <p style="font-size:20px;color:#0e0e0e;"> Hi <b>${name},</b></p>
    <p style="font-size:14px;color:#0e0e0e;padding-top:16px;">
      We received a request to reset your Swipped password. Don’t worry, we’ve got you covered! Click the link below to set a new password:
    </p>
    <p style="text-align:center;padding-top:16px;">
      <a href="${resetPasswordLink}" style="background-color:#0052cc;color:white;padding:12px 20px;border-radius:4px;text-decoration:none;"> Reset My Password </a>
    </p>
    <p style="font-size:14px;color:#0e0e0e;padding-top:16px;">
      If you didn’t request this change, please ignore this email or contact our support team at ${process.env.NEXT_PUBLIC_SUPPORT_EMAIL} for assistance.
    </p>
    <p style="font-size:14px;color:#0e0e0e;padding-top:16px;">
      For security reasons, this link will expire in 24 hours.
    </p>
    <p style="font-size:14px;color:#0e0e0e;padding-top:16px;">
      Thanks, <br> The ${process.env.NEXT_PUBLIC_SITE_NAME} Team
    </p>`;
};
