/*
  Warnings:

  - You are about to drop the column `identifier` on the `Contract` table. All the data in the column will be lost.
  - You are about to drop the column `isTokenContract` on the `Contract` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Contract_identifier_key";

-- AlterTable
ALTER TABLE "Contract" DROP COLUMN "identifier",
DROP COLUMN "isTokenContract",
ADD COLUMN     "token" "TokensEnum";
