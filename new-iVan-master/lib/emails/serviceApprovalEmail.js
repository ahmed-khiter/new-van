export const getServiceApprovedEmail = (name, serviceName) => {
    return `
    <p style="font-size:20px;color:#0e0e0e;"> Hi <b>${name},</b></p>

    <p style="font-size:14px;color:#0e0e0e;padding-top:16px;">
      <strong>Congratulations!</strong> Your service <strong>"${serviceName}"</strong> has been <span style="color:green;font-weight:bold;">approved</span> by the Swipped admin team.
    </p>

    <p style="font-size:14px;color:#0e0e0e;padding-top:16px;">
      You can now start accepting jobs for this service directly through the Swipped portal.
    </p>

    <p style="font-size:14px;color:#0e0e0e;padding-top:16px;">
      Please make sure to follow all Swipped portal rules and regulations while providing services to customers.
    </p>

    <p style="font-size:14px;color:#0e0e0e;padding-top:16px;">
      We’re excited to have you on board and look forward to your successful service delivery.
    </p>

    <p style="font-size:14px;color:#0e0e0e;padding-top:16px;">
      Best regards,<br />
      The Swipped Team
    </p>
  `;
};
