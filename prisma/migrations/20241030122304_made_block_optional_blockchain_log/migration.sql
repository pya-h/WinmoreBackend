-- DropForeignKey
ALTER TABLE "BlockchainLog" DROP CONSTRAINT "BlockchainLog_blockId_fkey";

-- AlterTable
ALTER TABLE "BlockchainLog" ALTER COLUMN "blockId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "BlockchainLog" ADD CONSTRAINT "BlockchainLog_blockId_fkey" FOREIGN KEY ("blockId") REFERENCES "Block"("id") ON DELETE SET NULL ON UPDATE CASCADE;
