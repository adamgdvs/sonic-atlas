import { NextResponse } from "next/server";
import { getMoodPlaylists } from "@/lib/ytmusic";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ category: string }> }
) {
  try {
    const { category } = await params;
    const playlists = await getMoodPlaylists(decodeURIComponent(category));
    return NextResponse.json({ playlists });
  } catch (error) {
    console.error("Failed to load mood playlists:", error);
    return NextResponse.json({ playlists: [] });
  }
}
