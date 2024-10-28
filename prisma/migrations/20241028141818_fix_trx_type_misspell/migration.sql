/*
  Warnings:

  - The values [WITHDRWAL] on the enum `TransactionTypeEnum` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "TransactionTypeEnum_new" AS ENUM ('INGAME', 'WITHDRAWAL', 'DEPOSIT');
ALTER TABLE "Transaction" ALTER COLUMN "type" DROP DEFAULT;
ALTER TABLE "Transaction" ALTER COLUMN "type" TYPE "TransactionTypeEnum_new" USING ("type"::text::"TransactionTypeEnum_new");
ALTER TYPE "TransactionTypeEnum" RENAME TO "TransactionTypeEnum_old";
ALTER TYPE "TransactionTypeEnum_new" RENAME TO "TransactionTypeEnum";
DROP TYPE "TransactionTypeEnum_old";
ALTER TABLE "Transaction" ALTER COLUMN "type" SET DEFAULT 'INGAME';
COMMIT;
