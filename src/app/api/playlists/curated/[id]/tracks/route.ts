import { NextResponse } from "next/server";
import { getCuratedPlaylistTracks } from "@/lib/ytmusic";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const playlist = await getCuratedPlaylistTracks(decodeURIComponent(id));
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
