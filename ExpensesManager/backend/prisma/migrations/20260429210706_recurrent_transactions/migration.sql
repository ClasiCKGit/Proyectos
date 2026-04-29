-- AlterTable
ALTER TABLE `transactions` ADD COLUMN `recurringTransactionId` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `recurring_transactions` (
    `id` VARCHAR(191) NOT NULL,
    `type` ENUM('income', 'expense') NOT NULL,
    `amount` DECIMAL(12, 2) NOT NULL,
    `description` VARCHAR(100) NOT NULL,
    `category` ENUM('housing', 'food', 'transport', 'health', 'entertainment', 'education', 'clothing', 'savings', 'other') NOT NULL,
    `notes` TEXT NULL,
    `recurrence` ENUM('none', 'daily', 'weekly', 'monthly', 'yearly') NOT NULL,
    `startDate` DATE NOT NULL,
    `endDate` DATE NULL,
    `nextDueDate` DATE NOT NULL,
    `lastRunAt` DATETIME(3) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `userId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `recurring_transactions_userId_isActive_idx`(`userId`, `isActive`),
    INDEX `recurring_transactions_nextDueDate_isActive_idx`(`nextDueDate`, `isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `recurring_transaction_tags` (
    `id` VARCHAR(191) NOT NULL,
    `tag` VARCHAR(50) NOT NULL,
    `recurringTransactionId` VARCHAR(191) NOT NULL,

    INDEX `recurring_transaction_tags_recurringTransactionId_idx`(`recurringTransactionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_recurringTransactionId_fkey` FOREIGN KEY (`recurringTransactionId`) REFERENCES `recurring_transactions`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `recurring_transactions` ADD CONSTRAINT `recurring_transactions_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `recurring_transaction_tags` ADD CONSTRAINT `recurring_transaction_tags_recurringTransactionId_fkey` FOREIGN KEY (`recurringTransactionId`) REFERENCES `recurring_transactions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
