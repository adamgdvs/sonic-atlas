import { NextResponse } from "next/server";
import { type CuratedPlaylist } from "@/lib/ytmusic";
import { CURATED_CATALOG, MIN_TRACKS, type CatalogEntry } from "@/lib/curated-catalog";
import { resolveCuratedPlaylist } from "@/lib/curated-resolver";
import { buildVirtualCuratedPlaylist } from "@/lib/virtual-curated";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export interface ResolvedCatalogItem {
  entry: CatalogEntry;
  playlist: CuratedPlaylist | null;
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

  let entries = CURATED_CATALOG;
  if (category) entries = entries.filter((e) => e.category === category);
  if (featured) entries = entries.filter((e) => e.featured);

  const items = await Promise.all(entries.map(resolveEntry));

  return NextResponse.json({
    catalog: items.filter((item) => item.playlist),
    minTracks: MIN_TRACKS,
  });
}
