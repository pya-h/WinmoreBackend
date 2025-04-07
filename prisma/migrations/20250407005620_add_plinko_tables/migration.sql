-- CreateEnum
CREATE TYPE "PlinkoGameStatus" AS ENUM ('NOT_DROPPED_YET', 'DROPPING', 'FINISHED');

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
    "status" "PlinkoGameStatus" NOT NULL DEFAULT 'NOT_DROPPED_YET',
    "finishedAt" TIMESTAMP(3),

    CONSTRAINT "PlinkoGame_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlinkoBalls" (
    "id" SERIAL NOT NULL,
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

-- CreateIndex
CREATE UNIQUE INDEX "PlinkoRules_rows_key" ON "PlinkoRules"("rows");

-- AddForeignKey
ALTER TABLE "PlinkoGame" ADD CONSTRAINT "PlinkoGame_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlinkoGame" ADD CONSTRAINT "PlinkoGame_chainId_fkey" FOREIGN KEY ("chainId") REFERENCES "Chain"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlinkoBalls" ADD CONSTRAINT "PlinkoBalls_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "PlinkoGame"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlinkoBalls" ADD CONSTRAINT "PlinkoBalls_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
