import { NextRequest, NextResponse } from "next/server";
import { searchArtist, getArtistDetails } from "@/lib/deezer";
import { getArtistInfo, getTopTags } from "@/lib/lastfm";
import { parseGenres } from "@/lib/genreUtils";
import { searchDiscogsArtist, getDiscogsArtistDetails, getDiscogsGenres } from "@/lib/discogs";
import { dbCache, CacheTTL } from "@/lib/dbCache";

/**
 * Cleans raw bio text from Discogs/Last.fm:
 * - Strips Discogs markup: [URL=...][/URL], [A=...], [R=...], [L=...]
 * - Removes band member listings and "previous names" sections
 * - Strips HTML tags and Last.fm attribution
 * - Truncates to ~2 paragraphs at a natural sentence break
 */
function cleanBio(raw: string): string {
  if (!raw || raw.length < 10) return raw;

  let text = raw;

  // Strip Discogs-style markup tags
  text = text.replace(/\[URL=[^\]]*\]/gi, "");
  text = text.replace(/\[\/URL\]/gi, "");
  text = text.replace(/\[a=([^\]]*)\]/gi, "$1");
  text = text.replace(/\[R=\d+\]/gi, "");
  text = text.replace(/\[l=([^\]]*)\]/gi, "$1");
  text = text.replace(/\[\/?[a-z](?:=[^\]]*)?\]/gi, "");

  // Strip HTML tags
  text = text.replace(/<[^>]+>/g, "");

  // Remove Last.fm attribution
  text = text.replace(/Read more on Last\.fm\.?.*$/i, "");
  text = text.replace(/User-contributed text is available.*$/i, "");

  // Remove band member sections
  text = text.replace(/\b(band\s+members|current\s+(?:live\s+)?members|former\s+members|members|previous\s+names?|line.?up)\s*:[\s\S]*$/i, "");

  // Remove standalone member listings
  text = text.replace(/(\n|^)\s*[A-Z][a-z]+ [A-Z][a-z]+ [–\-] [A-Za-z, ]+\([\d\-–present]+\)[\s\S]*$/g, "");

  // Clean up whitespace
  text = text.replace(/\n{3,}/g, "\n\n");
  text = text.replace(/\s{2,}/g, " ");
  text = text.trim();

  // Truncate to ~2 paragraphs
  const maxLen = 800;
  if (text.length > maxLen) {
    let cutoff = -1;
    for (let i = maxLen; i >= maxLen * 0.5; i--) {
      if (text[i] === "." && (i + 1 >= text.length || text[i + 1] === " " || text[i + 1] === "\n")) {
        cutoff = i + 1;
        break;
      }
    }
    if (cutoff === -1) {
      for (let i = maxLen * 0.5; i >= 200; i--) {
        if (text[Math.floor(i)] === ".") {
          cutoff = Math.floor(i) + 1;
          break;
        }
      }
    }
    if (cutoff === -1) cutoff = maxLen;
    text = text.slice(0, cutoff).trim();
  }

  return text;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  const artistName = name;
  const cacheKey = `info:${artistName.toLowerCase()}`;

  try {
    const result = await dbCache(cacheKey, CacheTTL.FULL_INFO, async () => {
      // Fetch from ALL sources in parallel
      const [deezerRes, lastfmRes, tagsRes, discogsGenresRes, discogsIdRes] = await Promise.allSettled([
        dbCache(`deezer:details:${artistName.toLowerCase()}`, CacheTTL.DEEZER_IMAGE, () =>
          searchArtist(artistName).then(async (a) => {
            if (!a) return null;
            return getArtistDetails(a.id);
          })
        ),
        dbCache(`lastfm:info:${artistName.toLowerCase()}`, CacheTTL.ARTIST_INFO, () =>
          getArtistInfo(artistName)
        ),
        dbCache(`lastfm:tags:${artistName.toLowerCase()}`, CacheTTL.TAGS, () =>
          getTopTags(artistName)
        ),
        dbCache(`discogs:genres:${artistName.toLowerCase()}`, CacheTTL.DISCOGS_GENRES, () =>
          getDiscogsGenres(artistName)
        ),
        dbCache(`discogs:id:${artistName.toLowerCase()}`, CacheTTL.DISCOGS_ARTIST, () =>
          searchDiscogsArtist(artistName)
        ),
      ]);

      const deezer = deezerRes.status === "fulfilled" ? deezerRes.value : null;
      const lastfm = lastfmRes.status === "fulfilled" ? lastfmRes.value : null;
      const tags = tagsRes.status === "fulfilled" ? tagsRes.value : [];
      const discogsG = discogsGenresRes.status === "fulfilled" ? discogsGenresRes.value : { genres: [], styles: [] };
      const discogsId = discogsIdRes.status === "fulfilled" ? discogsIdRes.value : null;

      // Fetch deep Discogs details only if we got an ID
      let discogsArtist = null;
      if (discogsId) {
        discogsArtist = await dbCache(`discogs:artist:${discogsId}`, CacheTTL.DISCOGS_ARTIST, () =>
          getDiscogsArtistDetails(discogsId)
        );
      }

      const genres = parseGenres(tags, 1, discogsG.genres, discogsG.styles);

      const rawBioText = lastfm?.bio || "";
      const discogsBio = discogsArtist?.profile || "";
      const rawBio = discogsBio && discogsBio.length > 50 ? discogsBio : rawBioText;
      const bioText = cleanBio(rawBio);

      const yearMatch = rawBio.match(/\b(19|20)\d{2}\b/);
      const yearStarted = yearMatch ? yearMatch[0] : null;

      let location = null;
      const fromMatch = bioText.match(/from ([\w\s,]+)\./);
      const formedMatch = bioText.match(/formed in ([\w\s,]+)\./i);
      if (fromMatch) location = fromMatch[1].trim();
      else if (formedMatch) location = formedMatch[1].trim();

      return {
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
        discogsId: discogsId || null,
      };
    });

    return NextResponse.json(result);

  } catch (error) {
    console.error("Artist info error:", error);
    return NextResponse.json(
      { error: "Failed to fetch artist info" },
      { status: 500 }
    );
  }
}
