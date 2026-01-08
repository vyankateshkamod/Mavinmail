/*
  Warnings:

  - Added the required column `email` to the `ConnectedAccount` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."ConnectedAccount" ADD COLUMN     "email" TEXT NOT NULL,
ADD COLUMN     "refreshToken" TEXT;
