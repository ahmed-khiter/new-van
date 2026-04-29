-- 08-16-2025
ALTER TABLE wallets
MODIFY COLUMN amount DECIMAL(10, 2) NULL DEFAULT (0.0)

-- 08-18-2025
ALTER TABLE documents
ADD COLUMN jobId VARCHAR(255) NULL,
ADD COLUMN category VARCHAR(255) NULL,
ADD COLUMN reasonOfRejection VARCHAR(255) NULL,
MODIFY COLUMN userId INT NOT NULL,
MODIFY COLUMN fileName VARCHAR(255) NULL,
MODIFY COLUMN status VARCHAR(255) NOT NULL DEFAULT("Waiting For Approval");


ALTER TABLE users
MODIFY COLUMN isFirstTime BOOLEAN NOT NULL DEFAULT true;


-- 08-20-2025

ALTER TABLE jobs
DROP COLUMN documentsRequired,
DROP COLUMN documentsUploaded;

ALTER TABLE documents
MODIFY COLUMN userId INT NULL;


-- 08-21-2025

ALTER TABLE jobs
ADD COLUMN storeName VARCHAR(255) NULL,
ADD COLUMN clickAndCollectIdNumber VARCHAR(50) NULL,
ADD COLUMN yourName VARCHAR(100) NULL,
ADD COLUMN contactNumber VARCHAR(20) NULL;


-- 08-26-2025

ALTER TABLE users
ADD COLUMN preferredLocale VARCHAR(5) NULL;


-- 08-28-2025
ALTER TABLE jobs ADD COLUMN pickupLat FLOAT NULL;
ALTER TABLE jobs ADD COLUMN pickupLng FLOAT NULL;
ALTER TABLE jobs ADD COLUMN dropOffLat FLOAT NULL;
ALTER TABLE jobs ADD COLUMN dropOffLng FLOAT NULL;
ALTER TABLE users ADD COLUMN latitude FLOAT NULL;
ALTER TABLE users ADD COLUMN longitude FLOAT NULL;



-- 09-01-2025
CREATE TABLE plans (
  plan_id      INT AUTO_INCREMENT PRIMARY KEY,
  name         VARCHAR(100) NOT NULL UNIQUE,
  description  TEXT,
  price        DECIMAL(10,2) NOT NULL,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE subscriptions (
  subscription_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id         INT NOT NULL,
  plan_id         INT NOT NULL,
  start_date      TIMESTAMP NOT NULL,
  end_date        TIMESTAMP NULL,
  amount_charged  DECIMAL(10,2) NULL,
  type            VARCHAR(50) NOT NULL DEFAULT 'monthly',
  status          VARCHAR(50) NOT NULL DEFAULT 'active',
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE transaction (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  transaction_id      VARCHAR(100) NOT NULL UNIQUE,
  user_id             INT NOT NULL,
  plan_id             INT NOT NULL,
  date                TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  amount              DECIMAL(10,2) NOT NULL,
  customer_profile_id VARCHAR(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO plans (name, description, price, created_at, updated_at)
VALUES 
  ('Monthly Access', '1-month access for service providers to accept and manage jobs.', 19.99, NOW(), NOW()),
  ('Half-Year Access', '6-month access with discounted pricing for service providers to accept jobs.', 99.99, NOW(), NOW()),
  ('Yearly Access', '12-month full access for service providers to accept unlimited jobs at the best value.', 179.99, NOW(), NOW());


-- 09-09-2025
ALTER TABLE transaction
ADD COLUMN job_id VARCHAR(255) NULL,
MODIFY COLUMN plan_id INT NULL,
ADD COLUMN type VARCHAR(255) NOT NULL DEFAULT 'payment';

ALTER TABLE jobs
ADD COLUMN createdById INT NULL;

-- 01-15-2025
-- Add visitor role support and job creator tracking
ALTER TABLE users
MODIFY COLUMN role VARCHAR(50) NOT NULL DEFAULT 'provider';

-- Add foreign key constraint for createdById in jobs table
ALTER TABLE jobs
ADD CONSTRAINT fk_jobs_created_by 
FOREIGN KEY (createdById) REFERENCES users(id) ON DELETE SET NULL;

-- Update transaction table to use 'sender' relation instead of 'provider'
-- (This is a schema change that was made in the Prisma model)
-- The transaction table already has the correct structure with user_id field

-- 12-09-2025
-- Add chat system tables
CREATE TABLE chats (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  jobId VARCHAR(36) NOT NULL UNIQUE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (jobId) REFERENCES jobs(id) ON DELETE CASCADE
) ENGINE=MyISAM AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE chat_participants (
  id INT AUTO_INCREMENT PRIMARY KEY,
  chatId VARCHAR(36) NOT NULL,
  userId INT NOT NULL,
  role VARCHAR(50) NOT NULL,
  joinedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  lastReadAt TIMESTAMP NULL,
  FOREIGN KEY (chatId) REFERENCES chats(id) ON DELETE CASCADE,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_chat_user (chatId, userId)
) ENGINE=MyISAM AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE messages (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  chatId VARCHAR(36) NOT NULL,
  senderId INT NOT NULL,
  content TEXT NOT NULL,
  messageType VARCHAR(50) NOT NULL DEFAULT 'text',
  metadata JSON NULL,
  isRead BOOLEAN NOT NULL DEFAULT FALSE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (chatId) REFERENCES chats(id) ON DELETE CASCADE,
  FOREIGN KEY (senderId) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=MyISAM AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13-09-2025
-- Add product management system
CREATE TABLE products (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  name VARCHAR(255) NOT NULL,
  description TEXT NULL,
  price DECIMAL(10,2) NOT NULL,
  image VARCHAR(500) NULL,
  category VARCHAR(100) NULL,
  isActive BOOLEAN NOT NULL DEFAULT TRUE,
  stock INT NOT NULL DEFAULT 0,
  weight FLOAT NULL,
  dimensions JSON NULL,
  pickupAddress VARCHAR(500) NULL,
  pickupCity VARCHAR(100) NULL,
  pickupPostCode VARCHAR(20) NULL,
  pickupLat FLOAT NULL,
  pickupLng FLOAT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  createdById INT NULL,
  FOREIGN KEY (createdById) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=MyISAM AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE product_orders (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  productId VARCHAR(36) NOT NULL,
  userId INT NOT NULL,
  jobId VARCHAR(36) NULL,
  quantity INT NOT NULL DEFAULT 1,
  totalProductPrice DECIMAL(10,2) NOT NULL,
  deliveryPrice DECIMAL(10,2) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  deliveryAddress VARCHAR(500) NULL,
  deliveryCity VARCHAR(100) NULL,
  deliveryPostCode VARCHAR(20) NULL,
  deliveryLat FLOAT NULL,
  deliveryLng FLOAT NULL,
  notes TEXT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (productId) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (jobId) REFERENCES jobs(id) ON DELETE SET NULL
) ENGINE=MyISAM AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE transaction
ADD COLUMN order_id VARCHAR(36) NULL;


-- 09-22-2025
CREATE TABLE IF NOT EXISTS shops (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  name VARCHAR(255) NOT NULL,
  image VARCHAR(500) NULL,
  address1 VARCHAR(500) NULL,
  address2 VARCHAR(500) NULL,
  city VARCHAR(100) NULL,
  postCode VARCHAR(20) NULL,
  latitude FLOAT NULL,
  longitude FLOAT NULL,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  createdById INT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


ALTER TABLE products
  ADD COLUMN shopId VARCHAR(36) NULL AFTER createdById;

-- 09-15-2025
CREATE TABLE cart (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  userId INT NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE cart_items (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  cartId VARCHAR(36) NOT NULL,
  productId VARCHAR(36) NULL,
  quantity INT NOT NULL DEFAULT 1,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_cart_product (cartId, productId),
  FOREIGN KEY (cartId) REFERENCES cart(id) ON DELETE CASCADE,
  FOREIGN KEY (productId) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE product_orders
  ADD COLUMN cartId VARCHAR(36) NULL AFTER id,
  ADD COLUMN totalCartPrice DECIMAL(10,2) NOT NULL DEFAULT 0.00 AFTER cartId,
  DROP COLUMN productId,
  DROP COLUMN quantity,
  DROP COLUMN totalProductPrice,
  ADD FOREIGN KEY (cartId) REFERENCES cart(id) ON DELETE SET NULL;

-- 09-16-2025
CREATE TABLE favorite_products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  productId VARCHAR(36) NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_product (userId, productId),
  INDEX idx_userId (userId),
  INDEX idx_productId (productId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE services (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  name VARCHAR(255) NOT NULL,
  description TEXT NULL,
  price DECIMAL(10,2) NOT NULL,
  base_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  isActive BOOLEAN NOT NULL DEFAULT TRUE,
  legacyKey VARCHAR(191) NULL,
  homeSection VARCHAR(32) NULL,
  sortOrder INT NOT NULL DEFAULT 0,
  cardTitle VARCHAR(255) NULL,
  listImage TEXT NULL,
  sliderImage TEXT NULL,
  previewVideo TEXT NULL,
  previewPoster TEXT NULL,
  imageUrl VARCHAR(512) NULL,
  locationFilter JSON NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY services_legacyKey_key (legacyKey)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO services (
  name,
  description,
  price,
  base_price,
  legacyKey,
  homeSection,
  sortOrder,
  cardTitle,
  imageUrl
)
VALUES
  ('Click & Collect Delivery', 'Pickup and collection of online orders from stores', 30.00, 15.00, 'Click & Collect', 'booking', 8, 'Click & Collect Delivery', '/booking?service=Click%20%26%20Collect'),
  ('Courier', 'Van delivery and transportation services', 50.00, 25.00, 'Van', 'booking', 9, 'Deliveries & Couriers', '/booking?service=Van'),
  ('Breakdown Assistance', 'Vehicle recovery and towing services', 80.00, 40.00, 'Recovery', 'booking', 3, 'Breakdown Assistance', '/booking?service=Recovery'),
  ('Professional Cleaning', 'Professional Professional Cleaning', 40.00, 20.00, 'Cleaning', 'booking', 4, 'Professional Cleaning', '/booking?service=Cleaning'),
  ('Locksmith', '24/7 locksmith services', 60.00, 30.00, 'Locksmith', 'booking', 5, 'Lock & Key Replacement', '/booking?service=Locksmith'),
  ('Mobile car key replacement', 'Car key replacement and programming', 100.00, 50.00, 'Car Key Replacement', 'booking', 6, 'Mobile car key replacement', '/booking?service=Car%20Key%20Replacement'),
  ('Rubbish removals', 'Furniture and rubbish removal', 70.00, 35.00, 'Removals', 'booking', 7, 'Rubbish Removals', '/booking?service=Removals');

-- 10-01-2025
ALTER TABLE users
ADD COLUMN deletedAt TIMESTAMP NULL;

-- 10-02-2025
ALTER TABLE shops
ADD COLUMN status VARCHAR(20) DEFAULT 'inactive';

-- 10-02-2025
ALTER TABLE users
ADD COLUMN country VARCHAR(255) NULL;

-- 10-02-2025
ALTER TABLE shops
ADD COLUMN country VARCHAR(255) NULL;

-- 10-03-2025
ALTER TABLE users
ADD COLUMN status VARCHAR(20) DEFAULT 'active';

-- 10-04-2025
ALTER TABLE users
ADD COLUMN phone VARCHAR(20) NULL;

ALTER TABLE shops
ADD COLUMN phone VARCHAR(20) NULL;

-- 10-05-2025
ALTER TABLE services
ADD COLUMN base_price DECIMAL(10,2) NOT NULL DEFAULT 0.00;

-- 10-06-2025
ALTER TABLE jobs
ADD COLUMN howManyBathrooms INT NULL;

ALTER TABLE `users` 
ADD COLUMN `profilePicture` VARCHAR(500) NULL 
AFTER `preferredLocale`;

-- 10-07-2025
-- Add feedbacks table
CREATE TABLE feedbacks (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  feedback TEXT NULL,
  rating INT NULL,
  itemType VARCHAR(255) NULL,
  itemId VARCHAR(36) NULL,
  status VARCHAR(255) NOT NULL DEFAULT 'pending',
  userId INT NULL,
  feedbackAt TIMESTAMP NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- 10-23-2025
ALTER TABLE users
ADD COLUMN createdById INT NULL;

-- 10-27-2025
ALTER TABLE jobs
ADD COLUMN completedAt TIMESTAMP NULL;

-- 10-27-2025

ALTER TABLE shops ADD COLUMN category VARCHAR(255) NULL;

-- 01-29-2025 
CREATE TABLE IF NOT EXISTS `categories` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `image` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Remove unique constraint on categories name
ALTER TABLE `categories`
DROP INDEX `categories_name_key`;

-- 10-30-2025
-- Remove isOpen column (now handled by shop_metadata.openingHours)
ALTER TABLE shops
DROP COLUMN isOpen;

-- Add position field to categories for sorting
ALTER TABLE categories
ADD COLUMN position INT NOT NULL DEFAULT 0;

-- Vehicle Types table for Courier pricing
CREATE TABLE vehicle_types (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  name VARCHAR(255) NOT NULL,
  serviceId VARCHAR(36) NOT NULL,
  pricePerMile DECIMAL(10,2) NOT NULL,
  callOutCharge DECIMAL(10,2) NOT NULL,
  isActive BOOLEAN NOT NULL DEFAULT TRUE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_vehicle_service (name, serviceId),
  INDEX idx_serviceId (serviceId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Delivery System Implementation - Add delivery tracking fields
-- Add fields to product_orders table for delivery system
ALTER TABLE product_orders
ADD COLUMN shopConfirmedAt TIMESTAMP NULL,
ADD COLUMN shopConfirmedById INT NULL,
ADD COLUMN deliveryProviderId INT NULL,
ADD COLUMN deliveryStatus VARCHAR(50) NOT NULL DEFAULT 'pending',
ADD COLUMN providerAcceptedAt TIMESTAMP NULL,
ADD COLUMN deliveredAt TIMESTAMP NULL;

-- Add foreign key constraints for product_orders
ALTER TABLE product_orders
ADD CONSTRAINT fk_product_orders_shop_confirmed_by 
FOREIGN KEY (shopConfirmedById) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE product_orders
ADD CONSTRAINT fk_product_orders_delivery_provider 
FOREIGN KEY (deliveryProviderId) REFERENCES users(id) ON DELETE SET NULL;

-- Add fields to jobs table for delivery system
ALTER TABLE jobs
ADD COLUMN deliveryOrderId VARCHAR(36) NULL,
ADD COLUMN notificationSentAt TIMESTAMP NULL;



-- 11-06-2025
CREATE TABLE IF NOT EXISTS `notifications` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `userId` INT NOT NULL,
  `type` VARCHAR(50) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `message` TEXT NULL,
  `status` VARCHAR(20) NOT NULL DEFAULT 'unread',
  `readAt` DATETIME NULL,
  `metadata` JSON NULL,
  `createdAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_user_status` (`userId`, `status`),
  INDEX `idx_user_created` (`userId`, `createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- 11-07-2025
CREATE TABLE IF NOT EXISTS `provider_vehicles` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `userId` INT NOT NULL,
  `vehicleTypeId` VARCHAR(255) NOT NULL,
  UNIQUE KEY `unique_user_vehicle` (`userId`, `vehicleTypeId`),
  INDEX `idx_user_vehicle` (`userId`, `vehicleTypeId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


ALTER TABLE product_orders
ADD COLUMN shopId VARCHAR(36) NULL AFTER id,
ADD FOREIGN KEY (shopId) REFERENCES shops(id) ON DELETE SET NULL;


-- 11-10-2025
CREATE TABLE `user_usage` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `userId` INT NOT NULL,
  `featureName` VARCHAR(255) NOT NULL,
  `usedValue` INT NOT NULL DEFAULT 0,
  `limitValue` INT NOT NULL,
  UNIQUE KEY `unique_user_feature` (`userId`, `featureName`),
  INDEX `idx_user_feature` (`userId`, `featureName`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `plan_features` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `planId` INT NOT NULL,
  `featureName` VARCHAR(255) NOT NULL,
  `limitValue` INT NOT NULL,
  UNIQUE KEY `unique_plan_feature` (`planId`, `featureName`),
  INDEX `idx_plan_feature` (`planId`, `featureName`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE plans
ADD COLUMN plan_region VARCHAR(255) NOT NULL DEFAULT 'united_kingdom',
ADD COLUMN trial_days INT NULL;

-- 11-11-2025
ALTER TABLE wallets
CHANGE COLUMN providerId userId INT NOT NULL;

ALTER TABLE product_orders
ADD COLUMN shopOwnerPaymentStatus VARCHAR(50) NULL;

ALTER TABLE jobs
ADD COLUMN providerPaymentStatus VARCHAR(50) NULL;




ALTER TABLE `categories` 
ADD COLUMN `type` VARCHAR(20) NULL AFTER `image`;

-- 11-11-2025

ALTER TABLE shops
ADD COLUMN type VARCHAR(20) NOT NULL DEFAULT 'shop' COMMENT 'shop or restaurant' AFTER category;

ALTER TABLE shops
ADD COLUMN cuisine VARCHAR(255) NULL  AFTER type,
ADD COLUMN rating FLOAT NULL DEFAULT 0.0  AFTER cuisine,
ADD COLUMN deliveryTime VARCHAR(50) NULL AFTER rating,
ADD COLUMN minimumOrder DECIMAL(10,2) NULL  AFTER deliveryTime,
ADD COLUMN acceptsReservations BOOLEAN NOT NULL DEFAULT FALSE  AFTER minimumOrder;

UPDATE shops SET type = 'shop' WHERE type IS NULL OR type = '';

ALTER TABLE products
ADD COLUMN cuisine VARCHAR(255) NULL  AFTER pickupLng,
ADD COLUMN isAvailable BOOLEAN NOT NULL DEFAULT TRUE  AFTER cuisine,
ADD COLUMN preparationTime INT NULL  AFTER isAvailable,
ADD COLUMN allergens JSON NULL  AFTER preparationTime,
ADD COLUMN dietaryInfo JSON NULL  AFTER allergens,
ADD COLUMN calories INT NULL  AFTER dietaryInfo;

-- 11-15-2025
CREATE TABLE IF NOT EXISTS `luggage_items` (
  `id` VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  `name` VARCHAR(255) NOT NULL UNIQUE,
  `price` DECIMAL(10,2) NOT NULL,
  `isActive` BOOLEAN NOT NULL DEFAULT TRUE,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `luggage_items_name_key` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11-16-2025
CREATE TABLE IF NOT EXISTS `luggage_locations` (
  `id` VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  `address1` VARCHAR(500) NOT NULL,
  `city` VARCHAR(100) NULL,
  `postCode` VARCHAR(20) NULL,
  `latitude` FLOAT NOT NULL,
  `longitude` FLOAT NOT NULL,
  `isActive` BOOLEAN NOT NULL DEFAULT TRUE,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `jobs`
ADD COLUMN `deliveryMethod` VARCHAR(50) NULL COMMENT 'dropoff or collection for luggage bookings' AFTER `providerPaymentStatus`;

-- Fix notes column length issue - change from VARCHAR(191) to TEXT
ALTER TABLE `jobs`
MODIFY COLUMN `notes` TEXT NULL;


-- 11-18-2025
CREATE TABLE `customer_profile` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `userId` INT NOT NULL,
  `stripeCustomerId` VARCHAR(255) NOT NULL,
  `paymentMethodId` VARCHAR(255) NOT NULL,
  `lastFourDigit` VARCHAR(4) NOT NULL,
  `cardBrand` VARCHAR(255) NOT NULL,
  `amount` DECIMAL(10,2) NULL,
  `default` BOOLEAN NOT NULL DEFAULT FALSE,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE `stripe_connect` (
  `id` VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  `userId` INT NOT NULL,
  `accountId` VARCHAR(255) NOT NULL,
  `accountStatus` VARCHAR(255) NOT NULL,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
-- 11-19-2025
ALTER TABLE `luggage_items`
ADD COLUMN `type` VARCHAR(50) NOT NULL DEFAULT 'luggage' AFTER `name`;

-- 11-25-2025
INSERT INTO users (
  firstName,
  lastName,
  email,
  password,
  role,
  isActive,
  isFirstTime,
  status,
  createdAt,
  updatedAt
) VALUES (
  'Default',
  'Affiliate',
  'affiliate@example.com',
  '$2a$10$CKftduHKFZuIl1z6tz5xS.QKhgc3.4KfHNHTX/ex7A7HvHLbmErU6',
  'affiliate',
  true,
  false,
  'active',
  NOW(),
  NOW()
);

-- 11-26-2025
-- Book a Table System
CREATE TABLE IF NOT EXISTS `reservations` (
  `id` VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  `restaurantId` VARCHAR(36) NOT NULL,
  `customerId` INT NOT NULL,
  `numberOfGuests` INT NOT NULL,
  `reservationDate` DATETIME NOT NULL,
  `reservationTime` VARCHAR(10) NOT NULL,
  `customerName` VARCHAR(255) NOT NULL,
  `customerPhone` VARCHAR(20) NOT NULL,
  `customerEmail` VARCHAR(255) NOT NULL,
  `status` VARCHAR(50) NOT NULL DEFAULT 'pending',
  `depositAmount` DECIMAL(10,2) NOT NULL DEFAULT 1.00,
  `depositPaid` BOOLEAN NOT NULL DEFAULT FALSE,
  `depositRefunded` BOOLEAN NOT NULL DEFAULT FALSE,
  `paymentIntentId` VARCHAR(255) NULL ,
  `refundId` VARCHAR(255) NULL,
  `notes` TEXT NULL,
  `rejectedAt` DATETIME NULL,
  `acceptedAt` DATETIME NULL,
  `completedAt` DATETIME NULL,
  `cancelledAt` DATETIME NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_restaurant_status` (`restaurantId`, `status`),
  INDEX `idx_customer` (`customerId`),
  INDEX `idx_reservation_date` (`reservationDate`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE shops
ADD COLUMN acceptsReservations BOOLEAN NOT NULL DEFAULT FALSE AFTER minimumOrder;

-- 12-04-2025
ALTER TABLE shops
ADD COLUMN shop_metadata JSON NULL;

-- 12-05-2025
CREATE TABLE IF NOT EXISTS `shop_gallery` (
  `id` VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  `shopId` VARCHAR(36) NOT NULL,
  `image` VARCHAR(500) NOT NULL,
  `caption` VARCHAR(255) NULL,
  `type` VARCHAR(20) NOT NULL DEFAULT 'gallery',
  `productId` VARCHAR(36) NULL,
  `order` INT NOT NULL DEFAULT 0,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_shopId` (`shopId`),
  INDEX `idx_shopId_order` (`shopId`, `order`),
  INDEX `idx_shopId_type` (`shopId`, `type`),
  INDEX `idx_type_productId` (`type`, `productId`),
  FOREIGN KEY (`shopId`) REFERENCES `shops`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12-06-2025
ALTER TABLE `products`
ADD COLUMN `menuCategory` VARCHAR(255) NULL AFTER `cuisine`;

-- 12-26-2025
-- Create reports table for issue reporting system
CREATE TABLE IF NOT EXISTS `reports` (
  `id` VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  `jobId` VARCHAR(36) NOT NULL,
  `issueType` VARCHAR(255) NOT NULL,
  `description` TEXT NOT NULL,
  `desiredAction` VARCHAR(50) NULL,
  `notifyByEmail` BOOLEAN NOT NULL DEFAULT TRUE,
  `notifyInApp` BOOLEAN NOT NULL DEFAULT TRUE,
  `evidenceFiles` JSON NULL COMMENT 'Array of file paths',
  `reportedById` INT NOT NULL,
  `reportedByRole` VARCHAR(50) NOT NULL DEFAULT 'visitor,
  `status` VARCHAR(50) NOT NULL DEFAULT 'pending' COMMENT 'pending, in_review, resolved, rejected',
  `adminNotes` TEXT NULL,
  `resolvedAt` DATETIME NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_jobId` (`jobId`),
  INDEX `idx_reportedById` (`reportedById`),
  INDEX `idx_status` (`status`),
  INDEX `idx_createdAt` (`createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add foreign key constraints separately (run these after confirming jobs and users tables exist)
-- If you get an error that the table doesn't exist, make sure jobs and users tables are created first
ALTER TABLE `reports`
ADD CONSTRAINT `fk_reports_jobId` FOREIGN KEY (`jobId`) REFERENCES `jobs`(`id`) ON DELETE CASCADE;

ALTER TABLE `reports`
ADD CONSTRAINT `fk_reports_reportedById` FOREIGN KEY (`reportedById`) REFERENCES `users`(`id`) ON DELETE CASCADE;

ALTER TABLE `jobs` 
ADD COLUMN `requireUrgent` BOOLEAN NOT NULL DEFAULT false;


-- 01-27-2026
ALTER TABLE transaction
ADD COLUMN cardBrand VARCHAR(50) NULL,
ADD COLUMN lastFourDigit VARCHAR(4) NULL;

ALTER TABLE jobs
ADD COLUMN tip FLOAT NULL;

ALTER TABLE product_orders
ADD COLUMN tip FLOAT NULL;


-- 02-12-2026
-- Make jobId optional and add type field to chats for support chat feature
ALTER TABLE chats
MODIFY COLUMN jobId VARCHAR(191) NULL,
ADD COLUMN type VARCHAR(50) NOT NULL DEFAULT 'job';

-- 02-20-2026
-- Add subcategories JSON field to categories for nested subcategory support
ALTER TABLE `categories`
ADD COLUMN `subcategories` JSON NULL AFTER `type`;

-- Add subcategory field to products table
ALTER TABLE `products`
ADD COLUMN `subcategory` VARCHAR(255) NULL AFTER `category`;

-- Add variants JSON field to products for product variant support
ALTER TABLE `products`
ADD COLUMN `variants` JSON NULL AFTER `calories`;

-- Add metadata JSON field to cart_items for variant selection storage
ALTER TABLE `cart_items`
ADD COLUMN `metadata` JSON NULL AFTER `quantity`;

-- 02-23-2026
-- Add images JSON field to products for multi-image support (up to 8 photos per listing)
ALTER TABLE `products`
ADD COLUMN `images` JSON NULL AFTER `image`;

-- 03-09-2026
-- Affiliate onboarding + commission tracking

-- 1) Rename legacy role to new affiliate role
UPDATE `users`
SET `role` = 'affiliate'
WHERE `role` = 'super-admin';

-- 2) Link businesses (shops/restaurants) to affiliate account
ALTER TABLE `shops`
ADD COLUMN `affiliateId` INT NULL AFTER `createdById`,
ADD INDEX `idx_shops_affiliateId` (`affiliateId`);

-- 3) Track affiliate commission on each order
ALTER TABLE `product_orders`
ADD COLUMN `affiliateId` INT NULL AFTER `deliveryProviderId`,
ADD COLUMN `affiliateCommissionRate` DECIMAL(5,2) NULL AFTER `affiliateId`,
ADD COLUMN `affiliateCommissionAmount` DECIMAL(10,2) NULL AFTER `affiliateCommissionRate`,
ADD COLUMN `affiliateCommissionStatus` VARCHAR(50) NULL AFTER `affiliateCommissionAmount`,
ADD COLUMN `affiliateCommissionPaidAt` DATETIME NULL AFTER `affiliateCommissionStatus`,
ADD INDEX `idx_product_orders_affiliateId` (`affiliateId`),
ADD INDEX `idx_product_orders_affiliateCommissionStatus` (`affiliateCommissionStatus`),
ADD CONSTRAINT `fk_product_orders_affiliateId`
  FOREIGN KEY (`affiliateId`) REFERENCES `users`(`id`)
  ON DELETE SET NULL
  ON UPDATE CASCADE;

-- 4) Global commission settings:
-- platformCommissionPercentage: e.g. 15
-- affiliateSharePercentage: e.g. 10 (share of platform commission)
CREATE TABLE IF NOT EXISTS `affiliate_settings` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `platformCommissionPercentage` DECIMAL(5,2) NOT NULL DEFAULT 15.00,
  `affiliateSharePercentage` DECIMAL(5,2) NOT NULL DEFAULT 10.00,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed default config row if table is empty
INSERT INTO `affiliate_settings` (`platformCommissionPercentage`, `affiliateSharePercentage`)
SELECT 15.00, 10.00
WHERE NOT EXISTS (SELECT 1 FROM `affiliate_settings`);

-- 03-15-2026
-- Rating/review system: link feedbacks to business/order/booking + business replies
ALTER TABLE `feedbacks`
ADD COLUMN `businessId` VARCHAR(36) NULL AFTER `itemId`,
ADD COLUMN `orderId` VARCHAR(36) NULL AFTER `businessId`,
ADD COLUMN `bookingId` VARCHAR(36) NULL AFTER `orderId`,
ADD COLUMN `businessReply` TEXT NULL AFTER `bookingId`,
ADD COLUMN `repliedAt` DATETIME NULL AFTER `businessReply`,
ADD INDEX `idx_feedbacks_business_status` (`businessId`, `status`),
ADD INDEX `idx_feedbacks_orderId` (`orderId`),
ADD INDEX `idx_feedbacks_bookingId` (`bookingId`);



