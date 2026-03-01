import { NextRequest, NextResponse } from "next/server";
import { searchArtist, getArtistDetails } from "@/lib/deezer";
import { getArtistInfo } from "@/lib/lastfm";
import { getTopTags } from "@/lib/lastfm";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  const artistName = name;

  try {
    // Fetch from Deezer and Last.fm in parallel
    const [deezerResult, lastfmResult, tagsResult] = await Promise.allSettled([
      searchArtist(artistName).then(async (a) => {
        if (!a) return null;
        return getArtistDetails(a.id);
      }),
      getArtistInfo(artistName),
      getTopTags(artistName),
    ]);

    const deezer =
      deezerResult.status === "fulfilled" ? deezerResult.value : null;
    const lastfm =
      lastfmResult.status === "fulfilled" ? lastfmResult.value : null;
    const tags =
      tagsResult.status === "fulfilled" ? tagsResult.value : [];

    // Merge genres from Last.fm tags (filter to meaningful ones)
    const genres = tags
      .filter((t) => t.count > 20)
      .slice(0, 8)
      .map((t) => t.name);

    return NextResponse.json({
      name: lastfm?.name || artistName,
      image: deezer?.picture_big || deezer?.picture_medium || lastfm?.image || null,
      listeners: lastfm?.listeners || 0,
      playcount: lastfm?.playcount || 0,
      bio: lastfm?.bio || "",
      genres,
      deezerId: deezer?.id || null,
      nbAlbums: deezer?.nb_album || 0,
      nbFans: deezer?.nb_fan || 0,
    });
  } catch (error) {
    console.error("Artist info error:", error);
    return NextResponse.json(
      { error: "Failed to fetch artist info" },
      { status: 500 }
    );
  }
}
