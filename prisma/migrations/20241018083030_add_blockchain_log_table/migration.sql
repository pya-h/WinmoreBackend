/*
  Warnings:

  - The values [WITHDRAWN] on the enum `GameStatusEnum` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "GameStatusEnum_new" AS ENUM ('WON', 'FLAWLESS_WIN', 'LOST', 'ONGOING', 'NOT_STARTED');
ALTER TABLE "DreamMineGame" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "DreamMineGame" ALTER COLUMN "status" TYPE "GameStatusEnum_new" USING ("status"::text::"GameStatusEnum_new");
ALTER TYPE "GameStatusEnum" RENAME TO "GameStatusEnum_old";
ALTER TYPE "GameStatusEnum_new" RENAME TO "GameStatusEnum";
DROP TYPE "GameStatusEnum_old";
ALTER TABLE "DreamMineGame" ALTER COLUMN "status" SET DEFAULT 'NOT_STARTED';
COMMIT;

-- CreateTable
CREATE TABLE "BlockchainLog" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "from" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "token" "TokensEnum" NOT NULL DEFAULT 'USDT',
    "chainId" INTEGER NOT NULL,

    CONSTRAINT "BlockchainLog_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "BlockchainLog" ADD CONSTRAINT "BlockchainLog_chainId_fkey" FOREIGN KEY ("chainId") REFERENCES "Chain"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
