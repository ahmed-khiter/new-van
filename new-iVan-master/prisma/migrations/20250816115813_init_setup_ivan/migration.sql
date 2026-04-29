-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `firstName` VARCHAR(191) NOT NULL,
    `lastName` VARCHAR(191) NULL,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NULL,
    `role` VARCHAR(191) NOT NULL DEFAULT 'provider',
    `resetToken` VARCHAR(191) NULL,
    `activationToken` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT false,
    `isFirstTime` BOOLEAN NOT NULL DEFAULT false,
    `isDeleted` BOOLEAN NULL DEFAULT false,
    `settings` JSON NULL,
    `address1` VARCHAR(191) NULL,
    `address2` VARCHAR(191) NULL,
    `city` VARCHAR(191) NULL,
    `postCode` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `jobs` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `notes` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'active',
    `distance` DOUBLE NULL,
    `price` DOUBLE NULL,
    `paymentTime` VARCHAR(191) NULL,
    `vanSize` VARCHAR(191) NULL,
    `movingItem` VARCHAR(191) NULL,
    `isHelpLoading` BOOLEAN NOT NULL DEFAULT false,
    `isTwoMenRequired` BOOLEAN NOT NULL DEFAULT false,
    `pickupPostCode` VARCHAR(191) NULL,
    `pickupAddressLine1` VARCHAR(191) NULL,
    `pickupAddressLine2` VARCHAR(191) NULL,
    `pickupCity` VARCHAR(191) NULL,
    `pickupDate` DATETIME(3) NULL,
    `pickupFixedTime` DATETIME(3) NULL,
    `isPickupTimeFlexible` BOOLEAN NOT NULL DEFAULT false,
    `earliestPickupTime` DATETIME(3) NULL,
    `latestPickupTime` DATETIME(3) NULL,
    `isPickupASAP` BOOLEAN NOT NULL DEFAULT false,
    `dropOffPostCode` VARCHAR(191) NULL,
    `dropOffAddressLine1` VARCHAR(191) NULL,
    `dropOffAddressLine2` VARCHAR(191) NULL,
    `dropOffCity` VARCHAR(191) NULL,
    `dropOffDate` DATETIME(3) NULL,
    `dropOffFixedTime` DATETIME(3) NULL,
    `isDropOffTimeFlexible` BOOLEAN NOT NULL DEFAULT false,
    `earliestDropOffTime` DATETIME(3) NULL,
    `latestDropOffTime` DATETIME(3) NULL,
    `isDropOffASAP` BOOLEAN NOT NULL DEFAULT false,
    `howManyItems` INTEGER NULL,
    `typeOfKey` VARCHAR(191) NULL,
    `typeOfLock` VARCHAR(191) NULL,
    `typeOfPlace` VARCHAR(191) NULL,
    `make` VARCHAR(191) NULL,
    `model` VARCHAR(191) NULL,
    `year` INTEGER NULL,
    `doesCarTurnOn` BOOLEAN NOT NULL DEFAULT false,
    `howManyRooms` INTEGER NULL,
    `howManyHours` INTEGER NULL,
    `hasCleaningProducts` BOOLEAN NOT NULL DEFAULT false,
    `hasLogBook` BOOLEAN NOT NULL DEFAULT false,
    `hasCarKey` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `documentsRequired` JSON NULL,
    `documentsUploaded` JSON NULL,
    `acceptedById` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `documents` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'Awaiting approval',
    `userId` VARCHAR(191) NOT NULL,
    `fileName` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `wallets` (
    `id` VARCHAR(191) NOT NULL,
    `accountHolderName` VARCHAR(191) NULL,
    `accountNumber` VARCHAR(191) NULL,
    `sortCode` VARCHAR(191) NULL,
    `providerId` INTEGER NOT NULL,
    `default` BOOLEAN NOT NULL DEFAULT false,
    `amount` DECIMAL(10, 2) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `jobs` ADD CONSTRAINT `jobs_acceptedById_fkey` FOREIGN KEY (`acceptedById`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `wallets` ADD CONSTRAINT `wallets_providerId_fkey` FOREIGN KEY (`providerId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
