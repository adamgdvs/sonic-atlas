import { NextResponse } from "next/server";
import { NOISE_FILTER } from "@/lib/genreUtils";

const LASTFM_API_KEY = process.env.LASTFM_API_KEY;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "2000");

    if (!LASTFM_API_KEY) {
      throw new Error("LASTFM_API_KEY is not configured");
    }

    const res = await fetch(
      `http://ws.audioscrobbler.com/2.0/?method=chart.gettoptags&api_key=${LASTFM_API_KEY}&limit=${limit}&format=json`
    );

    if (!res.ok) {
      throw new Error("Failed to fetch top tags from Last.fm");
    }

    const data = await res.json();
    const allTags = data.tags?.tag || [];

    // Filter noise out and map to our expected shape
    const filteredTags = allTags
      .filter((t: any) => !NOISE_FILTER.has(t.name.toLowerCase()))
      .slice(0, limit)
      .map((t: any) => ({
        name: t.name,
        count: parseInt(t.reach || t.taggings || "0"),
      }));

    return NextResponse.json({ genres: filteredTags });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
