-- CreateEnum
CREATE TYPE "InterviewQuestionStatus" AS ENUM ('SOLVED', 'PARTIAL', 'FAILED', 'SKIPPED');

-- CreateTable
CREATE TABLE "InterviewQuestionReplay" (
    "id" TEXT NOT NULL,
    "interviewId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "userAnswer" TEXT,
    "missedPoints" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "interviewerFeedback" TEXT,
    "confidenceScore" DOUBLE PRECISION,
    "status" "InterviewQuestionStatus" NOT NULL DEFAULT 'PARTIAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InterviewQuestionReplay_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InterviewQuestionReplay_interviewId_idx" ON "InterviewQuestionReplay"("interviewId");

-- CreateIndex
CREATE INDEX "InterviewQuestionReplay_status_idx" ON "InterviewQuestionReplay"("status");

-- AddForeignKey
ALTER TABLE "InterviewQuestionReplay" ADD CONSTRAINT "InterviewQuestionReplay_interviewId_fkey" FOREIGN KEY ("interviewId") REFERENCES "InterviewSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
