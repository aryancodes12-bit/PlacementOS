/*
  Warnings:

  - You are about to alter the column `atsScore` on the `Resume` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - Added the required column `updatedAt` to the `Resume` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ResumeAnalysisStatus" AS ENUM ('PENDING', 'ANALYZED', 'FAILED');

-- AlterTable
ALTER TABLE "Resume" ADD COLUMN     "analysisStatus" "ResumeAnalysisStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "extractedText" TEXT,
ADD COLUMN     "fileName" TEXT,
ADD COLUMN     "fileSize" INTEGER,
ADD COLUMN     "keywordScore" INTEGER,
ADD COLUMN     "projectScore" INTEGER,
ADD COLUMN     "readabilityScore" INTEGER,
ADD COLUMN     "roleFitScore" INTEGER,
ADD COLUMN     "targetRole" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "version" DROP DEFAULT,
ALTER COLUMN "atsScore" SET DATA TYPE INTEGER;

-- CreateIndex
CREATE INDEX "Resume_userId_idx" ON "Resume"("userId");

-- CreateIndex
CREATE INDEX "Resume_atsScore_idx" ON "Resume"("atsScore");

-- CreateIndex
CREATE INDEX "Resume_analysisStatus_idx" ON "Resume"("analysisStatus");
