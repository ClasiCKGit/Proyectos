-- AlterTable
ALTER TABLE `transactions` ADD COLUMN `savingsGoalId` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_savingsGoalId_fkey` FOREIGN KEY (`savingsGoalId`) REFERENCES `savings_goals`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
