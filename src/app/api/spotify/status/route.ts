import { NextResponse } from "next/server";
import { getFeaturedPlaylists, getCategoryPlaylists } from "@/lib/spotify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const hasClientId = Boolean(process.env.SPOTIFY_CLIENT_ID);
  const hasClientSecret = Boolean(process.env.SPOTIFY_CLIENT_SECRET);
  const credsPresent = hasClientId && hasClientSecret;

  if (!credsPresent) {
    return NextResponse.json({
      ok: false,
      credsPresent: false,
      message: "SPOTIFY_CLIENT_ID or SPOTIFY_CLIENT_SECRET missing from environment",
    });
  }

  try {
    const [featured, moodPlaylists] = await Promise.all([
      getFeaturedPlaylists(5),
      getCategoryPlaylists("mood", 5),
    ]);

    return NextResponse.json({
      ok: true,
      credsPresent: true,
      featured: { count: featured.length, sample: featured.slice(0, 3).map((p) => p.name) },
      mood: { count: moodPlaylists.length, sample: moodPlaylists.slice(0, 3).map((p) => p.name) },
    });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      credsPresent: true,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
