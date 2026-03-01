import { NextRequest, NextResponse } from "next/server";
import { searchArtist, getAlbums, getTopTracks } from "@/lib/deezer";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  const artistName = name;

  try {
    const deezerArtist = await searchArtist(artistName);
    if (!deezerArtist) {
      return NextResponse.json({ albums: [], topTracks: [] });
    }

    const [albums, topTracks] = await Promise.all([
      getAlbums(deezerArtist.id, 20),
      getTopTracks(deezerArtist.id, 10),
    ]);

    return NextResponse.json({
      albums,
      topTracks,
      artistImage: deezerArtist.picture_big || deezerArtist.picture_medium,
    });
  } catch (error) {
    console.error("Discography error:", error);
    return NextResponse.json(
      { error: "Failed to fetch discography" },
      { status: 500 }
    );
  }
}
