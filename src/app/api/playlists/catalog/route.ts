import { NextResponse } from "next/server";
import { type CuratedPlaylist } from "@/lib/ytmusic";
import {
  CURATED_CATALOG,
  MIN_TRACKS,
  PRIORITY_CURATED_SLUGS,
  type CatalogEntry,
} from "@/lib/curated-catalog";
import { resolveCuratedPlaylist } from "@/lib/curated-resolver";
import { buildVirtualCuratedPlaylist } from "@/lib/virtual-curated";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export interface ResolvedCatalogItem {
  entry: CatalogEntry;
  playlist: CuratedPlaylist | null;
  isPriority?: boolean;
  debug?: {
    topCandidates: Array<{
      title: string;
      score: number;
      trackCount: number | null | undefined;
      reasons: string[];
    }>;
  };
}

async function resolveEntry(entry: CatalogEntry): Promise<ResolvedCatalogItem> {
  try {
    const { ranked, selected } = await resolveCuratedPlaylist(entry, {
      minimumTracks: MIN_TRACKS,
      includeAllRanked: true,
    });
    const playlist = selected;

    return {
      entry,
      isPriority: PRIORITY_CURATED_SLUGS.includes(entry.slug),
      playlist: buildVirtualCuratedPlaylist({
        title: entry.title,
        description: entry.subtitle,
        category: entry.category,
        query: entry.searchQuery,
        coverUrl: playlist?.coverUrl || null,
        trackCount: playlist?.trackCount ?? null,
      }),
      ...(process.env.NODE_ENV !== "production"
        ? {
            debug: {
              topCandidates: ranked.slice(0, 3).map((candidate) => ({
                title: candidate.playlist.title,
                score: Number(candidate.score.toFixed(2)),
                trackCount: candidate.playlist.trackCount,
                reasons: candidate.reasons,
              })),
            },
          }
        : {}),
    };
  } catch {
    return { entry, playlist: null };
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const category = url.searchParams.get("category");
  const featured = url.searchParams.get("featured") === "1";
  const priority = url.searchParams.get("priority") === "1";
  const limitParam = Number.parseInt(url.searchParams.get("limit") || "", 10);

  let entries = CURATED_CATALOG;
  if (category) entries = entries.filter((e) => e.category === category);
  if (featured) entries = entries.filter((e) => e.featured);
  if (priority) {
    const prioritySet = new Set(PRIORITY_CURATED_SLUGS);
    entries = entries.filter((e) => prioritySet.has(e.slug));
  }

  const items = await Promise.all(entries.map(resolveEntry));
  const priorityOrder = new Map(PRIORITY_CURATED_SLUGS.map((slug, index) => [slug, index]));
  const sorted = items
    .filter((item) => item.playlist)
    .sort((left, right) => {
      const leftPriority = left.isPriority ? 1 : 0;
      const rightPriority = right.isPriority ? 1 : 0;
      if (leftPriority !== rightPriority) return rightPriority - leftPriority;

      const leftIndex = priorityOrder.get(left.entry.slug) ?? Number.MAX_SAFE_INTEGER;
      const rightIndex = priorityOrder.get(right.entry.slug) ?? Number.MAX_SAFE_INTEGER;
      if (leftIndex !== rightIndex) return leftIndex - rightIndex;

      return left.entry.title.localeCompare(right.entry.title);
    });
  const catalog = Number.isFinite(limitParam) && limitParam > 0
    ? sorted.slice(0, limitParam)
    : sorted;

  return NextResponse.json({
    catalog,
    minTracks: MIN_TRACKS,
    priorityCount: PRIORITY_CURATED_SLUGS.length,
  });
}
