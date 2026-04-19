import { NextResponse } from "next/server";
import { searchCuratedPlaylists, type CuratedPlaylist } from "@/lib/ytmusic";
import {
  CURATED_CATALOG,
  MIN_TRACKS,
  type CatalogEntry,
} from "@/lib/curated-catalog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export interface ResolvedCatalogItem {
  entry: CatalogEntry;
  playlist: CuratedPlaylist | null;
}

async function resolveEntry(entry: CatalogEntry): Promise<ResolvedCatalogItem> {
  try {
    const candidates = await searchCuratedPlaylists(entry.searchQuery);
    const qualifying = candidates.find(
      (p) => p.id && typeof p.trackCount === "number" && p.trackCount >= MIN_TRACKS
    );
    const fallback = !qualifying
      ? candidates.find((p) => p.id && (p.trackCount ?? 0) >= 20)
      : null;
    const playlist = qualifying || fallback || null;

    if (!playlist) return { entry, playlist: null };

    return {
      entry,
      playlist: {
        ...playlist,
        category: entry.category,
        title: playlist.title || entry.title,
        description: playlist.description || entry.subtitle,
      },
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
