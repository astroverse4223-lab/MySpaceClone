-- CreateEnum
CREATE TYPE "DmcaContentType" AS ENUM ('PROFILE_SONG', 'PLAYLIST_TRACK', 'POST', 'OTHER');

-- CreateTable
CREATE TABLE "DmcaRequest" (
    "id" TEXT NOT NULL,
    "complainantName" TEXT NOT NULL,
    "complainantEmail" TEXT NOT NULL,
    "contentType" "DmcaContentType" NOT NULL,
    "contentUrl" TEXT NOT NULL,
    "targetUsername" TEXT,
    "description" TEXT NOT NULL,
    "signature" TEXT NOT NULL,
    "status" "ReportStatus" NOT NULL DEFAULT 'PENDING',
    "resolvedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "DmcaRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DmcaRequest_status_createdAt_idx" ON "DmcaRequest"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "DmcaRequest" ADD CONSTRAINT "DmcaRequest_resolvedById_fkey" FOREIGN KEY ("resolvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
