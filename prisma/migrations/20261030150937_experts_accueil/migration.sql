-- CreateEnum
CREATE TYPE "ExpertStatus" AS ENUM ('NONE', 'PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "HostingKind" AS ENUM ('ROOM', 'WHOLE', 'FAMILY');

-- AlterTable
ALTER TABLE "Profile" ADD COLUMN     "expertAt" TIMESTAMP(3),
ADD COLUMN     "expertDomain" TEXT,
ADD COLUMN     "expertModes" JSONB,
ADD COLUMN     "expertPitch" TEXT,
ADD COLUMN     "expertStatus" "ExpertStatus" NOT NULL DEFAULT 'NONE';

-- CreateTable
CREATE TABLE "HostingOffer" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "kind" "HostingKind" NOT NULL,
    "audience" JSONB NOT NULL,
    "city" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "capacity" INTEGER,
    "duration" TEXT,
    "conditions" TEXT NOT NULL,
    "status" "ContentStatus" NOT NULL DEFAULT 'IN_MODERATION',
    "charterAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HostingOffer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "HostingOffer_profileId_key" ON "HostingOffer"("profileId");

-- CreateIndex
CREATE INDEX "HostingOffer_status_country_idx" ON "HostingOffer"("status", "country");

-- AddForeignKey
ALTER TABLE "HostingOffer" ADD CONSTRAINT "HostingOffer_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
