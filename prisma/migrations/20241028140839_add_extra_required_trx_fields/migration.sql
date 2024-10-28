/*
  Warnings:

  - The values [SEPOLIA_ETH] on the enum `TokensEnum` will be removed. If these variants are still used in the database, this will fail.

*/
-- CreateEnum
CREATE TYPE "TransactionTypeEnum" AS ENUM ('INGAME', 'WITHDRWAL', 'DEPOSIT');

-- AlterEnum
BEGIN;
CREATE TYPE "TokensEnum_new" AS ENUM ('SOL', 'ETH', 'USDC', 'USDT', 'WUSDC');
ALTER TABLE "BlockchainLog" ALTER COLUMN "token" DROP DEFAULT;
ALTER TABLE "DreamMineGame" ALTER COLUMN "token" DROP DEFAULT;
ALTER TABLE "Transaction" ALTER COLUMN "token" DROP DEFAULT;
ALTER TABLE "Contract" ALTER COLUMN "token" TYPE "TokensEnum_new" USING ("token"::text::"TokensEnum_new");
ALTER TABLE "Transaction" ALTER COLUMN "token" TYPE "TokensEnum_new" USING ("token"::text::"TokensEnum_new");
ALTER TABLE "DreamMineGame" ALTER COLUMN "token" TYPE "TokensEnum_new" USING ("token"::text::"TokensEnum_new");
ALTER TABLE "BlockchainLog" ALTER COLUMN "token" TYPE "TokensEnum_new" USING ("token"::text::"TokensEnum_new");
ALTER TYPE "TokensEnum" RENAME TO "TokensEnum_old";
ALTER TYPE "TokensEnum_new" RENAME TO "TokensEnum";
DROP TYPE "TokensEnum_old";
ALTER TABLE "BlockchainLog" ALTER COLUMN "token" SET DEFAULT 'USDT';
ALTER TABLE "DreamMineGame" ALTER COLUMN "token" SET DEFAULT 'USDC';
ALTER TABLE "Transaction" ALTER COLUMN "token" SET DEFAULT 'USDC';
COMMIT;

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "type" "TransactionTypeEnum" NOT NULL DEFAULT 'INGAME';
