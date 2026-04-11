import { NextResponse } from "next/server";
import { getAlbumTracks } from "@/lib/deezer";
import { findYouTubeVideoId } from "@/lib/youtube";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const albumId = parseInt(id);
    if (isNaN(albumId)) {
      return NextResponse.json({ error: "Invalid album ID" }, { status: 400 });
    }

    const tracks = await getAlbumTracks(albumId);
    const artistName = tracks[0]?.artist?.name;

    // Enrich each track with a YouTube videoId via per-track search
    const enrichedTracks = await Promise.all(
      tracks.map(async (t) => {
        let videoId: string | null = null;
        if (artistName) {
          try {
            videoId = await findYouTubeVideoId(artistName, t.title);
          } catch {
            // skip enrichment for this track
          }
        }
        return {
          id: t.id,
          title: t.title,
          preview: t.preview,
          duration: t.duration,
          track_position: 0,
          videoId,
        };
      })
    );

    const matched = enrichedTracks.filter((t) => t.videoId).length;
    console.log(
      `[AlbumTracks] YouTube enrichment: ${matched}/${tracks.length} matched for album ${albumId} ("${artistName}")`
    );

    return NextResponse.json({ tracks: enrichedTracks });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
