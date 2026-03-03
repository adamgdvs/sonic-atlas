import { NextResponse } from "next/server";
import { getTagTopArtists } from "@/lib/lastfm";
import { getArtistImage } from "@/lib/deezer";
import { getEveryNoiseArtists } from "@/lib/everynoise";

import { getDiscogsGenreArtists } from "@/lib/discogs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const { name } = await params;
    const tag = name;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "200");

    // 1. Fetch from Multiple Sources in Parallel
    const [lastfmArtists, discogsArtists] = await Promise.all([
      getTagTopArtists(tag, limit),
      getDiscogsGenreArtists(tag, limit)
    ]);

    // 2. Hybrid Merge & Deduplicate
    const combined = [...lastfmArtists];
    const existingNames = new Set(lastfmArtists.map((a) => a.name.toLowerCase()));

    for (const d of discogsArtists) {
      if (!existingNames.has(d.name.toLowerCase())) {
        combined.push({
          name: d.name,
          mbid: "",
          url: `https://www.discogs.com/search/?q=${encodeURIComponent(d.name)}&type=artist`,
          image: null,
        });
        existingNames.add(d.name.toLowerCase());
      }
    }

    let artists = combined;

    // 3. EveryNoise Backfill if still sparse (< 15)
    if (artists.length < 15) {
      try {
        const enaoArtists = await getEveryNoiseArtists(tag);
        if (enaoArtists.length > 0) {
          const backfilled = enaoArtists.slice(0, limit).map((a) => ({
            name: a.name,
            mbid: "",
            url: `https://open.spotify.com/artist/${a.spotifyId}`,
            image: null,
          }));

          const combined = [...artists];
          const existingNames = new Set(artists.map((a) => a.name.toLowerCase()));

          for (const b of backfilled) {
            if (!existingNames.has(b.name.toLowerCase())) {
              combined.push(b);
            }
          }
          artists = combined;
        }
      } catch (enaoError) {
        console.error("Hybrid backfill failed:", enaoError);
      }
    }

    // 3. Image Enrichment (Top 24 for better grid coverage)
    const enrichedArtists = await Promise.all(
      artists.map(async (a, i) => {
        if (i < 24 && !a.image) {
          try {
            const deezerImg = await getArtistImage(a.name);
            return { ...a, image: deezerImg };
          } catch {
            return a;
          }
        }
        return a;
      })
    );

    return NextResponse.json({
      tag,
      artists: enrichedArtists,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

