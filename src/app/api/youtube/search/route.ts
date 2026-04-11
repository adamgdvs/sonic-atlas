import { NextRequest, NextResponse } from "next/server";
import { searchYouTubeMusic } from "@/lib/youtube";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Search YouTube Music for tracks by artist name.
 * Returns videoIds that can be used with /api/stream/[videoId].
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");
  const limit = parseInt(searchParams.get("limit") || "5", 10);

  if (!query || query.length < 2) {
    return NextResponse.json(
      { error: "Query parameter 'q' is required (min 2 chars)" },
      { status: 400 }
    );
  }

  try {
    const tracks = await searchYouTubeMusic(query, Math.min(limit, 20));

    return NextResponse.json({ tracks });
  } catch (error) {
    console.error("YouTube search error:", error);
    return NextResponse.json(
      { error: "YouTube search failed" },
      { status: 500 }
    );
  }
}
