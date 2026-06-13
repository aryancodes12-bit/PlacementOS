/*
  Warnings:

  - Added the required column `updatedAt` to the `DSAProblem` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "DSAProblem" ADD COLUMN     "problemUrl" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE INDEX "DSAProblem_userId_idx" ON "DSAProblem"("userId");

-- CreateIndex
CREATE INDEX "DSAProblem_topic_idx" ON "DSAProblem"("topic");

-- CreateIndex
CREATE INDEX "DSAProblem_difficulty_idx" ON "DSAProblem"("difficulty");

-- CreateIndex
CREATE INDEX "DSAProblem_status_idx" ON "DSAProblem"("status");
