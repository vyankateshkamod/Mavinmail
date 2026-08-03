-- AlterTable
ALTER TABLE "User" ADD COLUMN     "preferredModel" TEXT NOT NULL DEFAULT 'google/gemini-2.0-flash-exp:free';

-- CreateTable
CREATE TABLE "UsageLog" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "metadata" JSONB,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UsageLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyncHistory" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'google',
    "emailCount" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'success',
    "errorMsg" TEXT,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SyncHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSettings" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "autoReply" BOOLEAN NOT NULL DEFAULT false,
    "draftMode" BOOLEAN NOT NULL DEFAULT true,
    "smartSummary" BOOLEAN NOT NULL DEFAULT true,
    "emailAlerts" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UsageLog_userId_createdAt_idx" ON "UsageLog"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "UsageLog_action_idx" ON "UsageLog"("action");

-- CreateIndex
CREATE INDEX "UsageLog_createdAt_idx" ON "UsageLog"("createdAt");

-- CreateIndex
CREATE INDEX "SyncHistory_userId_syncedAt_idx" ON "SyncHistory"("userId", "syncedAt");

-- CreateIndex
CREATE INDEX "SyncHistory_syncedAt_idx" ON "SyncHistory"("syncedAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserSettings_userId_key" ON "UserSettings"("userId");

-- AddForeignKey
ALTER TABLE "UsageLog" ADD CONSTRAINT "UsageLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SyncHistory" ADD CONSTRAINT "SyncHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSettings" ADD CONSTRAINT "UserSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
