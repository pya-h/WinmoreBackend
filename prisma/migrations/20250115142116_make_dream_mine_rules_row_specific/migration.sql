/*
  Warnings:

  - You are about to drop the column `golds` on the `DreamMineGame` table. All the data in the column will be lost.
  - You are about to drop the column `difficultyCoefficients` on the `DreamMineRules` table. All the data in the column will be lost.
  - You are about to drop the column `maxRows` on the `DreamMineRules` table. All the data in the column will be lost.
  - You are about to drop the column `minRows` on the `DreamMineRules` table. All the data in the column will be lost.
  - You are about to drop the column `rowCoefficients` on the `DreamMineRules` table. All the data in the column will be lost.
  - You are about to drop the column `rowProbabilities` on the `DreamMineRules` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[rows]` on the table `DreamMineRules` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `companyShare` to the `DreamMineRules` table without a default value. This is not possible if the table is not empty.
  - Added the required column `rows` to the `DreamMineRules` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "DreamMineGame" DROP COLUMN "golds",
ADD COLUMN     "nulls" INTEGER[];

-- AlterTable
ALTER TABLE "DreamMineRules" DROP COLUMN "difficultyCoefficients",
DROP COLUMN "maxRows",
DROP COLUMN "minRows",
DROP COLUMN "rowCoefficients",
DROP COLUMN "rowProbabilities",
ADD COLUMN     "rows" INTEGER NOT NULL,
ADD COLUMN     "difficultyMultipliers" DOUBLE PRECISION[],
ADD COLUMN     "multipliers" DOUBLE PRECISION[],
ADD COLUMN     "probabilities" DOUBLE PRECISION[],
ADD COLUMN     "companyShare" DOUBLE PRECISION NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "DreamMineRules_rows_key" ON "DreamMineRules"("rows");
