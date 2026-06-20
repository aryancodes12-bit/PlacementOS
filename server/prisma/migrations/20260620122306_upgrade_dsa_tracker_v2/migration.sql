/*
  Warnings:

  - A unique constraint covering the columns `[userId,source,externalId]` on the table `DSAProblem` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "DSAProblemSource" AS ENUM ('MANUAL', 'LEETCODE');

-- DropIndex
DROP INDEX "DSAProblem_difficulty_idx";

-- DropIndex
DROP INDEX "DSAProblem_status_idx";

-- DropIndex
DROP INDEX "DSAProblem_topic_idx";

-- AlterTable
ALTER TABLE "DSAProblem" ADD COLUMN     "companies" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "externalId" TEXT,
ADD COLUMN     "importedAt" TIMESTAMP(3),
ADD COLUMN     "lastRevisedAt" TIMESTAMP(3),
ADD COLUMN     "nextRevisionAt" TIMESTAMP(3),
ADD COLUMN     "pattern" TEXT,
ADD COLUMN     "revisionCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "solveCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "source" "DSAProblemSource" NOT NULL DEFAULT 'MANUAL';

-- CreateTable
CREATE TABLE "DSARevision" (
    "id" TEXT NOT NULL,
    "problemId" TEXT NOT NULL,
    "scheduledFor" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "intervalDays" INTEGER NOT NULL,
    "wasOverdue" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DSARevision_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DSARevision_problemId_idx" ON "DSARevision"("problemId");

-- CreateIndex
CREATE INDEX "DSARevision_completedAt_idx" ON "DSARevision"("completedAt");

-- CreateIndex
CREATE INDEX "DSARevision_wasOverdue_idx" ON "DSARevision"("wasOverdue");

-- CreateIndex
CREATE INDEX "DSAProblem_userId_status_idx" ON "DSAProblem"("userId", "status");

-- CreateIndex
CREATE INDEX "DSAProblem_userId_topic_idx" ON "DSAProblem"("userId", "topic");

-- CreateIndex
CREATE INDEX "DSAProblem_userId_pattern_idx" ON "DSAProblem"("userId", "pattern");

-- CreateIndex
CREATE INDEX "DSAProblem_userId_difficulty_idx" ON "DSAProblem"("userId", "difficulty");

-- CreateIndex
CREATE INDEX "DSAProblem_userId_nextRevisionAt_idx" ON "DSAProblem"("userId", "nextRevisionAt");

-- CreateIndex
CREATE INDEX "DSAProblem_source_idx" ON "DSAProblem"("source");

-- CreateIndex
CREATE UNIQUE INDEX "DSAProblem_userId_source_externalId_key" ON "DSAProblem"("userId", "source", "externalId");

-- AddForeignKey
ALTER TABLE "DSARevision" ADD CONSTRAINT "DSARevision_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "DSAProblem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
