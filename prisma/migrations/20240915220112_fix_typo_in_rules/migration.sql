/*
  Warnings:

  - You are about to drop the column `minBetAmont` on the `DreamMineRules` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "DreamMineRules" DROP COLUMN "minBetAmont",
ADD COLUMN     "minBetAmount" DOUBLE PRECISION;
