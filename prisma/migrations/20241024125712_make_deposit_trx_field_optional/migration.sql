-- DropForeignKey
ALTER TABLE "BlockchainLog" DROP CONSTRAINT "BlockchainLog_depositTrxId_fkey";

-- AlterTable
ALTER TABLE "BlockchainLog" ALTER COLUMN "depositTrxId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "BlockchainLog" ADD CONSTRAINT "BlockchainLog_depositTrxId_fkey" FOREIGN KEY ("depositTrxId") REFERENCES "Transaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;
