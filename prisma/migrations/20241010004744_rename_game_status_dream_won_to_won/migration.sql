/*
  Warnings:

  - The values [DREAM_WON] on the enum `GameStatusEnum` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "GameStatusEnum_new" AS ENUM ('WON', 'WITHDRAWN', 'LOST', 'ONGOING', 'NOT_STARTED');
ALTER TABLE "DreamMineGame" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "DreamMineGame" ALTER COLUMN "status" TYPE "GameStatusEnum_new" USING ("status"::text::"GameStatusEnum_new");
ALTER TYPE "GameStatusEnum" RENAME TO "GameStatusEnum_old";
ALTER TYPE "GameStatusEnum_new" RENAME TO "GameStatusEnum";
DROP TYPE "GameStatusEnum_old";
ALTER TABLE "DreamMineGame" ALTER COLUMN "status" SET DEFAULT 'NOT_STARTED';
COMMIT;
