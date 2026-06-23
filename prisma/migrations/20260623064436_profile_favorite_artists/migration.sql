-- AlterTable
ALTER TABLE "Profile" ADD COLUMN     "favoriteArtists" TEXT[] DEFAULT ARRAY[]::TEXT[];
