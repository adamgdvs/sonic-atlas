import { NextResponse } from "next/server";
import { DEFAULT_MIN_CURATED_TRACKS } from "@/lib/playlist-ranking";
import { buildResolverEntry, resolveCuratedPlaylist } from "@/lib/curated-resolver";
import { buildVirtualCuratedPlaylist } from "@/lib/virtual-curated";

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

    const playlists = [
      buildVirtualCuratedPlaylist({
        title: query,
        description: `Curated search mix for ${query}`,
        category: "genre",
        query,
      }),
      ...ranked
        .filter((candidate) => {
          const tc = candidate.playlist.trackCount;
          if (typeof tc === "number" && tc > 0 && tc < DEFAULT_MIN_CURATED_TRACKS) return false;
          return true;
        })
        .map((candidate) =>
          buildVirtualCuratedPlaylist({
            title: candidate.playlist.title || query,
            description: candidate.playlist.description || `Curated search mix for ${query}`,
            category: "genre",
            query: candidate.playlist.title || query,
            coverUrl: candidate.playlist.coverUrl,
            trackCount: candidate.playlist.trackCount ?? null,
          })
        ),
    ];

    const seen = new Set<string>();
    return NextResponse.json({
      query,
      playlists: playlists
        .filter((playlist) => {
          const normalized = playlist.title.trim().toLowerCase();
          if (seen.has(normalized)) return false;
          seen.add(normalized);
          return true;
        })
        .slice(0, 10),
    });
  } catch (error) {
    console.error("Failed to search curated playlists:", error);
    return NextResponse.json({
      query,
      playlists: [
        buildVirtualCuratedPlaylist({
          title: query,
          description: `Curated search mix for ${query}`,
          category: "genre",
          query,
        }),
      ],
    });
  }
}
