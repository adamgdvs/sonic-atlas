import { NextResponse } from "next/server";
import { getSimilarTags } from "@/lib/lastfm";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const { name } = await params;
    const tag = name;

    const similar = await getSimilarTags(tag);
    return NextResponse.json({ similar });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
