import { searchYouTubeMusic, type YouTubeMusicTrack } from "@/lib/youtube";

export interface DeezerImportTrack {
  deezerId: number;
  title: string;
  artist: string;
  album: string;
  duration: number | null;
  explicit: boolean;
  preview: string | null;
  deezerUrl: string | null;
  timeAdded: number | null;
  coverUrl: string | null;
  isrc: string | null;
}

export interface DeezerImportPlaylist {
  deezerId: number;
  title: string;
  description: string;
  coverUrl: string | null;
  deezerUrl: string | null;
  creatorName: string | null;
  trackCount: number | null;
  checksum: string | null;
  tracks: DeezerImportTrack[];
}

export interface DeezerToYouTubeMatch {
  deezerTrack: DeezerImportTrack;
  videoId: string | null;
  matchedTitle: string | null;
  matchedArtist: string | null;
  thumbnailUrl: string | null;
  confidence: number;
  status: "matched" | "unmatched";
}

type UnknownRecord = Record<string, unknown>;

function isObject(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null;
}

function asString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function getRecord(value: unknown, key: string): UnknownRecord | null {
  if (!isObject(value)) return null;
  const child = value[key];
  return isObject(child) ? child : null;
}

function getArray(value: unknown, key: string): unknown[] {
  if (!isObject(value)) return [];
  const child = value[key];
  return Array.isArray(child) ? child : [];
}

function decodeHtmlEntities(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function cleanWhitespace(value: string) {
  return decodeHtmlEntities(value).replace(/\s+/g, " ").trim();
}

function simplifyTrackTitle(value: string) {
  return cleanWhitespace(
    value
      .replace(/\((feat|ft)\.[^)]+\)/gi, "")
      .replace(/\[(feat|ft)\.[^\]]+\]/gi, "")
      .replace(/\((from the motel|mj lenderman version|radio edit|edit|version)\)/gi, "")
      .replace(/\s+\/\s+.*$/g, "")
  );
}

function normalizeText(value: string) {
  return cleanWhitespace(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function titleWords(value: string) {
  return new Set(normalizeText(value).split(/\s+/).filter(Boolean));
}

function tokenOverlap(left: string, right: string) {
  const leftWords = titleWords(left);
  const rightWords = titleWords(right);
  if (leftWords.size === 0 || rightWords.size === 0) return 0;

  let overlap = 0;
  for (const word of leftWords) {
    if (rightWords.has(word)) overlap += 1;
  }

  return overlap / Math.max(leftWords.size, rightWords.size);
}

function stringSimilarity(left: string, right: string) {
  const a = normalizeText(left);
  const b = normalizeText(right);
  if (!a || !b) return 0;
  if (a === b) return 1;
  if (a.includes(b) || b.includes(a)) return 0.92;
  return tokenOverlap(a, b);
}

function durationCloseness(left: number | null, right: number | null) {
  if (typeof left !== "number" || typeof right !== "number") return 0;
  const delta = Math.abs(left - right);
  if (delta <= 2) return 1;
  if (delta <= 5) return 0.8;
  if (delta <= 10) return 0.55;
  if (delta <= 20) return 0.2;
  return 0;
}

function normalizeRawTrack(raw: unknown): DeezerImportTrack | null {
  if (!isObject(raw)) return null;

  const artist = getRecord(raw, "artist");
  const album = getRecord(raw, "album");
  const deezerId = asNumber(raw.id);
  const title = asString(raw.title);
  const artistName = asString(artist?.name);

  if (!deezerId || !title || !artistName) return null;

  return {
    deezerId,
    title: cleanWhitespace(title),
    artist: cleanWhitespace(artistName),
    album: cleanWhitespace(asString(album?.title) || ""),
    duration: asNumber(raw.duration),
    explicit: Boolean(raw.explicit_lyrics),
    preview: asString(raw.preview),
    deezerUrl: asString(raw.link),
    timeAdded: asNumber(raw.time_add),
    coverUrl:
      asString(album?.cover_xl) ||
      asString(album?.cover_big) ||
      asString(album?.cover_medium) ||
      asString(album?.cover) ||
      null,
    isrc: asString(raw.isrc),
  };
}

function collectRawTracks(playlistPayload: unknown, trackPages: unknown[]) {
  const rawTracks: unknown[] = [];
  const embedded = getRecord(playlistPayload, "tracks");
  rawTracks.push(...getArray(embedded, "data"));

  for (const page of trackPages) {
    rawTracks.push(...getArray(page, "data"));
  }

  return rawTracks;
}

export function normalizeDeezerPlaylistImport(
  playlistPayload: unknown,
  trackPages: unknown[] = []
): DeezerImportPlaylist {
  if (!isObject(playlistPayload)) {
    throw new Error("Playlist payload must be an object");
  }

  const deezerId = asNumber(playlistPayload.id);
  const title = asString(playlistPayload.title);
  if (!deezerId || !title) {
    throw new Error("Playlist payload is missing id or title");
  }

  const creator = getRecord(playlistPayload, "creator");
  const seen = new Set<number>();
  const tracks = collectRawTracks(playlistPayload, trackPages)
    .map(normalizeRawTrack)
    .filter((track): track is DeezerImportTrack => track !== null)
    .filter((track) => {
      if (seen.has(track.deezerId)) return false;
      seen.add(track.deezerId);
      return true;
    });

  return {
    deezerId,
    title: cleanWhitespace(title),
    description: cleanWhitespace(asString(playlistPayload.description) || ""),
    coverUrl:
      asString(playlistPayload.picture_xl) ||
      asString(playlistPayload.picture_big) ||
      asString(playlistPayload.picture_medium) ||
      asString(playlistPayload.picture) ||
      null,
    deezerUrl: asString(playlistPayload.link) || asString(playlistPayload.share),
    creatorName: cleanWhitespace(asString(creator?.name) || ""),
    trackCount: asNumber(playlistPayload.nb_tracks),
    checksum: asString(playlistPayload.checksum),
    tracks,
  };
}

function scoreCandidate(track: DeezerImportTrack, candidate: YouTubeMusicTrack) {
  const sourceTitle = simplifyTrackTitle(track.title);
  const titleScore = stringSimilarity(sourceTitle, candidate.title);
  const artistScore = stringSimilarity(track.artist, candidate.artist);
  const durationScore = durationCloseness(track.duration, candidate.duration || null);

  let score = titleScore * 0.58 + artistScore * 0.34 + durationScore * 0.08;

  const normalizedCandidate = normalizeText(candidate.title);
  if (normalizedCandidate.includes("karaoke")) score -= 0.35;
  if (normalizedCandidate.includes("instrumental")) score -= 0.15;
  if (normalizedCandidate.includes("sped up")) score -= 0.2;
  if (normalizedCandidate.includes("slowed")) score -= 0.2;
  if (normalizedCandidate.includes("nightcore")) score -= 0.3;

  return Math.max(0, Math.min(1, score));
}

export async function matchDeezerTrackToYouTube(
  track: DeezerImportTrack,
  limit = 5
): Promise<DeezerToYouTubeMatch> {
  const query = `${track.artist} ${simplifyTrackTitle(track.title)}`.trim();

  try {
    const results = await searchYouTubeMusic(query, Math.min(Math.max(limit, 1), 10));
    const ranked = results
      .map((candidate) => ({
        candidate,
        score: scoreCandidate(track, candidate),
      }))
      .sort((left, right) => right.score - left.score);

    const best = ranked[0];
    if (!best || best.score < 0.55 || !best.candidate.videoId) {
      return {
        deezerTrack: track,
        videoId: null,
        matchedTitle: null,
        matchedArtist: null,
        thumbnailUrl: null,
        confidence: best?.score || 0,
        status: "unmatched",
      };
    }

    return {
      deezerTrack: track,
      videoId: best.candidate.videoId,
      matchedTitle: best.candidate.title,
      matchedArtist: best.candidate.artist,
      thumbnailUrl: best.candidate.thumbnailUrl,
      confidence: best.score,
      status: "matched",
    };
  } catch {
    return {
      deezerTrack: track,
      videoId: null,
      matchedTitle: null,
      matchedArtist: null,
      thumbnailUrl: null,
      confidence: 0,
      status: "unmatched",
    };
  }
}

export async function matchDeezerPlaylistToYouTube(
  playlist: DeezerImportPlaylist,
  options: { limit?: number; batchSize?: number } = {}
) {
  const limit = Math.max(1, options.limit ?? playlist.tracks.length);
  const batchSize = Math.max(1, Math.min(options.batchSize ?? 6, 12));
  const matches: DeezerToYouTubeMatch[] = [];
  const targetTracks = playlist.tracks.slice(0, limit);

  for (let index = 0; index < targetTracks.length; index += batchSize) {
    const batch = targetTracks.slice(index, index + batchSize);
    const batchMatches = await Promise.all(
      batch.map((track) => matchDeezerTrackToYouTube(track))
    );
    matches.push(...batchMatches);
  }

  const matched = matches.filter((match) => match.status === "matched");
  const unmatched = matches.length - matched.length;

  return {
    playlist,
    matches,
    stats: {
      requested: targetTracks.length,
      matched: matched.length,
      unmatched,
      coverage: targetTracks.length > 0 ? matched.length / targetTracks.length : 0,
    },
  };
}
