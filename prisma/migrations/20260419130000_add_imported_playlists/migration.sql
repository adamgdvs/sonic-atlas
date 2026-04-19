-- CreateTable
CREATE TABLE "ImportedPlaylist" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "sourcePlaylistId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "creator" TEXT,
    "coverUrl" TEXT,
    "sourceUrl" TEXT,
    "checksum" TEXT,
    "trackCount" INTEGER,
    "matchedCoverage" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ImportedPlaylist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportedPlaylistTrack" (
    "id" TEXT NOT NULL,
    "importedPlaylistId" TEXT NOT NULL,
    "sourceTrackId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "artist" TEXT NOT NULL,
    "album" TEXT,
    "duration" INTEGER,
    "explicit" BOOLEAN NOT NULL DEFAULT false,
    "previewUrl" TEXT,
    "sourceUrl" TEXT,
    "coverUrl" TEXT,
    "isrc" TEXT,
    "position" INTEGER NOT NULL,
    "matchStatus" TEXT NOT NULL,
    "matchConfidence" DOUBLE PRECISION,
    "videoId" TEXT,
    "matchedTitle" TEXT,
    "matchedArtist" TEXT,
    "matchedThumbnailUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ImportedPlaylistTrack_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ImportedPlaylist_source_sourcePlaylistId_key" ON "ImportedPlaylist"("source", "sourcePlaylistId");

-- CreateIndex
CREATE INDEX "ImportedPlaylist_source_sourcePlaylistId_idx" ON "ImportedPlaylist"("source", "sourcePlaylistId");

-- CreateIndex
CREATE INDEX "ImportedPlaylist_title_idx" ON "ImportedPlaylist"("title");

-- CreateIndex
CREATE INDEX "ImportedPlaylistTrack_importedPlaylistId_idx" ON "ImportedPlaylistTrack"("importedPlaylistId");

-- CreateIndex
CREATE INDEX "ImportedPlaylistTrack_videoId_idx" ON "ImportedPlaylistTrack"("videoId");

-- CreateIndex
CREATE INDEX "ImportedPlaylistTrack_artist_idx" ON "ImportedPlaylistTrack"("artist");

-- CreateIndex
CREATE UNIQUE INDEX "ImportedPlaylistTrack_importedPlaylistId_position_key" ON "ImportedPlaylistTrack"("importedPlaylistId", "position");

-- AddForeignKey
ALTER TABLE "ImportedPlaylistTrack" ADD CONSTRAINT "ImportedPlaylistTrack_importedPlaylistId_fkey" FOREIGN KEY ("importedPlaylistId") REFERENCES "ImportedPlaylist"("id") ON DELETE CASCADE ON UPDATE CASCADE;
