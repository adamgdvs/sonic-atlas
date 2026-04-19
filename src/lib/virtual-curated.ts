import { searchYouTubeMusic } from "@/lib/youtube";
import type { CuratedPlaylist, CuratedPlaylistTrack } from "@/lib/ytmusic";

const VIRTUAL_CURATED_PREFIX = "atlas-curated";
const DEFAULT_VIRTUAL_TRACK_LIMIT = 40;

type VirtualCuratedDescriptor = {
  title: string;
  description: string;
  category: string;
  query: string;
  coverUrl?: string | null;
  trackCount?: number | null;
};

function encodePart(value: string) {
  return encodeURIComponent(value.trim());
}

function decodePart(value: string) {
  return decodeURIComponent(value);
}

export function isVirtualCuratedId(id: string) {
  return id.startsWith(`${VIRTUAL_CURATED_PREFIX}::`);
}

export function buildVirtualCuratedPlaylist({
  title,
  description,
  category,
  query,
  coverUrl = null,
  trackCount = null,
}: VirtualCuratedDescriptor): CuratedPlaylist {
  return {
    id: [
      VIRTUAL_CURATED_PREFIX,
      encodePart(category || "curated"),
      encodePart(title),
      encodePart(query),
    ].join("::"),
    title,
    description,
    coverUrl,
    source: "atlas",
    category,
    trackCount,
  };
}

export function parseVirtualCuratedId(id: string): VirtualCuratedDescriptor | null {
  if (!isVirtualCuratedId(id)) return null;
  const parts = id.split("::");
  if (parts.length < 4) return null;

  return {
    category: decodePart(parts[1]) || "curated",
    title: decodePart(parts[2]) || "Curated Set",
    query: decodePart(parts[3]) || "",
    description: "",
  };
}

function normalizeTrackKey(track: CuratedPlaylistTrack) {
  return track.videoId || `${track.title.toLowerCase()}::${track.artist.toLowerCase()}`;
}

function buildTrackQueries({ title, query }: Pick<VirtualCuratedDescriptor, "title" | "query">) {
  const cleanedQuery = query
    .replace(/\bplaylist\b/gi, "")
    .replace(/\bessentials\b/gi, "")
    .replace(/\bhits\b/gi, "")
    .replace(/\bmix\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
  const cleanedTitle = title.replace(/_/g, " ").trim();

  return [...new Set([
    cleanedTitle,
    cleanedQuery,
    `${cleanedTitle} songs`,
    `${cleanedQuery} songs`,
    `${cleanedTitle} music`,
  ].filter((item) => item && item.length >= 2))];
}

export async function resolveVirtualCuratedPlaylist(
  descriptor: VirtualCuratedDescriptor,
  limit = DEFAULT_VIRTUAL_TRACK_LIMIT
): Promise<CuratedPlaylist> {
  const queries = buildTrackQueries(descriptor);
  const tracks: CuratedPlaylistTrack[] = [];
  const seen = new Set<string>();

  for (const query of queries) {
    const results = await searchYouTubeMusic(query, 20);
    for (const result of results) {
      const track: CuratedPlaylistTrack = {
        title: result.title,
        artist: result.artist,
        videoId: result.videoId,
        coverUrl: result.thumbnailUrl,
      };
      const key = normalizeTrackKey(track);
      if (seen.has(key)) continue;
      seen.add(key);
      tracks.push(track);
      if (tracks.length >= limit) break;
    }
    if (tracks.length >= limit) break;
  }

  const coverUrl = descriptor.coverUrl || tracks[0]?.coverUrl || null;

  return {
    ...buildVirtualCuratedPlaylist({
      ...descriptor,
      coverUrl,
      trackCount: tracks.length,
    }),
    tracks,
  };
}
