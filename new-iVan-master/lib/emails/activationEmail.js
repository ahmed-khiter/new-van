export const getServiceProviderActivationEmailTemplate = (name, activationLink) => {
  return `
    <p style="font-size:20px;color:#0e0e0e;"> Hi <b>${name},</b></p>

    <p style="font-size:14px;color:#0e0e0e;padding-top:16px;">
      Welcome to <strong>Swipped</strong>! You're now one step closer to reaching customers and growing your service business.
    </p>

    <p style="font-size:14px;color:#0e0e0e;padding-top:16px;">
      With Swipped, you can easily offer services like Van transport, Recovery, Removals, Locksmith, Cleaning, and Car Key Replacement, and manage bookings efficiently.
    </p>

    <p style="font-size:14px;color:#0e0e0e;padding-top:16px;">
      Here's what's next:
    </p>

    <p style="font-size:14px;color:#0e0e0e;">
      1. <strong>Log In</strong> – Access your provider dashboard and manage your services.<br />
      2. <strong>Set Up Services</strong> – Choose the categories you provide and define your pricing.<br />
      3. <strong>Start Getting Bookings</strong> – Connect with customers and grow your business.
    </p>

    <p style="font-size:14px;color:#0e0e0e;padding-top:16px;">
      <strong>Ready to get started?</strong>
    </p>

    <p style="font-size:14px;color:#0e0e0e;">
      Click below to log in and activate your provider account.
    </p>

    <p style="text-align:center;padding-top:16px;">
      <a href="${activationLink}" style="background-color:#0052cc;color:white;padding:12px 20px;border-radius:4px;text-decoration:none;">
        Log In to Your Swipped Account
      </a>
    </p>

    <p style="font-size:14px;color:#0e0e0e;padding-top:16px;">
      Have questions? Our support team is here to help! Just reply to this email or reach out to ${process.env.NEXT_PUBLIC_SUPPORT_EMAIL}.
    </p>

    <p style="font-size:14px;color:#0e0e0e;padding-top:16px;">
      Let's drive success together,<br />
      The Swipped Team
    </p>
  `;
};

export const getVisitorActivationEmailTemplate = (name, activationLink) => {
  return `
    <p style="font-size:20px;color:#0e0e0e;"> Hi <b>${name},</b></p>

    <p style="font-size:14px;color:#0e0e0e;padding-top:16px;">
      Welcome to <strong>Swipped</strong>! You're now ready to find and book reliable service providers for all your needs.
    </p>

    <p style="font-size:14px;color:#0e0e0e;padding-top:16px;">
      With Swipped, you can easily find and book services like Van transport, Recovery, Removals, Locksmith, Cleaning, and Car Key Replacement from trusted local providers.
    </p>

    <p style="font-size:14px;color:#0e0e0e;padding-top:16px;">
      Here's what you can do:
    </p>

    <p style="font-size:14px;color:#0e0e0e;">
      1. <strong>Browse Services</strong> – Find the perfect service provider for your needs.<br />
      2. <strong>Book Instantly</strong> – Create job requests and get matched with qualified providers.<br />
      3. <strong>Track Progress</strong> – Monitor your bookings and communicate with providers.
    </p>

    <p style="font-size:14px;color:#0e0e0e;padding-top:16px;">
      <strong>Ready to get started?</strong>
    </p>

    <p style="font-size:14px;color:#0e0e0e;">
      Click below to log in and activate your customer account.
    </p>

    <p style="text-align:center;padding-top:16px;">
      <a href="${activationLink}" style="background-color:#0052cc;color:white;padding:12px 20px;border-radius:4px;text-decoration:none;">
        Log In to Your Swipped Account
      </a>
    </p>

    <p style="font-size:14px;color:#0e0e0e;padding-top:16px;">
      Have questions? Our support team is here to help! Just reply to this email or reach out to ${process.env.NEXT_PUBLIC_SUPPORT_EMAIL}.
    </p>

    <p style="font-size:14px;color:#0e0e0e;padding-top:16px;">
      Let's make your life easier,<br />
      The Swipped Team
    </p>
  `;
};

export const getShopOwnerActivationEmailTemplate = (name, activationLink) => {
  return `
    <p style="font-size:20px;color:#0e0e0e;"> Hi <b>${name},</b></p>

    <p style="font-size:14px;color:#0e0e0e;padding-top:16px;">
      Welcome to <strong>Swipped</strong> as a <strong>Shop Owner</strong>! Your shop is created and ready to set up.
    </p>

    <p style="font-size:14px;color:#0e0e0e;padding-top:16px;">
      Here's what you can do next:
    </p>

    <p style="font-size:14px;color:#0e0e0e;">
      1. <strong>Log In</strong> – Access your shop owner dashboard and manage your shop.<br />
      2. <strong>Set Up Shop</strong> – Set Shop Address and other details.<br />
      3. <strong>Add Products</strong> – Create and manage your shop's products.<br />
      4. <strong>Track Orders</strong> – View and manage incoming orders.<br />
      5. <strong>Manage Inventory</strong> – Update stock, pricing, and availability.
    </p>

    <p style="font-size:14px;color:#0e0e0e;padding-top:16px;">
      <strong>Activate your account</strong> to access your Shop Owner dashboard.
    </p>

    <p style="text-align:center;padding-top:16px;">
      <a href="${activationLink}" style="background-color:#0052cc;color:white;padding:12px 20px;border-radius:4px;text-decoration:none;">
        Activate and Go to Dashboard
      </a>
    </p>

    <p style="font-size:14px;color:#0e0e0e;padding-top:16px;">
      Need help? Reply to this email or contact us at ${process.env.NEXT_PUBLIC_SUPPORT_EMAIL}.
    </p>

    <p style="font-size:14px;color:#0e0e0e;padding-top:16px;">
      Wishing you great sales,<br />
      The Swipped Team
    </p>
  `;
};

export const getRestaurantActivationEmailTemplate = (name, activationLink) => {
  return `
    <p style="font-size:20px;color:#0e0e0e;"> Hi <b>${name},</b></p>

    <p style="font-size:14px;color:#0e0e0e;padding-top:16px;">
      Welcome to <strong>Swipped</strong> as a <strong>Restaurant Owner</strong>! Your restaurant is created and ready to set up.
    </p>

    <p style="font-size:14px;color:#0e0e0e;padding-top:16px;">
      Here's what you can do next:
    </p>

    <p style="font-size:14px;color:#0e0e0e;">
      1. <strong>Log In</strong> – Access your restaurant dashboard and manage your restaurant.<br />
      2. <strong>Set Up Restaurant</strong> – Set restaurant address, hours, and other details.<br />
      3. <strong>Add Menu Items</strong> – Create and manage your restaurant's menu items.<br />
      4. <strong>Track Orders</strong> – View and manage incoming orders from customers.<br />
      5. <strong>Manage Menu</strong> – Update menu items, pricing, and availability.
    </p>

    <p style="font-size:14px;color:#0e0e0e;padding-top:16px;">
      <strong>Important:</strong> Your restaurant account is currently inactive. After activation, an administrator will review and activate your restaurant to make it visible to customers.
    </p>

    <p style="font-size:14px;color:#0e0e0e;padding-top:16px;">
      <strong>Activate your account</strong> to access your Restaurant dashboard.
    </p>

    <p style="text-align:center;padding-top:16px;">
      <a href="${activationLink}" style="background-color:#0052cc;color:white;padding:12px 20px;border-radius:4px;text-decoration:none;">
        Activate and Go to Dashboard
      </a>
    </p>

    <p style="font-size:14px;color:#0e0e0e;padding-top:16px;">
      Need help? Reply to this email or contact us at ${process.env.NEXT_PUBLIC_SUPPORT_EMAIL}.
    </p>

    <p style="font-size:14px;color:#0e0e0e;padding-top:16px;">
      Wishing you great success,<br />
      The Swipped Team
    </p>
  `;
};