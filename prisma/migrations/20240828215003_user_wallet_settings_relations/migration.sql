/*
  Warnings:

  - You are about to drop the column `activated` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `receiveNotifications` on the `UserSetting` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId]` on the table `UserSetting` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[ownerId]` on the table `Wallet` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `ownerId` to the `Wallet` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "activated",
ALTER COLUMN "email" DROP NOT NULL;

-- AlterTable
ALTER TABLE "UserSetting" DROP COLUMN "receiveNotifications";

-- AlterTable
ALTER TABLE "Wallet" ADD COLUMN     "ownerId" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "UserSetting_userId_key" ON "UserSetting"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Wallet_ownerId_key" ON "Wallet"("ownerId");

-- AddForeignKey
ALTER TABLE "UserSetting" ADD CONSTRAINT "UserSetting_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Wallet" ADD CONSTRAINT "Wallet_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
