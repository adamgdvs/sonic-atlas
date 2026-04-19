import { NextResponse } from "next/server";
import { getImportedPlaylistTracks, isImportedDeezerId } from "@/lib/imported-playlists";
import { getCuratedPlaylistTracks } from "@/lib/ytmusic";
import {
  isVirtualCuratedId,
  parseVirtualCuratedId,
  resolveVirtualCuratedPlaylist,
} from "@/lib/virtual-curated";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const decodedId = decodeURIComponent(id);
    const playlist = isImportedDeezerId(decodedId)
      ? await getImportedPlaylistTracks(decodedId)
      : isVirtualCuratedId(decodedId)
        ? await resolveVirtualCuratedPlaylist(parseVirtualCuratedId(decodedId)!)
        : await getCuratedPlaylistTracks(decodedId);
    return NextResponse.json(playlist);
  } catch (error) {
    console.error("Failed to load curated playlist tracks:", error);
    return NextResponse.json(
      {
        id: "",
        title: "",
        description: "",
        coverUrl: null,
        source: "ytmusic",
        category: "curated",
        tracks: [],
      },
      { status: 200 }
    );
  }
}
