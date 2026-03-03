import { NextRequest, NextResponse } from "next/server";
import { searchArtist, getArtistDetails } from "@/lib/deezer";
import { getArtistInfo } from "@/lib/lastfm";
import { getTopTags } from "@/lib/lastfm";
import { parseGenres } from "@/lib/genreUtils";

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

    // --- Phase 9: Genre Classification Engine ---
    const genres = parseGenres(tags, 1);

    // --- Extract Metadata Scans ---
    const bioText = lastfm?.bio || "";
    const yearMatch = bioText.match(/\b(19|20)\d{2}\b/);
    const yearStarted = yearMatch ? yearMatch[0] : null;

    // Simple location extraction (very rough, usually follows "from " or "formed in ")
    let location = null;
    const fromMatch = bioText.match(/from ([\w\s,]+)\./);
    const formedMatch = bioText.match(/formed in ([\w\s,]+)\./i);
    if (fromMatch) location = fromMatch[1].trim();
    else if (formedMatch) location = formedMatch[1].trim();

    return NextResponse.json({
      name: lastfm?.name || artistName,
      image: deezer?.picture_big || deezer?.picture_medium || lastfm?.image || null,
      listeners: lastfm?.listeners || 0,
      playcount: lastfm?.playcount || 0,
      bio: bioText,
      genres,
      deezerId: deezer?.id || null,
      nbAlbums: deezer?.nb_album || 0,
      nbFans: deezer?.nb_fan || 0,
      location,
      yearStarted,
    });
  } catch (error) {
    console.error("Artist info error:", error);
    return NextResponse.json(
      { error: "Failed to fetch artist info" },
      { status: 500 }
    );
  }
}
