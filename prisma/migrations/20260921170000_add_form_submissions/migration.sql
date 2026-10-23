-- CreateEnum
CREATE TYPE "FormType" AS ENUM ('JOB', 'DISTRIBUTOR');

-- CreateEnum
CREATE TYPE "FormStatus" AS ENUM ('NEW', 'READ', 'ARCHIVED');

-- CreateTable
CREATE TABLE "FormSubmission" (
    "id" TEXT NOT NULL,
    "type" "FormType" NOT NULL,
    "name" TEXT NOT NULL,
    "mobile" TEXT NOT NULL,
    "city" TEXT,
    "message" TEXT,
    "fileUrl" TEXT,
    "status" "FormStatus" NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FormSubmission_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "FormSubmission_type_status_idx" ON "FormSubmission"("type", "status");
