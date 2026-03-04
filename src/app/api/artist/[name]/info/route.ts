import { NextRequest, NextResponse } from "next/server";
import { searchArtist, getArtistDetails } from "@/lib/deezer";
import { getArtistInfo, getTopTags } from "@/lib/lastfm";
import { parseGenres } from "@/lib/genreUtils";
import { searchDiscogsArtist, getDiscogsArtistDetails, getDiscogsGenres } from "@/lib/discogs";

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
  // [URL=http://...]link text[/URL] → link text
  text = text.replace(/\[URL=[^\]]*\]/gi, "");
  text = text.replace(/\[\/URL\]/gi, "");
  // [A=Artist Name] → Artist Name
  text = text.replace(/\[a=([^\]]*)\]/gi, "$1");
  // [R=123456] → (remove entirely, these are record IDs)
  text = text.replace(/\[R=\d+\]/gi, "");
  // [L=Label Name] → Label Name
  text = text.replace(/\[l=([^\]]*)\]/gi, "$1");
  // Any remaining bracket tags
  text = text.replace(/\[\/?[a-z](?:=[^\]]*)?\]/gi, "");

  // Strip HTML tags (from Last.fm bios)
  text = text.replace(/<[^>]+>/g, "");

  // Remove "Read more on Last.fm" and similar attribution
  text = text.replace(/Read more on Last\.fm\.?.*$/i, "");
  text = text.replace(/User-contributed text is available.*$/i, "");

  // Remove band member sections — typically starts with patterns like:
  // "Band Members:" or "Members:" or "Current Members:" etc.
  text = text.replace(/\b(band\s+members|current\s+(?:live\s+)?members|former\s+members|members|previous\s+names?|line.?up)\s*:[\s\S]*$/i, "");

  // Remove standalone member listings (Name – Instrument patterns at end)
  // These often appear as "Name – instrument (year-present)" one after another
  text = text.replace(/(\n|^)\s*[A-Z][a-z]+ [A-Z][a-z]+ [–\-] [A-Za-z, ]+\([\d\-–present]+\)[\s\S]*$/g, "");

  // Clean up whitespace
  text = text.replace(/\n{3,}/g, "\n\n");
  text = text.replace(/\s{2,}/g, " ");
  text = text.trim();

  // Truncate to ~2 paragraphs: find a sentence end within 800 chars
  const maxLen = 800;
  if (text.length > maxLen) {
    // Try to break at a sentence boundary (period followed by space or end)
    let cutoff = -1;
    for (let i = maxLen; i >= maxLen * 0.5; i--) {
      if (text[i] === "." && (i + 1 >= text.length || text[i + 1] === " " || text[i + 1] === "\n")) {
        cutoff = i + 1;
        break;
      }
    }
    // If no good sentence break found, try a shorter window
    if (cutoff === -1) {
      for (let i = maxLen * 0.5; i >= 200; i--) {
        if (text[Math.floor(i)] === ".") {
          cutoff = Math.floor(i) + 1;
          break;
        }
      }
    }
    // Fallback: just cut at maxLen with ellipsis
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
    const rawBio = discogsBio && discogsBio.length > 50 ? discogsBio : rawBioText;
    const bioText = cleanBio(rawBio);

    // --- Extract Year Started (use raw bio for extraction before cleaning) ---
    const yearMatch = rawBio.match(/\b(19|20)\d{2}\b/);
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
