/*
  Warnings:

  - Added the required column `updatedAt` to the `DailyPlan` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "DailyPlan" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "ReadinessHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "overallScore" DOUBLE PRECISION NOT NULL,
    "dsaScore" DOUBLE PRECISION NOT NULL,
    "resumeScore" DOUBLE PRECISION NOT NULL,
    "interviewScore" DOUBLE PRECISION NOT NULL,
    "aptitudeScore" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReadinessHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ReadinessHistory_userId_idx" ON "ReadinessHistory"("userId");

-- CreateIndex
CREATE INDEX "ReadinessHistory_createdAt_idx" ON "ReadinessHistory"("createdAt");

-- CreateIndex
CREATE INDEX "DailyPlan_userId_idx" ON "DailyPlan"("userId");

-- AddForeignKey
ALTER TABLE "ReadinessHistory" ADD CONSTRAINT "ReadinessHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
