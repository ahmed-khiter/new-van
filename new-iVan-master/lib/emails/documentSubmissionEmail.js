export const getDocumentSubmissionEmail = (name, serviceName) => {

    return `
    <p style="font-size:20px;color:#0e0e0e;"> Hi <b>${name},</b></p>

    <p style="font-size:14px;color:#0e0e0e;padding-top:16px;">
      Thank you for submitting your documents for the service: <strong>${serviceName}</strong>.
    </p>

    <p style="font-size:14px;color:#0e0e0e;padding-top:16px;">
      Our admin team will review your submitted documents and approve or reject them within <strong>48 hours</strong>. 
      You will receive a confirmation email once your service verification is completed.
    </p>

    <p style="font-size:14px;color:#0e0e0e;padding-top:16px;">
      Please ensure all documents comply with Swipped portal rules and regulations for smooth approval.
    </p>

    <p style="font-size:14px;color:#0e0e0e;padding-top:16px;">
      Thank you for providing your services through Swipped! Your commitment helps connect customers with quality providers.
    </p>

    <p style="font-size:14px;color:#0e0e0e;padding-top:16px;">
      Best regards,<br />
      The Swipped Team
    </p>
  `;
};
