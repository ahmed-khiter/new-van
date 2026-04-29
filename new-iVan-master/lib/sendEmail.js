import { getServiceProviderActivationEmailTemplate, getVisitorActivationEmailTemplate, getShopOwnerActivationEmailTemplate, getRestaurantActivationEmailTemplate } from "@/lib/emails/activationEmail";
import { getRegistrationWelcomeEmailTemplate } from "@/lib/emails/welcomeEmail";
import { getBusinessAccountApprovedEmail } from "@/lib/emails/accountApprovalEmail";
import { getResetPasswordMail } from "@/lib/emails/resetPasswordEmail";
import { getSetupPasswordMail } from "@/lib/emails/setupPasswordEmail";
import nodemailer from "nodemailer";
import { EmailTemplate } from "./emails/EmailTemplate";
import { getServiceApprovedEmail } from "./emails/serviceApprovalEmail";
import { getDocumentSubmissionEmail } from "./emails/documentSubmissionEmail";
import { getNewJobNotificationEmail } from "./emails/jobNotificationEmail";
import { getJobAcceptanceEmail } from "./emails/jobAcceptanceEmail";
import { getJobPostedAndPaidEmail } from "./emails/jobPostedAndPaidEmail";
import { getProviderPaymentEmail } from "./emails/providerPaymentEmail";
import { getJobCancellationEmail } from "./emails/jobCancellationEmail";
import { getShopOrderPaymentEmail } from "./emails/shopOrderPaymentEmail";
import { 
  getShopOrderConfirmationRequiredEmail,
  getDeliveryInTransitEmail,
  getDeliveryCompletedEmail,
  getDeliveryCompletedToShopEmail,
  getDeliveryAssignedEmail
} from "./emails/deliveryEmailTemplates";
import { getAccountDeletionNotificationEmail } from "./emails/accountDeletionNotificationEmail";
import { getBusinessAccountApplicationEmail } from "./emails/businessAccountApplicationEmail";
import { getInvitationEmailTemplate } from "./emails/invitationEmail";
import { 
  getReservationConfirmationEmail,
  getReservationAcceptedEmail,
  getReservationRejectedEmail,
  getReservationCancelledCustomerEmail,
  getReservationCancelledRestaurantEmail
} from "./emails/reservationEmailTemplates";

// Helper function to validate emailData
const validateEmailData = (emailData) => {
  const requiredFields = ["type", "email", "subject"];
  for (const field of requiredFields) {
    if (!emailData[field]) {
      throw new Error(`Missing required field: ${field}`);
    }
  }
};

// Helper function to get email content based on email type
const getEmailContent = (emailData) => {
  switch (emailData.type) {
    case "resetPassword":
      return getResetPasswordMail(emailData.name, emailData.activationLink);

    case "setupPassword":
      return getSetupPasswordMail(emailData.name, emailData.setupLink);

    case "activation":
      // Use different templates based on user role
      if (emailData.role === "visitor") {
        return getVisitorActivationEmailTemplate(
          emailData.name,
          emailData.activationLink
        );
      } else if (emailData.role === "shop-owner") {
        return getShopOwnerActivationEmailTemplate(
          emailData.name,
          emailData.activationLink
        );
      } else if (emailData.role === "restaurant") {
        return getRestaurantActivationEmailTemplate(
          emailData.name,
          emailData.activationLink
        );
      } else {
        return getServiceProviderActivationEmailTemplate(
          emailData.name,
          emailData.activationLink
        );
      }
    case "registrationWelcome":
      return getRegistrationWelcomeEmailTemplate({
        name: emailData.name,
        role: emailData.role,
        loginLink: emailData.loginLink,
      });
    case "businessAccountApproved":
      return getBusinessAccountApprovedEmail({
        name: emailData.name,
        accountType: emailData.accountType,
        dashboardLink: emailData.dashboardLink,
      });
    case "serviceApproval":
      return getServiceApprovedEmail(
        emailData.name,
        emailData.serviceName
      );
    case "serviceDocumentUpload":
      return getDocumentSubmissionEmail(
        emailData.name,
        emailData.serviceName
      );
    case "newJobNotification":
      return getNewJobNotificationEmail(emailData);
    case "jobAcceptance":
      return getJobAcceptanceEmail(emailData);
    case "jobPostedAndPaid":
      return getJobPostedAndPaidEmail(emailData);
    case "providerPayment":
      return getProviderPaymentEmail(emailData);
    case "jobCancellation":
      return getJobCancellationEmail(emailData);
    case "shopOrderPayment":
      return getShopOrderPaymentEmail(emailData);
    case "shopOrderConfirmationRequired":
      return getShopOrderConfirmationRequiredEmail(emailData);
    case "deliveryInTransit":
      return getDeliveryInTransitEmail(emailData);
    case "deliveryCompleted":
      return getDeliveryCompletedEmail(emailData);
    case "deliveryCompletedToShop":
      return getDeliveryCompletedToShopEmail(emailData);
    case "deliveryAssigned":
      return getDeliveryAssignedEmail(emailData);
    case "accountDeletionNotification":
      return getAccountDeletionNotificationEmail(emailData);
    case "businessAccountApplication":
      return getBusinessAccountApplicationEmail(emailData);
    case "invitation":
      return getInvitationEmailTemplate(
        emailData.name,
        emailData.invitationLink,
        emailData.role,
        emailData.inviterName
      );
    case "reservationConfirmation":
      return getReservationConfirmationEmail(emailData);
    case "reservationAccepted":
      return getReservationAcceptedEmail(emailData);
    case "reservationRejected":
      return getReservationRejectedEmail(emailData);
    case "reservationCancelledCustomer":
      return getReservationCancelledCustomerEmail(emailData);
    case "reservationCancelledRestaurant":
      return getReservationCancelledRestaurantEmail(emailData);

    default:
      throw new Error(`Unknown email type: ${emailData.type}`);
  }
};

// Helper function to create the transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.MAILTRAP_HOST,
    port: process.env.MAILTRAP_PORT,
    auth: {
      user: process.env.MAILTRAP_USER,
      pass: process.env.MAILTRAP_PASS,
    },
  });
};

export const sendEmail = async (emailData) => {
  try {
    // Validate the required data
    validateEmailData(emailData);

    // Get the email content based on the type
    const emailContent = getEmailContent(emailData);

    // Create the transporter for sending the email
    const transporter = createTransporter();

    // Send the email
    const info = await transporter.sendMail({
      from: `Swipped <${process.env.NEXT_PUBLIC_FROM_EMAIL}>`,
      to: emailData.email,
      subject: `${emailData.subject}`,
      html: EmailTemplate({
        content: emailContent,
        subject: emailData.subject,
      }),
    });

    console.log(
      `Email sent successfully to ${emailData.email} with subject: ${emailData.subject}`
    );
    return info; // Optionally, return email info for logging or further processing
  } catch (error) {
    console.error("Failed to send email:", error.message);
    throw new Error(`Failed to send email: ${error.message}`);
  }
};
