/*
  Warnings:

  - You are about to alter the column `email` on the `User` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(256)`.
  - You are about to alter the column `name` on the `User` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(256)`.
  - You are about to alter the column `avatar` on the `UserProfile` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(512)`.
  - You are about to alter the column `address` on the `Wallet` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(256)`.

*/
-- AlterTable
ALTER TABLE "User" ALTER COLUMN "email" SET DATA TYPE VARCHAR(256),
ALTER COLUMN "name" SET DATA TYPE VARCHAR(256);

-- AlterTable
ALTER TABLE "UserProfile" ALTER COLUMN "avatar" SET DATA TYPE VARCHAR(512);

-- AlterTable
ALTER TABLE "Wallet" ALTER COLUMN "address" SET DATA TYPE VARCHAR(256);
