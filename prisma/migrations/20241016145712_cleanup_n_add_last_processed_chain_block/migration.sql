/*
  Warnings:

  - You are about to drop the `AnalyzedBlock` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "AnalyzedBlock" DROP CONSTRAINT "AnalyzedBlock_chainId_fkey";

-- AlterTable
ALTER TABLE "Chain" ADD COLUMN     "lastProcessedBlock" BIGINT;

-- DropTable
DROP TABLE "AnalyzedBlock";
