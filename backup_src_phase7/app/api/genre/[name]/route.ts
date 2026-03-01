import { NextResponse } from "next/server";
import { getTagTopArtists } from "@/lib/lastfm";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const { name } = await params;
    const tag = name;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "200");

    const artists = await getTagTopArtists(tag, limit);

    return NextResponse.json({
      tag,
      artists,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
