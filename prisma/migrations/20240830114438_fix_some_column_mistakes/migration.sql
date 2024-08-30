/*
  Warnings:

  - You are about to drop the column `deletedAt` on the `User` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "DreamMineRecords_userId_key";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "deletedAt",
ADD COLUMN     "softDeleted" BOOLEAN NOT NULL DEFAULT false;
