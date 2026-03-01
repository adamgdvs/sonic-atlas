import { NextResponse } from "next/server";
import { getAlbumTracks } from "@/lib/deezer";

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
    return NextResponse.json({
      tracks: tracks.map((t) => ({
        id: t.id,
        title: t.title,
        preview: t.preview,
        duration: t.duration,
        track_position: 0,
      })),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
