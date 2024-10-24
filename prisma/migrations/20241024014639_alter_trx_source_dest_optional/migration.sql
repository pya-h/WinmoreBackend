-- DropForeignKey
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_destinationId_fkey";

-- DropForeignKey
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_sourceId_fkey";

-- AlterTable
ALTER TABLE "Transaction" ALTER COLUMN "sourceId" DROP NOT NULL,
ALTER COLUMN "destinationId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Wallet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_destinationId_fkey" FOREIGN KEY ("destinationId") REFERENCES "Wallet"("id") ON DELETE SET NULL ON UPDATE CASCADE;
