/*
  Warnings:

  - You are about to drop the column `betToken` on the `DreamMineGame` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "DreamMineGame" DROP COLUMN "betToken",
ADD COLUMN     "token" "TokensEnum" NOT NULL DEFAULT 'USDC';
