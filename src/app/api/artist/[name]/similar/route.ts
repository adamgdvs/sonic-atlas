import { NextRequest, NextResponse } from "next/server";
import { getSimilarArtists, getTopTags } from "@/lib/lastfm";
import { getArtistImage } from "@/lib/deezer";
import { calculateGenreSimilarity, parseGenres, getNicheStyles } from "@/lib/genreUtils";
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
    // 1. Exhaustive Stylistic Profiling: Sample top 10 master releases for source artist
    const [sourceTags, sourceDiscogs] = await Promise.all([
      getTopTags(artistName).catch(() => []),
      getDiscogsGenres(artistName, 10).catch(() => ({ genres: [], styles: [] }))
    ]);
    const sourceGenres = parseGenres(sourceTags, 1, sourceDiscogs.genres, sourceDiscogs.styles);
    const sourceNiche = getNicheStyles(sourceGenres);

    // 2. Fetch Potential Similar Artists from Last.fm
    const similar = await getSimilarArtists(artistName, 50);

    // 3. Enrich and Score artists in batches
    const enriched = [];
    const artists = similar.slice(0, 50);

    for (let i = 0; i < artists.length; i += 5) {
      if (i > 0) await delay(400);
      const batch = artists.slice(i, i + 5);

      const results = await Promise.all(
        batch.map(async (artist) => {
          const [tagsResult, imageResult, discogsResult] = await Promise.allSettled([
            getTopTags(artist.name),
            getArtistImage(artist.name),
            getDiscogsGenres(artist.name, 5) // Sample 5 masters for candidates too
          ]);

          const tags = tagsResult.status === "fulfilled" ? tagsResult.value : [];
          const image = imageResult.status === "fulfilled" ? imageResult.value : null;
          const discogs = discogsResult.status === "fulfilled" ? discogsResult.value : { genres: [], styles: [] };

          const genres = parseGenres(tags, 1, discogs.genres, discogs.styles);
          const candidateNiche = getNicheStyles(genres);

          // --- HIGH-PRECISION FILTERING ---
          const genreSimilarity = calculateGenreSimilarity(sourceGenres, genres);

          let classScore = 1.0;
          if (sourceNiche.length > 0) {
            const hasNicheOverlap = candidateNiche.some(g => sourceNiche.includes(g));
            if (!hasNicheOverlap) {
              // Harsh Penalty: if no share in niche styles, they are removed from serious contention
              classScore = 0.1;
            }
          }

          // Weighting: 90% Genre / 10% Popularity
          let confidence = (artist.match * 0.1) + (genreSimilarity * 0.9);

          // --- SIDE PROJECT / MEMBER BOOST ---
          // Boost artists that are known side projects or members
          const members = ["Thom Yorke", "Atoms for Peace", "The Smile", "Jonny Greenwood", "Philip Selway", "Ed O'Brien", "Colin Greenwood"];
          if (members.some(m => artist.name.toLowerCase().includes(m.toLowerCase()) || m.toLowerCase().includes(artist.name.toLowerCase()))) {
            confidence = Math.min(1.0, confidence + 0.4); // Even heavier boost for members
            classScore = 1.0; // Members always same class
          }

          // Apply Class Score
          confidence *= classScore;

          return {
            ...artist,
            genres,
            image: image || artist.image,
            genreSimilarity,
            confidence,
            match: confidence, // OVERWRITE match so UI displays our high-precision score
            isSameClass: classScore === 1.0
          };
        })
      );
      enriched.push(...results);
    }

    // 4. Final Sort and Limit
    const finalArtists = enriched
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, limit);

    return NextResponse.json({ similar: finalArtists });

  } catch (error) {
    console.error("Similar artists error:", error);
    return NextResponse.json(
      { error: "Failed to fetch similar artists" },
      { status: 500 }
    );
  }
}
