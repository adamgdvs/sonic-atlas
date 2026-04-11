import { NextRequest, NextResponse } from "next/server";
import { searchArtist, getAlbums, getTopTracks } from "@/lib/deezer";
import { searchYouTubeMusic } from "@/lib/youtube";

export const runtime = "nodejs";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  const artistName = decodeURIComponent(name);

  try {
    const deezerArtist = await searchArtist(artistName);
    if (!deezerArtist) {
      return NextResponse.json({ albums: [], topTracks: [] });
    }

    const [albums, topTracks] = await Promise.all([
      getAlbums(deezerArtist.id, 20),
      getTopTracks(deezerArtist.id, 10),
    ]);

    // Enrich top tracks with YouTube videoIds for full song playback
    let enrichedTopTracks = topTracks;
    try {
      const ytResults = await searchYouTubeMusic(deezerArtist.name || artistName, 15);
      const ytTracks = ytResults.map((t) => ({ videoId: t.videoId, title: t.title }));

      if (ytTracks.length > 0) {
        enrichedTopTracks = topTracks.map((track) => {
          const normalizedTitle = track.title.toLowerCase().replace(/[^a-z0-9]/g, "");
          const match = ytTracks.find((yt) => {
            const ytNormalized = yt.title.toLowerCase().replace(/[^a-z0-9]/g, "");
            return (
              ytNormalized === normalizedTitle ||
              ytNormalized.includes(normalizedTitle) ||
              normalizedTitle.includes(ytNormalized)
            );
          });
          return {
            ...track,
            videoId: match?.videoId || null,
          };
        });
        console.log(`[Discography] YouTube enrichment: ${ytTracks.length} YT tracks, ${enrichedTopTracks.filter(t => (t as { videoId?: string | null }).videoId).length}/${topTracks.length} matched for "${artistName}"`);
      }
    } catch (e) {
      console.warn("[Discography] YouTube enrichment failed:", e);
    }

    return NextResponse.json({
      albums,
      topTracks: enrichedTopTracks,
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
