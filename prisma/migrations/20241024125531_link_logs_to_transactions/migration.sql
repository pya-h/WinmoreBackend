/*
  Warnings:

  - Added the required column `depositTrxId` to the `BlockchainLog` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "BlockchainLog" ADD COLUMN     "depositTrxId" BIGINT NOT NULL;

-- AddForeignKey
ALTER TABLE "BlockchainLog" ADD CONSTRAINT "BlockchainLog_depositTrxId_fkey" FOREIGN KEY ("depositTrxId") REFERENCES "Transaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
