import { NextRequest, NextResponse } from "next/server";
import { searchArtist, getArtistDetails } from "@/lib/deezer";
import { getArtistInfo, getTopTags } from "@/lib/lastfm";
import { parseGenres } from "@/lib/genreUtils";
import { searchDiscogsArtist, getDiscogsArtistDetails, getDiscogsGenres } from "@/lib/discogs";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  const artistName = name;

  try {
    // Fetch from ALL sources in parallel (including Discogs search)
    const [deezerRes, lastfmRes, tagsRes, discogsGenresRes, discogsIdRes] = await Promise.allSettled([
      searchArtist(artistName).then(async (a) => {
        if (!a) return null;
        return getArtistDetails(a.id);
      }),
      getArtistInfo(artistName),
      getTopTags(artistName),
      getDiscogsGenres(artistName),
      searchDiscogsArtist(artistName) // Now parallel instead of sequential
    ]);

    const deezer = deezerRes.status === "fulfilled" ? deezerRes.value : null;
    const lastfm = lastfmRes.status === "fulfilled" ? lastfmRes.value : null;
    const tags = tagsRes.status === "fulfilled" ? tagsRes.value : [];
    const discogsG = discogsGenresRes.status === "fulfilled" ? discogsGenresRes.value : { genres: [], styles: [] };
    const discogsId = discogsIdRes.status === "fulfilled" ? discogsIdRes.value : null;

    // Fetch deep Discogs details (bio/metadata) only if we got an ID
    let discogsArtist = null;
    if (discogsId) {
      discogsArtist = await getDiscogsArtistDetails(discogsId);
    }

    // --- Phase 23: Genre Classification Engine (Discogs Hierarchical) ---
    const genres = parseGenres(tags, 1, discogsG.genres, discogsG.styles);

    // --- Metadata Scans ---
    const rawBioText = lastfm?.bio || "";
    const discogsBio = discogsArtist?.profile || "";

    // Use Discogs bio if available, as it's often more "dossier-like"
    const bioText = discogsBio && discogsBio.length > 50 ? discogsBio : rawBioText;

    // --- Extract Year Started ---
    const yearMatch = bioText.match(/\b(19|20)\d{2}\b/);
    const yearStarted = yearMatch ? yearMatch[0] : null;

    // --- Location Extraction (Discogs override available in some cases) ---
    // Note: Discogs doesn't have a direct 'location' field on the Artist object standard, 
    // but sometimes it's in the profile. We'll keep the current logic but clean it.
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
      discogsId: discogsId || null
    });

  } catch (error) {
    console.error("Artist info error:", error);
    return NextResponse.json(
      { error: "Failed to fetch artist info" },
      { status: 500 }
    );
  }
}
