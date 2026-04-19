import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Raw diagnostic — bypasses all wrappers and dbCache to show exactly what Spotify returns
async function rawSpotifyTest() {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!clientId || !clientSecret) return { error: "Missing credentials" };

  // Step 1: get a token directly
  const basic = Buffer.from(`${clientId}:${clientSecret}`, "utf8").toString("base64");
  const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { Authorization: `Basic ${basic}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });
  if (!tokenRes.ok) return { error: `Token fetch failed: ${tokenRes.status}` };
  const tokenData = (await tokenRes.json()) as { access_token?: string };
  if (!tokenData.access_token) return { error: "No access_token in response" };

  // Step 2: raw search query
  const searchRes = await fetch(
    "https://api.spotify.com/v1/search?q=mood+booster+playlist&type=playlist&limit=5",
    { headers: { Authorization: `Bearer ${tokenData.access_token}` }, cache: "no-store" }
  );
  if (!searchRes.ok) return { error: `Search failed: ${searchRes.status}` };
  const searchData = (await searchRes.json()) as {
    playlists?: { items?: Array<{ id: string; name: string; tracks?: { total: number } }> };
  };

  const items = searchData.playlists?.items || [];
  return {
    tokenOk: true,
    searchStatus: searchRes.status,
    resultCount: items.length,
    sample: items.slice(0, 3).map((p) => ({ id: p.id, name: p.name, tracks: p.tracks?.total })),
  };
}

export async function GET() {
  const hasClientId = Boolean(process.env.SPOTIFY_CLIENT_ID);
  const hasClientSecret = Boolean(process.env.SPOTIFY_CLIENT_SECRET);

  if (!hasClientId || !hasClientSecret) {
    return NextResponse.json({
      ok: false,
      credsPresent: false,
      message: "SPOTIFY_CLIENT_ID or SPOTIFY_CLIENT_SECRET missing from environment",
    });
  }

  const diagnostic = await rawSpotifyTest().catch((err) => ({
    error: err instanceof Error ? err.message : String(err),
  }));

  return NextResponse.json({
    ok: !("error" in diagnostic),
    credsPresent: true,
    diagnostic,
  });
}
