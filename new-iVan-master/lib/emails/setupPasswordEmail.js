export const getSetupPasswordMail = (
  name,
  setupLink,
) => {
  return ` 
    <p style="font-size:20px;color:#0e0e0e;"> Hi <b>${name},</b></p>
    <p style="font-size:14px;color:#0e0e0e;padding-top:16px;">
      Welcome to Swipped! You've been added as a team member. To get started, please set up your account password by clicking the link below:
    </p>
    <p style="text-align:center;padding-top:16px;">
      <a href="${setupLink}" style="background-color:#0052cc;color:white;padding:12px 20px;border-radius:4px;text-decoration:none;"> Set Up My Password </a>
    </p>
    <p style="font-size:14px;color:#0e0e0e;padding-top:16px;">
      Once you've set up your password, you'll be able to access your dashboard and start working with the team.
    </p>
    <p style="font-size:14px;color:#0e0e0e;padding-top:16px;">
      For security reasons, this link will expire in 7 days. If you need a new link, please contact your administrator.
    </p>
    <p style="font-size:14px;color:#0e0e0e;padding-top:16px;">
      If you have any questions or need assistance, please contact our support team at ${process.env.NEXT_PUBLIC_SUPPORT_EMAIL}.
    </p>
   <p style="font-size:14px;color:#0e0e0e;padding-top:16px;">
      Let's drive success together,<br />
      The Swipped Team
    </p>`;
};
