/*
  Warnings:

  - You are about to drop the column `depositTrxId` on the `BlockchainLog` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "BlockchainLog" DROP CONSTRAINT "BlockchainLog_depositTrxId_fkey";

-- AlterTable
ALTER TABLE "BlockchainLog" DROP COLUMN "depositTrxId",
ADD COLUMN     "transactionId" BIGINT;

-- AddForeignKey
ALTER TABLE "BlockchainLog" ADD CONSTRAINT "BlockchainLog_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;
