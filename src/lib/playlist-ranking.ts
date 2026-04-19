import type { CatalogEntry } from "@/lib/curated-catalog";
import type { CuratedPlaylist } from "@/lib/ytmusic";

export const DEFAULT_MIN_CURATED_TRACKS = 40;
export const DEFAULT_IDEAL_TRACK_RANGE: [number, number] = [40, 100];

export interface RankedPlaylistCandidate {
  playlist: CuratedPlaylist;
  score: number;
  reasons: string[];
}

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(value: string) {
  return normalizeText(value)
    .split(" ")
    .filter((token) => token.length > 1);
}

function containsPhrase(haystack: string, needle: string) {
  return haystack.includes(normalizeText(needle));
}

function countTermMatches(haystack: string, terms: string[]) {
  let matches = 0;
  for (const term of terms) {
    if (containsPhrase(haystack, term)) matches += 1;
  }
  return matches;
}

function scoreTrackCount(
  playlist: CuratedPlaylist,
  idealTrackRange?: [number, number],
  minTracks = DEFAULT_MIN_CURATED_TRACKS
) {
  const count = playlist.trackCount ?? 0;
  if (count <= 0) return -2;
  if (count < minTracks) return -8;

  const [minIdeal, maxIdeal] = idealTrackRange || DEFAULT_IDEAL_TRACK_RANGE;
  if (count >= minIdeal && count <= maxIdeal) return 4;
  if (count >= minTracks && count < minIdeal) return 1;
  if (count > maxIdeal && count <= maxIdeal + 40) return 1.5;
  if (count > maxIdeal + 40 && count <= maxIdeal + 100) return -0.5;
  if (count > maxIdeal + 100) return -2.5;
  return 0;
}

function getSearchIntentTerms(entry: CatalogEntry) {
  const derived = [
    entry.title,
    entry.subtitle,
    entry.searchQuery,
    ...(entry.tags || []),
    ...(entry.aliases || []),
  ];

  const preferredTerms = [
    ...new Set([
      ...(entry.preferredTerms || []),
      ...derived.flatMap(tokenize).filter((term) => term.length > 2),
    ]),
  ];

  return {
    requiredTerms: entry.requiredTerms || [],
    preferredTerms,
    excludedTerms: entry.excludedTerms || [],
  };
}

export function rankPlaylistCandidates(
  entry: CatalogEntry,
  candidates: CuratedPlaylist[],
  defaultMinTracks = DEFAULT_MIN_CURATED_TRACKS
): RankedPlaylistCandidate[] {
  const { requiredTerms, preferredTerms, excludedTerms } = getSearchIntentTerms(entry);

  return candidates
    .filter((playlist) => Boolean(playlist.id))
    .map((playlist) => {
      const title = normalizeText(playlist.title || "");
      const description = normalizeText(playlist.description || "");
      const searchable = `${title} ${description}`.trim();
      const reasons: string[] = [];
      let score = 0;

      const exactTitleHit = containsPhrase(title, entry.title) || containsPhrase(title, entry.searchQuery);
      if (exactTitleHit) {
        score += 8;
        reasons.push("exact title/query hit");
      }

      const requiredMatches = countTermMatches(searchable, requiredTerms);
      if (requiredTerms.length > 0) {
        if (requiredMatches === requiredTerms.length) {
          score += 6;
          reasons.push("required terms satisfied");
        } else {
          score -= (requiredTerms.length - requiredMatches) * 4;
          reasons.push("missing required terms");
        }
      }

      const preferredMatches = countTermMatches(searchable, preferredTerms);
      if (preferredMatches > 0) {
        score += Math.min(8, preferredMatches * 1.2);
        reasons.push(`preferred terms: ${preferredMatches}`);
      }

      const excludedMatches = countTermMatches(searchable, excludedTerms);
      if (excludedMatches > 0) {
        score -= excludedMatches * 5;
        reasons.push(`excluded terms: ${excludedMatches}`);
      }

      if (playlist.coverUrl) {
        score += 0.5;
        reasons.push("has cover art");
      }

      const trackCountScore = scoreTrackCount(
        playlist,
        entry.idealTrackRange,
        entry.minTracks ?? defaultMinTracks
      );
      score += trackCountScore;
      reasons.push(`track count score: ${trackCountScore.toFixed(1)}`);

      if (description.length > 24) {
        score += 0.75;
        reasons.push("descriptive metadata");
      }

      return {
        playlist,
        score,
        reasons,
      };
    })
    .sort((a, b) => b.score - a.score);
}
