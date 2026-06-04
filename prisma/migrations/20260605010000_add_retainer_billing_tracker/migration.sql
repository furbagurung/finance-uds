-- AlterTable
ALTER TABLE `transaction` ADD COLUMN `retainerBillingId` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `RetainerBilling` (
    `id` VARCHAR(191) NOT NULL,
    `projectId` VARCHAR(191) NOT NULL,
    `clientId` VARCHAR(191) NULL,
    `branchId` VARCHAR(191) NULL,
    `month` INTEGER NOT NULL,
    `year` INTEGER NOT NULL,
    `fiscalYear` VARCHAR(191) NULL,
    `expectedAmount` DECIMAL(12, 2) NOT NULL,
    `receivedAmount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `pendingAmount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `currency` VARCHAR(191) NULL,
    `dueDate` DATETIME(3) NULL,
    `paidDate` DATETIME(3) NULL,
    `status` ENUM('PENDING', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'WAIVED') NOT NULL DEFAULT 'PENDING',
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `RetainerBilling_projectId_month_year_key`(`projectId`, `month`, `year`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Transaction` ADD CONSTRAINT `Transaction_retainerBillingId_fkey` FOREIGN KEY (`retainerBillingId`) REFERENCES `RetainerBilling`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RetainerBilling` ADD CONSTRAINT `RetainerBilling_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RetainerBilling` ADD CONSTRAINT `RetainerBilling_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `Client`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RetainerBilling` ADD CONSTRAINT `RetainerBilling_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `Branch`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
