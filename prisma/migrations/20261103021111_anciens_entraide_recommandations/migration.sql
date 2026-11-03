-- CreateEnum
CREATE TYPE "HelpKind" AS ENUM ('NEED', 'OFFER');

-- AlterTable
ALTER TABLE "Profile" ADD COLUMN     "helpVolunteer" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "Education" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "school" TEXT NOT NULL,
    "schoolSlug" TEXT NOT NULL,
    "field" TEXT,
    "endYear" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Education_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HelpDetails" (
    "contentId" TEXT NOT NULL,
    "kind" "HelpKind" NOT NULL DEFAULT 'NEED',
    "category" TEXT NOT NULL,
    "urgent" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "HelpDetails_pkey" PRIMARY KEY ("contentId")
);

-- CreateTable
CREATE TABLE "Recommendation" (
    "id" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "profileId" TEXT,
    "contentId" TEXT,
    "text" TEXT NOT NULL,
    "status" "ContentStatus" NOT NULL DEFAULT 'IN_MODERATION',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Recommendation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Education_schoolSlug_idx" ON "Education"("schoolSlug");

-- CreateIndex
CREATE INDEX "Education_profileId_idx" ON "Education"("profileId");

-- CreateIndex
CREATE INDEX "Recommendation_profileId_status_idx" ON "Recommendation"("profileId", "status");

-- CreateIndex
CREATE INDEX "Recommendation_contentId_status_idx" ON "Recommendation"("contentId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Recommendation_authorId_profileId_key" ON "Recommendation"("authorId", "profileId");

-- CreateIndex
CREATE UNIQUE INDEX "Recommendation_authorId_contentId_key" ON "Recommendation"("authorId", "contentId");

-- AddForeignKey
ALTER TABLE "Education" ADD CONSTRAINT "Education_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HelpDetails" ADD CONSTRAINT "HelpDetails_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "Content"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recommendation" ADD CONSTRAINT "Recommendation_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recommendation" ADD CONSTRAINT "Recommendation_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recommendation" ADD CONSTRAINT "Recommendation_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "Content"("id") ON DELETE CASCADE ON UPDATE CASCADE;
