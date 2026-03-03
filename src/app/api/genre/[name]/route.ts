import { NextResponse } from "next/server";
import { getTagTopArtists } from "@/lib/lastfm";
import { getArtistImage } from "@/lib/deezer";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const { name } = await params;
    const tag = name;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "200");

    const artists = await getTagTopArtists(tag, limit);

    // Fetch images for top 20 artists in parallel to populate the grid with high-quality visuals
    const enrichedArtists = await Promise.all(
      artists.map(async (a, i) => {
        if (i < 20 && !a.image) {
          try {
            const deezerImg = await getArtistImage(a.name);
            return { ...a, image: deezerImg };
          } catch {
            return a;
          }
        }
        return a;
      })
    );

    return NextResponse.json({
      tag,
      artists: enrichedArtists,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
