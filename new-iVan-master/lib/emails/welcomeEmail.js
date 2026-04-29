export const getRegistrationWelcomeEmailTemplate = ({ name, role, loginLink }) => {
  const roleCopy = {
    visitor: {
      heading: "your customer account",
      steps: `
        1. <strong>Browse Services</strong> - Find the right provider for your needs.<br />
        2. <strong>Book Instantly</strong> - Create job requests and get matched quickly.<br />
        3. <strong>Track Progress</strong> - Follow updates and chat with providers.
      `,
    },
    "shop-owner": {
      heading: "your shop owner account",
      steps: `
        1. <strong>Set Up Your Shop</strong> - Add address and business details.<br />
        2. <strong>Add Products</strong> - Publish your catalog and pricing.<br />
        3. <strong>Manage Orders</strong> - Track and fulfill incoming orders.
      `,
    },
    restaurant: {
      heading: "your restaurant account",
      steps: `
        1. <strong>Set Up Restaurant</strong> - Add address, hours, and profile details.<br />
        2. <strong>Add Menu Items</strong> - Publish your menu and prices.<br />
        3. <strong>Manage Orders</strong> - Handle incoming customer orders.
      `,
    },
    provider: {
      heading: "your provider account",
      steps: `
        1. <strong>Set Up Services</strong> - Choose categories and pricing.<br />
        2. <strong>Receive Jobs</strong> - Start getting matched with customers.<br />
        3. <strong>Manage Bookings</strong> - Track and complete active jobs.
      `,
    },
  };

  const selectedRole = roleCopy[role] || roleCopy.provider;

  return `
    <p style="font-size:20px;color:#0e0e0e;">Hi <b>${name},</b></p>

    <p style="font-size:14px;color:#0e0e0e;padding-top:16px;">
      Welcome to <strong>Swipped</strong>! Your account is active and ready to use.
    </p>

    <p style="font-size:14px;color:#0e0e0e;padding-top:16px;">
      You can now log in and start using ${selectedRole.heading}.
    </p>

    <p style="font-size:14px;color:#0e0e0e;padding-top:16px;">
      Here is what you can do next:
    </p>

    <p style="font-size:14px;color:#0e0e0e;">
      ${selectedRole.steps}
    </p>

    <p style="text-align:center;padding-top:16px;">
      <a href="${loginLink}" style="background-color:#0052cc;color:white;padding:12px 20px;border-radius:4px;text-decoration:none;">
        Log In to Your Swipped Account
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
