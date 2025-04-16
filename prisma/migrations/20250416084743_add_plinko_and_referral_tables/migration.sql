/*
  Warnings:

  - A unique constraint covering the columns `[referralCode]` on the table `UserProfile` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `referralCode` to the `UserProfile` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PlinkoGameStatus" AS ENUM ('NOT_DROPPED_YET', 'DROPPING', 'FINISHED');

-- AlterTable
ALTER TABLE "UserProfile" ADD COLUMN     "referralCode" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "PlinkoGame" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "initialBet" DOUBLE PRECISION NOT NULL,
    "token" "TokensEnum" NOT NULL DEFAULT 'USDC',
    "chainId" INTEGER NOT NULL,
    "ballsCount" INTEGER NOT NULL DEFAULT 1,
    "mode" "GameModesEnum" NOT NULL DEFAULT 'EASY',
    "rowsCount" INTEGER NOT NULL DEFAULT 8,
    "prize" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "profit" DOUBLE PRECISION,
    "status" "PlinkoGameStatus" NOT NULL DEFAULT 'NOT_DROPPED_YET',
    "finishedAt" TIMESTAMP(3),

    CONSTRAINT "PlinkoGame_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlinkoBalls" (
    "id" BIGSERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "gameId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "bucketIndex" INTEGER NOT NULL,
    "scoredMultiplier" DOUBLE PRECISION NOT NULL,
    "dropSpecs" JSONB NOT NULL,

    CONSTRAINT "PlinkoBalls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlinkoRules" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "rows" INTEGER NOT NULL,
    "multipliers" DOUBLE PRECISION[],
    "probabilities" DOUBLE PRECISION[],
    "difficultyMultipliers" DOUBLE PRECISION[],
    "minBetAmount" DOUBLE PRECISION,
    "maxBetAmount" DOUBLE PRECISION,
    "companyShare" DOUBLE PRECISION NOT NULL,
    "verticalSpeedFactor" DOUBLE PRECISION NOT NULL,
    "horizontalSpeedFactor" DOUBLE PRECISION NOT NULL,
    "gravity" DOUBLE PRECISION NOT NULL,
    "friction" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "PlinkoRules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Referral" (
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "referrerId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "layer" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Referral_pkey" PRIMARY KEY ("referrerId","userId")
);

-- CreateIndex
CREATE UNIQUE INDEX "PlinkoRules_rows_key" ON "PlinkoRules"("rows");

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_referralCode_key" ON "UserProfile"("referralCode");

-- AddForeignKey
ALTER TABLE "PlinkoGame" ADD CONSTRAINT "PlinkoGame_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlinkoGame" ADD CONSTRAINT "PlinkoGame_chainId_fkey" FOREIGN KEY ("chainId") REFERENCES "Chain"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlinkoBalls" ADD CONSTRAINT "PlinkoBalls_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "PlinkoGame"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlinkoBalls" ADD CONSTRAINT "PlinkoBalls_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
