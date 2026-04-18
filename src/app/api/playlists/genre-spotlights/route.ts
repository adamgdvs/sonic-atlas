import { NextResponse } from "next/server";
import { searchCuratedPlaylists } from "@/lib/ytmusic";

const DEFAULT_QUERIES = [
  "shoegaze playlist",
  "ambient playlist",
  "hyperpop playlist",
  "jazz fusion playlist",
  "dream pop playlist",
  "afrobeats playlist",
];

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const results = await Promise.all(
      DEFAULT_QUERIES.map(async (query) => {
        try {
          const playlists = await searchCuratedPlaylists(query);
          return {
            query,
            playlist: playlists.find((playlist) => Boolean(playlist.id)) || null,
          };
        } catch {
          return {
            query,
            playlist: null,
          };
        }
      })
    );

    return NextResponse.json({
      spotlights: results.filter((item) => item.playlist),
    });
  } catch (error) {
    console.error("Failed to load genre spotlights:", error);
    return NextResponse.json({ spotlights: [] });
  }
}
