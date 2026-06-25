-- CreateTable
CREATE TABLE "NotificationPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "emailDigestEnabled" BOOLEAN NOT NULL DEFAULT false,
    "streakRiskEnabled" BOOLEAN NOT NULL DEFAULT true,
    "dsaRevisionEnabled" BOOLEAN NOT NULL DEFAULT true,
    "resumeStaleEnabled" BOOLEAN NOT NULL DEFAULT true,
    "interviewInactiveEnabled" BOOLEAN NOT NULL DEFAULT true,
    "digestHour" INTEGER NOT NULL DEFAULT 20,
    "digestMinute" INTEGER NOT NULL DEFAULT 0,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    "lastDigestDate" TEXT,
    "lastDigestSentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationPreference_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NotificationPreference_userId_key" ON "NotificationPreference"("userId");

-- CreateIndex
CREATE INDEX "NotificationPreference_emailDigestEnabled_idx" ON "NotificationPreference"("emailDigestEnabled");

-- AddForeignKey
ALTER TABLE "NotificationPreference" ADD CONSTRAINT "NotificationPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
