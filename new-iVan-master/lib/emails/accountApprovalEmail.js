export const getBusinessAccountApprovedEmail = ({ name, accountType, dashboardLink }) => {
  return `
    <p style="font-size:20px;color:#0e0e0e;">Hi <b>${name},</b></p>

    <p style="font-size:14px;color:#0e0e0e;padding-top:16px;">
      Great news! Your <strong>${accountType}</strong> account has been approved by the Swipped admin team.
    </p>

    <p style="font-size:14px;color:#0e0e0e;padding-top:16px;">
      You can now log in and start using all available business features.
    </p>

    <p style="text-align:center;padding-top:16px;">
      <a href="${dashboardLink}" style="background-color:#0052cc;color:white;padding:12px 20px;border-radius:4px;text-decoration:none;">
        Go to Dashboard
      </a>
    </p>

    <p style="font-size:14px;color:#0e0e0e;padding-top:16px;">
      Need help? Reply to this email or contact us at ${process.env.NEXT_PUBLIC_SUPPORT_EMAIL}.
    </p>

    <p style="font-size:14px;color:#0e0e0e;padding-top:16px;">
      The Swipped Team
    </p>
  `;
};
