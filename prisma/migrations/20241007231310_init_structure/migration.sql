-- CreateEnum
CREATE TYPE "TokensEnum" AS ENUM ('SOL', 'ETH', 'USDC', 'USDT');

-- CreateEnum
CREATE TYPE "TransactionStatusEnum" AS ENUM ('SUCCESSFUL', 'FAILED', 'REVERTED', 'PENDING');

-- CreateEnum
CREATE TYPE "GameStatusEnum" AS ENUM ('DREAM_WON', 'WITHDRAWN', 'LOST', 'ONGOING', 'NOT_STARTED');

-- CreateEnum
CREATE TYPE "GameModesEnum" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLoginAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "email" VARCHAR(256),
    "name" VARCHAR(256),
    "admin" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserProfile" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER NOT NULL,
    "avatar" VARCHAR(512),

    CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Wallet" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ownerId" INTEGER NOT NULL,
    "address" VARCHAR(256) NOT NULL,

    CONSTRAINT "Wallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Chain" (
    "id" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "providerUrl" TEXT NOT NULL,

    CONSTRAINT "Chain_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "sourceId" INTEGER NOT NULL,
    "destinationId" INTEGER NOT NULL,
    "token" "TokensEnum" NOT NULL DEFAULT 'USDC',
    "amount" DOUBLE PRECISION NOT NULL,
    "chainId" INTEGER NOT NULL,
    "status" "TransactionStatusEnum" NOT NULL DEFAULT 'PENDING',
    "remarks" JSONB,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DreamMineGame" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "startedAt" TIMESTAMP(3),
    "initialBet" DOUBLE PRECISION NOT NULL,
    "betToken" "TokensEnum" NOT NULL DEFAULT 'USDC',
    "chainId" INTEGER NOT NULL,
    "mode" "GameModesEnum" NOT NULL DEFAULT 'EASY',
    "rowsCount" INTEGER NOT NULL DEFAULT 8,
    "currentRow" INTEGER NOT NULL DEFAULT 0,
    "stake" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "golds" INTEGER[],
    "lastChoice" INTEGER,
    "status" "GameStatusEnum" NOT NULL DEFAULT 'NOT_STARTED',
    "finishedAt" TIMESTAMP(3),

    CONSTRAINT "DreamMineGame_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DreamMineRules" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "rowCoefficients" DOUBLE PRECISION[],
    "rowProbabilities" DOUBLE PRECISION[],
    "difficultyCoefficients" DOUBLE PRECISION[],
    "minRows" INTEGER NOT NULL DEFAULT 8,
    "maxRows" INTEGER NOT NULL DEFAULT 12,
    "minBetAmount" DOUBLE PRECISION,
    "maxBetAmount" DOUBLE PRECISION,

    CONSTRAINT "DreamMineRules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlockData" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isFinalized" BOOLEAN NOT NULL DEFAULT false,
    "hash" TEXT NOT NULL,

    CONSTRAINT "BlockData_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_userId_key" ON "UserProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Wallet_ownerId_key" ON "Wallet"("ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "Wallet_address_key" ON "Wallet"("address");

-- AddForeignKey
ALTER TABLE "UserProfile" ADD CONSTRAINT "UserProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Wallet" ADD CONSTRAINT "Wallet_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Wallet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_destinationId_fkey" FOREIGN KEY ("destinationId") REFERENCES "Wallet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_chainId_fkey" FOREIGN KEY ("chainId") REFERENCES "Chain"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DreamMineGame" ADD CONSTRAINT "DreamMineGame_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DreamMineGame" ADD CONSTRAINT "DreamMineGame_chainId_fkey" FOREIGN KEY ("chainId") REFERENCES "Chain"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
