/*
  Warnings:

  - A unique constraint covering the columns `[userId,provider]` on the table `ConnectedAccount` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "ConnectedAccount_userId_provider_key" ON "public"."ConnectedAccount"("userId", "provider");
