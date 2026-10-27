/*
  Warnings:

  - Added the required column `advertiser` to the `Banner` table without a default value. This is not possible if the table is not empty.
  - Added the required column `alt` to the `Banner` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `Banner` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Banner` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `slot` on the `Banner` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- La table Banner (ancien modèle) est vide partout : on la vide par sécurité avant de la transformer.
DELETE FROM "Banner";

-- CreateEnum
CREATE TYPE "BannerSlot" AS ENUM ('TOP', 'SIDE', 'MID', 'BOTTOM');

-- CreateEnum
CREATE TYPE "BannerKind" AS ENUM ('IMAGE', 'CARD');

-- CreateEnum
CREATE TYPE "BannerStatus" AS ENUM ('DRAFT', 'IN_MODERATION', 'PUBLISHED', 'REJECTED', 'ARCHIVED');

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'REGIE';

-- AlterTable
ALTER TABLE "Banner" ADD COLUMN     "advertiser" TEXT NOT NULL,
ADD COLUMN     "alt" TEXT NOT NULL,
ADD COLUMN     "bg" TEXT,
ADD COLUMN     "countries" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "createdById" TEXT,
ADD COLUMN     "fg" TEXT,
ADD COLUMN     "headline" TEXT,
ADD COLUMN     "house" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "imageMobile" TEXT,
ADD COLUMN     "kind" "BannerKind" NOT NULL DEFAULT 'CARD',
ADD COLUMN     "profileId" TEXT,
ADD COLUMN     "sections" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "status" "BannerStatus" NOT NULL DEFAULT 'DRAFT',
ADD COLUMN     "tagline" TEXT,
ADD COLUMN     "title" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "image" DROP NOT NULL,
DROP COLUMN "slot",
ADD COLUMN     "slot" "BannerSlot" NOT NULL,
ALTER COLUMN "endsAt" DROP NOT NULL;

-- CreateTable
CREATE TABLE "BannerStat" (
    "bannerId" TEXT NOT NULL,
    "day" DATE NOT NULL,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "BannerStat_pkey" PRIMARY KEY ("bannerId","day")
);

-- CreateIndex
CREATE INDEX "Banner_slot_status_startsAt_endsAt_idx" ON "Banner"("slot", "status", "startsAt", "endsAt");

-- AddForeignKey
ALTER TABLE "Banner" ADD CONSTRAINT "Banner_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BannerStat" ADD CONSTRAINT "BannerStat_bannerId_fkey" FOREIGN KEY ("bannerId") REFERENCES "Banner"("id") ON DELETE CASCADE ON UPDATE CASCADE;
