-- AlterTable
ALTER TABLE "User" ADD COLUMN     "importedFrom" TEXT,
ADD COLUMN     "invitedAt" TIMESTAMP(3);
