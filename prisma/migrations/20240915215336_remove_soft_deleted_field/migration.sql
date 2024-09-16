/*
  Warnings:

  - You are about to drop the column `softDeleted` on the `DreamMineGame` table. All the data in the column will be lost.
  - You are about to drop the column `softDeleted` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `softDeleted` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `softDeleted` on the `UserProfile` table. All the data in the column will be lost.
  - You are about to drop the column `softDeleted` on the `Wallet` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `DreamMineRules` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "DreamMineGame" DROP COLUMN "softDeleted";

-- AlterTable
ALTER TABLE "DreamMineRules" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Transaction" DROP COLUMN "softDeleted";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "softDeleted";

-- AlterTable
ALTER TABLE "UserProfile" DROP COLUMN "softDeleted";

-- AlterTable
ALTER TABLE "Wallet" DROP COLUMN "softDeleted";
