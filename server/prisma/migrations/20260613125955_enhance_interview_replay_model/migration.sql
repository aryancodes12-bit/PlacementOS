/*
  Warnings:

  - Added the required column `updatedAt` to the `InterviewSession` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "InterviewRoundType" AS ENUM ('HR', 'TECHNICAL', 'MANAGERIAL', 'APTITUDE', 'GROUP_DISCUSSION', 'SYSTEM_DESIGN', 'CODING', 'OTHER');

-- CreateEnum
CREATE TYPE "InterviewResult" AS ENUM ('PENDING', 'SELECTED', 'REJECTED', 'ON_HOLD', 'NO_RESPONSE');

-- CreateEnum
CREATE TYPE "InterviewSourceType" AS ENUM ('MANUAL', 'AUDIO', 'VIDEO');

-- CreateEnum
CREATE TYPE "InterviewAnalysisStatus" AS ENUM ('DRAFT', 'ANALYZED');

-- AlterTable
ALTER TABLE "InterviewSession" ADD COLUMN     "analysisStatus" "InterviewAnalysisStatus" NOT NULL DEFAULT 'DRAFT',
ADD COLUMN     "feedback" TEXT,
ADD COLUMN     "nextActions" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "result" "InterviewResult" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "roundType" "InterviewRoundType" NOT NULL DEFAULT 'TECHNICAL',
ADD COLUMN     "sourceType" "InterviewSourceType" NOT NULL DEFAULT 'MANUAL',
ADD COLUMN     "technicalScore" DOUBLE PRECISION,
ADD COLUMN     "topics" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "transcript" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "videoUrl" TEXT,
ADD COLUMN     "whatWentWell" TEXT,
ADD COLUMN     "whatWentWrong" TEXT,
ALTER COLUMN "questionsAsked" SET DEFAULT ARRAY[]::TEXT[],
ALTER COLUMN "conceptsMissed" SET DEFAULT ARRAY[]::TEXT[];

-- CreateIndex
CREATE INDEX "InterviewSession_userId_idx" ON "InterviewSession"("userId");

-- CreateIndex
CREATE INDEX "InterviewSession_company_idx" ON "InterviewSession"("company");

-- CreateIndex
CREATE INDEX "InterviewSession_roundType_idx" ON "InterviewSession"("roundType");

-- CreateIndex
CREATE INDEX "InterviewSession_result_idx" ON "InterviewSession"("result");

-- CreateIndex
CREATE INDEX "InterviewSession_date_idx" ON "InterviewSession"("date");
