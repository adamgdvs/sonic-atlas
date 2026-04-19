import { NextResponse } from "next/server";
import { searchCuratedPlaylists } from "@/lib/ytmusic";
import { buildVirtualCuratedPlaylist } from "@/lib/virtual-curated";

const DEFAULT_QUERIES = [
  "shoegaze essentials playlist",
  "ambient drone playlist",
  "hyperpop playlist",
  "jazz fusion playlist",
  "dream pop playlist",
  "afrobeats playlist",
  "lo-fi hip hop playlist",
  "city pop playlist",
  "post-rock playlist",
  "bossa nova playlist",
  "neo-soul playlist",
  "krautrock playlist",
];

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const results = await Promise.all(
      DEFAULT_QUERIES.map(async (query) => {
        try {
          const playlists = await searchCuratedPlaylists(query);
          const selected = playlists.find((playlist) => Boolean(playlist.id)) || null;
          return {
            query,
            playlist: buildVirtualCuratedPlaylist({
              title: query.replace(/\bplaylist\b/gi, "").trim(),
              description: `Genre spotlight for ${query.replace(/\bplaylist\b/gi, "").trim()}`,
              category: "genre",
              query,
              coverUrl: selected?.coverUrl || null,
              trackCount: selected?.trackCount ?? null,
            }),
          };
        } catch {
          return {
            query,
            playlist: buildVirtualCuratedPlaylist({
              title: query.replace(/\bplaylist\b/gi, "").trim(),
              description: `Genre spotlight for ${query.replace(/\bplaylist\b/gi, "").trim()}`,
              category: "genre",
              query,
            }),
          };
        }
      })
    );

    return NextResponse.json({
      spotlights: results,
    });
  } catch (error) {
    console.error("Failed to load genre spotlights:", error);
    return NextResponse.json({ spotlights: [] });
  }
}
