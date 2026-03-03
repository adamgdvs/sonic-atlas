import { NextRequest, NextResponse } from "next/server";
import { getSimilarArtists, getTopTags } from "@/lib/lastfm";
import { getArtistImage } from "@/lib/deezer";
import { parseGenres } from "@/lib/genreUtils";
import { getDiscogsGenres } from "@/lib/discogs";

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  const artistName = name;
  const limit = parseInt(
    request.nextUrl.searchParams.get("limit") || "30"
  );

  try {
    const similar = await getSimilarArtists(artistName, limit);

    // Enrich artists with genres + Deezer image in batches of 5
    // Phase 23: Adding Discogs enrichment for hierarchical genres
    const enriched = [];
    const artists = similar.slice(0, limit);
    for (let i = 0; i < artists.length; i += 5) {
      if (i > 0) await delay(500);
      const batch = artists.slice(i, i + 5);
      const results = await Promise.all(
        batch.map(async (artist) => {
          const [tagsResult, imageResult, discogsResult] = await Promise.allSettled([
            getTopTags(artist.name),
            getArtistImage(artist.name),
            getDiscogsGenres(artist.name)
          ]);

          const tags =
            tagsResult.status === "fulfilled" ? tagsResult.value : [];
          const image =
            imageResult.status === "fulfilled" ? imageResult.value : null;
          const discogs =
            discogsResult.status === "fulfilled" ? discogsResult.value : { genres: [], styles: [] };

          const genres = parseGenres(tags, 1, discogs.genres, discogs.styles);

          return { ...artist, genres, image: image || artist.image };
        })
      );
      enriched.push(...results);
    }

    return NextResponse.json({ similar: enriched });

  } catch (error) {
    console.error("Similar artists error:", error);
    return NextResponse.json(
      { error: "Failed to fetch similar artists" },
      { status: 500 }
    );
  }
}
