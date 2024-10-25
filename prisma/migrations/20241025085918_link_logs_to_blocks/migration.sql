/*
  Warnings:

  - Added the required column `blockId` to the `BlockchainLog` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "BlockchainLog" ADD COLUMN     "blockId" BIGINT NOT NULL;

-- AddForeignKey
ALTER TABLE "BlockchainLog" ADD CONSTRAINT "BlockchainLog_blockId_fkey" FOREIGN KEY ("blockId") REFERENCES "Block"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
