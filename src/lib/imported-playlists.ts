import fs from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/prisma";
import type { CuratedPlaylist, CuratedPlaylistTrack } from "@/lib/ytmusic";
import { getDeezerPlaylistWithTracks } from "@/lib/deezer";
import { matchDeezerTrackToYouTube } from "@/lib/deezer-import";
import type { DeezerImportTrack } from "@/lib/deezer-import";

const IMPORTED_PREFIX = "imported::deezer::";
const DATA_ROOT = path.join(process.cwd(), "data", "deezer");
const MANIFEST_PATH = path.join(DATA_ROOT, "index", "playlists.json");

interface ImportedManifestItem {
  playlistId: string;
  title?: string;
  checksum?: string | null;
  trackCount?: number | null;
  matchedCoverage?: number | null;
  source?: string;
}

interface ImportedManifest {
  playlists?: ImportedManifestItem[];
}

interface NormalizedPlaylist {
  source: "deezer";
  sourcePlaylistId: number;
  checksum: string | null;
  title: string;
  description: string;
  creator: string;
  coverUrl: string | null;
  deezerUrl: string | null;
  trackCount: number | null;
  tracks: Array<{
    sourceTrackId: number;
    isrc?: string | null;
    title: string;
    artist: string;
    album: string;
    duration: number | null;
    explicit: boolean;
    preview: string | null;
    deezerUrl: string | null;
    timeAdded: number | null;
    coverUrl: string | null;
  }>;
}

interface MatchedPlaylist {
  playlist: NormalizedPlaylist;
  matches: Array<{
    status: "matched" | "unmatched";
    confidence: number;
    videoId: string | null;
    matchedTitle: string | null;
    matchedArtist: string | null;
    thumbnailUrl: string | null;
    deezerTrack: NormalizedPlaylist["tracks"][number];
  }>;
  stats?: {
    requested: number;
    matched: number;
    unmatched: number;
    coverage: number;
  };
}

function normalizeText(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function overlapScore(haystack: string, needle: string) {
  const hay = normalizeText(haystack);
  const ned = normalizeText(needle);
  if (!hay || !ned) return 0;
  if (hay.includes(ned) || ned.includes(hay)) return 1;

  const hayWords = new Set(hay.split(/\s+/).filter(Boolean));
  const needleWords = new Set(ned.split(/\s+/).filter(Boolean));
  let overlap = 0;
  for (const word of needleWords) {
    if (hayWords.has(word)) overlap += 1;
  }
  return overlap / Math.max(needleWords.size, 1);
}

async function readJson<T>(filePath: string): Promise<T | null> {
  try {
    const content = await fs.readFile(filePath, "utf8");
    return JSON.parse(content) as T;
  } catch {
    return null;
  }
}

function buildImportedId(playlistId: string | number) {
  return `${IMPORTED_PREFIX}${playlistId}`;
}

export function isImportedDeezerId(id: string) {
  return id.startsWith(IMPORTED_PREFIX);
}

export function parseImportedDeezerId(id: string) {
  return isImportedDeezerId(id) ? id.slice(IMPORTED_PREFIX.length) : null;
}

function buildImportedDescription(
  normalized: NormalizedPlaylist,
  coverage: number | null | undefined
) {
  const parts: string[] = [];
  if (normalized.creator) parts.push(`Imported from Deezer by ${normalized.creator}`);
  else parts.push("Imported from Deezer");

  if (normalized.description) parts.push(normalized.description);
  if (typeof coverage === "number") {
    parts.push(`YT coverage ${(coverage * 100).toFixed(0)}%`);
  }

  return parts.join(" · ");
}

export async function searchImportedPlaylists(query: string, limit = 12): Promise<CuratedPlaylist[]> {
  const dbResults = await prisma.importedPlaylist.findMany({
    where: {
      OR: [
        { title: { contains: query, mode: "insensitive" } },
        { description: { contains: query, mode: "insensitive" } },
        { creator: { contains: query, mode: "insensitive" } },
        {
          tracks: {
            some: {
              OR: [
                { title: { contains: query, mode: "insensitive" } },
                { artist: { contains: query, mode: "insensitive" } },
                { album: { contains: query, mode: "insensitive" } },
              ],
            },
          },
        },
      ],
    },
    include: {
      tracks: {
        orderBy: { position: "asc" },
        take: 12,
      },
    },
    take: Math.max(limit * 3, 24),
    orderBy: [{ updatedAt: "desc" }],
  }).catch(() => []);

  if (dbResults.length > 0) {
    const scored = dbResults
      .map((playlist) => {
        const haystack = [
          playlist.title,
          playlist.description || "",
          playlist.creator || "",
          ...playlist.tracks.flatMap((track) => [track.title, track.artist, track.album || ""]),
        ].join(" ");

        const score =
          overlapScore(playlist.title, query) * 5 +
          overlapScore(playlist.description || "", query) * 2 +
          overlapScore(playlist.creator || "", query) * 1.5 +
          overlapScore(haystack, query) * 1.25 +
          (typeof playlist.matchedCoverage === "number" ? playlist.matchedCoverage : 0);

        return {
          score,
          playlist: {
            id: buildImportedId(playlist.sourcePlaylistId),
            title: playlist.title,
            description: buildImportedDescription(
              {
                source: "deezer",
                sourcePlaylistId: Number.parseInt(playlist.sourcePlaylistId, 10) || 0,
                checksum: playlist.checksum,
                title: playlist.title,
                description: playlist.description || "",
                creator: playlist.creator || "",
                coverUrl: playlist.coverUrl,
                deezerUrl: playlist.sourceUrl,
                trackCount: playlist.trackCount,
                tracks: [],
              },
              playlist.matchedCoverage
            ),
            coverUrl: playlist.coverUrl,
            source: "atlas",
            category: "imported",
            trackCount: playlist.trackCount,
          } satisfies CuratedPlaylist,
        };
      })
      .filter((item) => item.score > 0.2)
      .sort((left, right) => right.score - left.score)
      .slice(0, limit)
      .map((item) => item.playlist);

    return scored;
  }

  const manifest = await readJson<ImportedManifest>(MANIFEST_PATH);
  const items = Array.isArray(manifest?.playlists) ? manifest.playlists : [];
  if (!items.length) return [];

  const normalizedQuery = normalizeText(query);
  if (!normalizedQuery) return [];

  const scored = await Promise.all(
    items.map(async (item) => {
      const normalized = await readJson<NormalizedPlaylist>(
        path.join(DATA_ROOT, "normalized", "playlists", `${item.playlistId}.json`)
      );
      if (!normalized) return null;

      const haystack = [
        normalized.title,
        normalized.description,
        normalized.creator,
        ...normalized.tracks.slice(0, 12).flatMap((track) => [track.title, track.artist, track.album]),
      ].join(" ");

      const score =
        overlapScore(normalized.title, query) * 5 +
        overlapScore(normalized.description, query) * 2 +
        overlapScore(normalized.creator, query) * 1.5 +
        overlapScore(haystack, query) * 1.25 +
        (typeof item.matchedCoverage === "number" ? item.matchedCoverage : 0);

      if (score <= 0.2) return null;

      return {
        score,
        playlist: {
          id: buildImportedId(item.playlistId),
          title: normalized.title,
          description: buildImportedDescription(normalized, item.matchedCoverage),
          coverUrl: normalized.coverUrl,
          source: "atlas",
          category: "imported",
          trackCount: normalized.trackCount ?? normalized.tracks.length,
        } satisfies CuratedPlaylist,
      };
    })
  );

  return scored
    .filter((item): item is NonNullable<typeof item> => item !== null)
    .sort((left, right) => right.score - left.score)
    .slice(0, limit)
    .map((item) => item.playlist);
}

export async function getImportedPlaylistTracks(id: string): Promise<CuratedPlaylist> {
  const playlistId = parseImportedDeezerId(id);
  if (!playlistId) {
    throw new Error("Invalid imported playlist id");
  }

  const dbPlaylist = await prisma.importedPlaylist.findUnique({
    where: {
      source_sourcePlaylistId: {
        source: "deezer",
        sourcePlaylistId: playlistId,
      },
    },
    include: {
      tracks: {
        orderBy: { position: "asc" },
      },
    },
  }).catch(() => null);

  if (dbPlaylist) {
    const tracks: CuratedPlaylistTrack[] = dbPlaylist.tracks
      .filter((track) => track.matchStatus === "matched" && track.videoId)
      .map((track) => ({
        title: track.title,
        artist: track.artist,
        videoId: track.videoId!,
        coverUrl: track.matchedThumbnailUrl || track.coverUrl || null,
      }));

    return {
      id,
      title: dbPlaylist.title,
      description: buildImportedDescription(
        {
          source: "deezer",
          sourcePlaylistId: Number.parseInt(dbPlaylist.sourcePlaylistId, 10) || 0,
          checksum: dbPlaylist.checksum,
          title: dbPlaylist.title,
          description: dbPlaylist.description || "",
          creator: dbPlaylist.creator || "",
          coverUrl: dbPlaylist.coverUrl,
          deezerUrl: dbPlaylist.sourceUrl,
          trackCount: dbPlaylist.trackCount,
          tracks: [],
        },
        dbPlaylist.matchedCoverage
      ),
      coverUrl: dbPlaylist.coverUrl,
      source: "atlas",
      category: "imported",
      trackCount: dbPlaylist.trackCount ?? dbPlaylist.tracks.length,
      tracks,
    };
  }

  // File-system fallback (pre-acquired JSON files)
  const normalized = await readJson<NormalizedPlaylist>(
    path.join(DATA_ROOT, "normalized", "playlists", `${playlistId}.json`)
  );
  if (normalized) {
    const matched = await readJson<MatchedPlaylist>(
      path.join(DATA_ROOT, "matched", "playlists", `${playlistId}.json`)
    );
    const tracks: CuratedPlaylistTrack[] = matched
      ? matched.matches
          .filter((match) => match.status === "matched" && match.videoId)
          .map((match) => ({
            title: match.deezerTrack.title,
            artist: match.deezerTrack.artist,
            videoId: match.videoId!,
            coverUrl: match.thumbnailUrl || match.deezerTrack.coverUrl || null,
          }))
      : [];
    return {
      id,
      title: normalized.title,
      description: buildImportedDescription(normalized, matched?.stats?.coverage ?? null),
      coverUrl: normalized.coverUrl,
      source: "atlas",
      category: "imported",
      trackCount: normalized.trackCount ?? normalized.tracks.length,
      tracks,
    };
  }

  // Live fetch from Deezer, match tracks to YouTube Music, cache result in DB
  return fetchAndCacheDeezerPlaylist(id, playlistId);
}

async function fetchAndCacheDeezerPlaylist(
  fullId: string,
  playlistId: string
): Promise<CuratedPlaylist> {
  const numericId = Number(playlistId);
  if (!Number.isFinite(numericId) || numericId <= 0) {
    throw new Error(`Invalid Deezer playlist id: ${playlistId}`);
  }

  const deezerPlaylist = await getDeezerPlaylistWithTracks(numericId, 100);
  if (!deezerPlaylist) {
    throw new Error(`Deezer playlist ${playlistId} could not be fetched`);
  }

  // Match all tracks to YouTube Music in batches of 6
  const BATCH = 6;
  const matches: Array<{ track: typeof deezerPlaylist.tracks[number]; videoId: string | null; matchedTitle: string | null; matchedArtist: string | null; thumbnail: string | null; confidence: number }> = [];

  for (let i = 0; i < deezerPlaylist.tracks.length; i += BATCH) {
    const batch = deezerPlaylist.tracks.slice(i, i + BATCH);
    const batchResults = await Promise.all(
      batch.map((track) => {
        const importTrack: DeezerImportTrack = {
          deezerId: track.id,
          title: track.title,
          artist: track.artist,
          album: track.album,
          duration: track.duration,
          explicit: track.explicit,
          preview: track.preview,
          deezerUrl: track.deezerUrl,
          timeAdded: null,
          coverUrl: track.coverUrl,
          isrc: track.isrc,
        };
        return matchDeezerTrackToYouTube(importTrack);
      })
    );
    for (let j = 0; j < batch.length; j++) {
      const r = batchResults[j];
      matches.push({
        track: batch[j],
        videoId: r.videoId,
        matchedTitle: r.matchedTitle,
        matchedArtist: r.matchedArtist,
        thumbnail: r.thumbnailUrl,
        confidence: r.confidence,
      });
    }
  }

  const matched = matches.filter((m) => m.videoId);
  const coverage = deezerPlaylist.tracks.length > 0 ? matched.length / deezerPlaylist.tracks.length : 0;

  // Persist to DB so subsequent loads are instant
  try {
    await prisma.importedPlaylist.upsert({
      where: { source_sourcePlaylistId: { source: "deezer", sourcePlaylistId: playlistId } },
      create: {
        source: "deezer",
        sourcePlaylistId: playlistId,
        title: deezerPlaylist.title,
        description: deezerPlaylist.description,
        creator: deezerPlaylist.creator,
        coverUrl: deezerPlaylist.coverUrl,
        trackCount: deezerPlaylist.trackCount,
        matchedCoverage: coverage,
        tracks: {
          create: matches.map((m, position) => ({
            sourceTrackId: String(m.track.id),
            title: m.track.title,
            artist: m.track.artist,
            album: m.track.album || null,
            duration: m.track.duration,
            explicit: m.track.explicit,
            previewUrl: m.track.preview,
            coverUrl: m.track.coverUrl,
            isrc: m.track.isrc,
            position,
            matchStatus: m.videoId ? "matched" : "unmatched",
            matchConfidence: m.confidence,
            videoId: m.videoId,
            matchedTitle: m.matchedTitle,
            matchedArtist: m.matchedArtist,
            matchedThumbnailUrl: m.thumbnail,
          })),
        },
      },
      update: {
        title: deezerPlaylist.title,
        description: deezerPlaylist.description,
        creator: deezerPlaylist.creator,
        coverUrl: deezerPlaylist.coverUrl,
        trackCount: deezerPlaylist.trackCount,
        matchedCoverage: coverage,
      },
    });
  } catch {
    // Non-fatal — serve the result even if DB write fails
  }

  const tracks: CuratedPlaylistTrack[] = matched.map((m) => ({
    title: m.track.title,
    artist: m.track.artist,
    videoId: m.videoId!,
    coverUrl: m.thumbnail || m.track.coverUrl || null,
  }));

  return {
    id: fullId,
    title: deezerPlaylist.title,
    description: deezerPlaylist.description
      ? `${deezerPlaylist.description} · Imported from Deezer`
      : `Imported from Deezer by ${deezerPlaylist.creator}`,
    coverUrl: deezerPlaylist.coverUrl,
    source: "atlas",
    category: "imported",
    trackCount: deezerPlaylist.trackCount,
    tracks,
  };
}
