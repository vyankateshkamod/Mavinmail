-- AlterTable
ALTER TABLE "User" ALTER COLUMN "preferredModel" DROP NOT NULL,
ALTER COLUMN "preferredModel" DROP DEFAULT;

-- CreateTable
CREATE TABLE "AIModel" (
    "id" SERIAL NOT NULL,
    "modelId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIModel_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AIModel_modelId_key" ON "AIModel"("modelId");

-- CreateIndex
CREATE INDEX "AIModel_isActive_idx" ON "AIModel"("isActive");

-- CreateIndex
CREATE INDEX "AIModel_isDefault_idx" ON "AIModel"("isDefault");
