/*
  Warnings:

  - You are about to drop the column `isReverted` on the `BlockchainLog` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "BlockchainLog" DROP COLUMN "isReverted",
ADD COLUMN     "successful" BOOLEAN NOT NULL DEFAULT true;
