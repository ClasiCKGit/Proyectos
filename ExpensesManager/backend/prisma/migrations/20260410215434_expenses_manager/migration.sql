-- CreateTable
CREATE TABLE `transactions` (
    `id` VARCHAR(191) NOT NULL,
    `type` ENUM('income', 'expense') NOT NULL,
    `amount` DECIMAL(12, 2) NOT NULL,
    `description` VARCHAR(100) NOT NULL,
    `category` ENUM('housing', 'food', 'transport', 'health', 'entertainment', 'education', 'clothing', 'savings', 'other') NOT NULL,
    `date` DATE NOT NULL,
    `notes` TEXT NULL,
    `recurrence` ENUM('none', 'daily', 'weekly', 'monthly', 'yearly') NOT NULL DEFAULT 'none',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `transactions_date_idx`(`date`),
    INDEX `transactions_type_idx`(`type`),
    INDEX `transactions_category_idx`(`category`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `transaction_tags` (
    `id` VARCHAR(191) NOT NULL,
    `tag` VARCHAR(50) NOT NULL,
    `transactionId` VARCHAR(191) NOT NULL,

    INDEX `transaction_tags_transactionId_idx`(`transactionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `budgets` (
    `id` VARCHAR(191) NOT NULL,
    `category` ENUM('housing', 'food', 'transport', 'health', 'entertainment', 'education', 'clothing', 'savings', 'other') NOT NULL,
    `limit` DECIMAL(12, 2) NOT NULL,
    `period` ENUM('monthly', 'yearly') NOT NULL DEFAULT 'monthly',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `budgets_category_key`(`category`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `savings_goals` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `targetAmount` DECIMAL(12, 2) NOT NULL,
    `currentAmount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `deadline` DATE NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `transaction_tags` ADD CONSTRAINT `transaction_tags_transactionId_fkey` FOREIGN KEY (`transactionId`) REFERENCES `transactions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
