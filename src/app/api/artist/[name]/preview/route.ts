import { NextRequest, NextResponse } from "next/server";
import { searchArtist, getTopTracks } from "@/lib/deezer";
import { getArtistInfo } from "@/lib/lastfm";
import { getItunesTopTracks } from "@/lib/itunes";
import type { PreviewTrack } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  let artistName = decodeURIComponent(name); // Best canonical name we find
  const originalName = artistName; // For Last.fm autocorrect reference

  try {
    let artistId: number | null = null;
    let artistPicture: string | null = null;
    let tracks: PreviewTrack[] = [];

    // --- 1. ATTEMPT DEEZER ---
    try {
      const artist = await searchArtist(artistName);
      if (artist) {
        artistId = artist.id;
        artistName = artist.name;
        artistPicture = artist.picture_medium;
      }
    } catch (e) {
      console.warn("Deezer search failed:", e);
    }

    // --- 2. FALLBACK IMAGE (LAST.FM) ---
    if (!artistPicture) {
      try {
        const lastFmInfo = await getArtistInfo(originalName);
        if (lastFmInfo) {
          artistName = lastFmInfo.name; // This is the autocorrected canonical name
          artistPicture = lastFmInfo.image;
        }
      } catch (e) {
        console.warn("LastFM info fallback failed:", e);
      }
    }

    // --- 3. ATTEMPT DEEZER AUDIO ---
    if (artistId) {
      try {
        const allDeezerTracks = await getTopTracks(artistId, 10);
        tracks = allDeezerTracks.filter((t) => t.preview).slice(0, 5);
      } catch (e) {
        console.warn("Deezer track fetch failed:", e);
      }
    }

    // --- 4. FALLBACK AUDIO (ITUNES) ---
    // If Deezer failed entirely OR Deezer blocks previews for this artist
    if (tracks.length === 0) {
      try {
        // Try iTunes using the best-known artistName
        let itunesTracks = await getItunesTopTracks(artistName, 5);

        // If iTunes fails, and we haven't already autocorrected via LastFM...
        // Force an autocorrect lookup and try iTunes one last time.
        if (itunesTracks.length === 0 && artistName === originalName) {
          try {
            const lastFmInfo = await getArtistInfo(originalName);
            if (lastFmInfo && lastFmInfo.name !== originalName) {
              artistName = lastFmInfo.name; // canonical name 
              itunesTracks = await getItunesTopTracks(artistName, 5);
            }
          } catch (e) {
            console.warn("LastFM autocorrect lookup failed:", e);
          }
        }

        if (itunesTracks.length > 0) {
          tracks = itunesTracks;
        }
      } catch (e) {
        console.warn("iTunes fallback failed:", e);
      }
    }

    return NextResponse.json({
      artist: {
        id: artistId || originalName, // Use raw string as ID if external IDs fail
        name: artistName,
        picture: artistPicture || null,
      },
      tracks,
    });
  } catch (error) {
    console.error("Preview error:", error);
    return NextResponse.json(
      { error: "Failed to fetch previews" },
      { status: 500 }
    );
  }
}
