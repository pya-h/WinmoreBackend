/*
  Warnings:

  - Added the required column `chainId` to the `Contract` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Contract" ADD COLUMN     "chainId" INTEGER NOT NULL,
ADD COLUMN     "decimals" INTEGER;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_chainId_fkey" FOREIGN KEY ("chainId") REFERENCES "Chain"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
