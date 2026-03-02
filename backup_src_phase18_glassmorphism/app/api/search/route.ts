import { NextRequest, NextResponse } from "next/server";
import { searchArtists } from "@/lib/musicbrainz";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q");
  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  try {
    const artists = await searchArtists(q, 8);
    return NextResponse.json({ results: artists });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: "Search failed" },
      { status: 500 }
    );
  }
}
