import { NextResponse } from "next/server";
import { DEFAULT_MIN_CURATED_TRACKS } from "@/lib/playlist-ranking";
import { buildResolverEntry, resolveCuratedPlaylist } from "@/lib/curated-resolver";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = (searchParams.get("q") || "").trim();

  if (query.length < 2) {
    return NextResponse.json({ query, playlists: [] });
  }

  try {
    const rankingEntry = buildResolverEntry({
      title: query,
      subtitle: `search for ${query}`,
      category: "genre",
      searchQuery: query,
      tags: query.toLowerCase().split(/\s+/),
      preferredTerms: [query],
      minTracks: DEFAULT_MIN_CURATED_TRACKS,
      idealTrackRange: [40, 100],
    });
    const { ranked } = await resolveCuratedPlaylist(rankingEntry, {
      minimumTracks: DEFAULT_MIN_CURATED_TRACKS,
      minimumConfidence: 0,
      includeAllRanked: true,
    });
    return NextResponse.json({
      query,
      playlists: ranked
        .filter((candidate) => (candidate.playlist.trackCount ?? 0) >= DEFAULT_MIN_CURATED_TRACKS)
        .map((candidate) => candidate.playlist)
        .slice(0, 10),
    });
  } catch (error) {
    console.error("Failed to search curated playlists:", error);
    return NextResponse.json({ query, playlists: [] });
  }
}
