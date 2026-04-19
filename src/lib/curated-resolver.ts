import type { CatalogEntry } from "@/lib/curated-catalog";
import { searchCuratedPlaylists, type CuratedPlaylist } from "@/lib/ytmusic";
import {
  DEFAULT_IDEAL_TRACK_RANGE,
  DEFAULT_MIN_CURATED_TRACKS,
  rankPlaylistCandidates,
  type RankedPlaylistCandidate,
} from "@/lib/playlist-ranking";

export interface CuratedResolverOptions {
  minimumConfidence?: number;
  minimumTracks?: number;
  includeAllRanked?: boolean;
}

export interface CuratedResolverResult {
  ranked: RankedPlaylistCandidate[];
  selected: CuratedPlaylist | null;
}

export function buildResolverEntry(
  entry: Pick<CatalogEntry, "title" | "subtitle" | "category" | "searchQuery"> &
    Partial<CatalogEntry> & { slug?: string }
): CatalogEntry {
  const slug =
    entry.slug ||
    entry.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  return {
    slug,
    title: entry.title,
    subtitle: entry.subtitle,
    category: entry.category,
    searchQuery: entry.searchQuery,
    tags: entry.tags || [entry.title.toLowerCase()],
    aliases: entry.aliases,
    requiredTerms: entry.requiredTerms,
    preferredTerms: entry.preferredTerms,
    excludedTerms: entry.excludedTerms,
    featured: entry.featured,
    minTracks: entry.minTracks ?? DEFAULT_MIN_CURATED_TRACKS,
    idealTrackRange: entry.idealTrackRange ?? DEFAULT_IDEAL_TRACK_RANGE,
  };
}

export async function resolveCuratedPlaylist(
  entry: CatalogEntry,
  options: CuratedResolverOptions = {}
): Promise<CuratedResolverResult> {
  const minimumConfidence = options.minimumConfidence ?? 3;
  const minimumTracks = options.minimumTracks ?? entry.minTracks ?? DEFAULT_MIN_CURATED_TRACKS;
  const candidates = await searchCuratedPlaylists(entry.searchQuery);
  const ranked = rankPlaylistCandidates(entry, candidates, minimumTracks);

  // YT Music playlist search results often omit trackCount. Only hard-reject
  // when we know the count is below the floor; unknown counts pass through
  // (the rank model already penalizes them softly via scoreTrackCount).
  const qualifying = ranked.filter((candidate) => {
    if (candidate.score < minimumConfidence) return false;
    const tc = candidate.playlist.trackCount;
    if (typeof tc === "number" && tc > 0 && tc < minimumTracks) return false;
    return true;
  });

  return {
    ranked: options.includeAllRanked ? ranked : qualifying,
    selected: qualifying[0]?.playlist || null,
  };
}
