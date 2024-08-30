/*
  Warnings:

  - The `status` column on the `Transaction` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('SUCCESSFUL', 'FAILED', 'REVERTED', 'PENDING');

-- AlterTable
ALTER TABLE "Transaction" DROP COLUMN "status",
ADD COLUMN     "status" "TransactionStatus" NOT NULL DEFAULT 'PENDING',
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "name" DROP DEFAULT,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "UserProfile" ALTER COLUMN "updatedAt" DROP DEFAULT,
ALTER COLUMN "avatar" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Wallet" ALTER COLUMN "updatedAt" DROP DEFAULT;
