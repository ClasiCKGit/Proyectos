-- AlterTable
ALTER TABLE `transactions` MODIFY `category` ENUM('housing', 'food', 'transport', 'health', 'entertainment', 'education', 'clothing', 'savings', 'other') NULL;
