-- AlterTable
ALTER TABLE "Chain" ADD COLUMN     "acceptedBlockStatus" "BlockStatus" NOT NULL DEFAULT 'finalized';
