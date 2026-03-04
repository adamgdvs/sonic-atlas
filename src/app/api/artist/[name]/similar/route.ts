import { NextRequest, NextResponse } from "next/server";
import { getSimilarArtists, getTopTags } from "@/lib/lastfm";
import { getArtistImage } from "@/lib/deezer";
import { calculateGenreSimilarity, parseGenres, getNicheStyles } from "@/lib/genreUtils";
import { getDiscogsGenres, searchDiscogsArtist, getDiscogsArtistDetails } from "@/lib/discogs";
import { getArtistMicroGenres } from "@/lib/everynoise";

// ─── In-Memory Cache (30-minute TTL) ────────────────────────────────
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes
const cache = new Map<string, { data: any; timestamp: number }>();

function getCached(key: string) {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.timestamp < CACHE_TTL) return entry.data;
  if (entry) cache.delete(key);
  return null;
}

function setCache(key: string, data: any) {
  cache.set(key, { data, timestamp: Date.now() });
  // Evict old entries if cache grows too large
  if (cache.size > 200) {
    const now = Date.now();
    for (const [k, v] of cache) {
      if (now - v.timestamp > CACHE_TTL) cache.delete(k);
    }
  }
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  const artistName = decodeURIComponent(name);
  const limit = parseInt(
    request.nextUrl.searchParams.get("limit") || "30"
  );
  const nicheDepth = Math.min(100, Math.max(10, parseInt(
    request.nextUrl.searchParams.get("nicheDepth") || "60"
  )));

  // ─── Check Cache ────────────────────────────────────────────────
  const cacheKey = `similar:${artistName.toLowerCase()}:${limit}:${nicheDepth}`;
  const cached = getCached(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  try {
    // 1. Exhaustive Stylistic Profiling: Sample top 10 master releases for source artist
    //    + EveryNoise micro-genre lookup (all in parallel)
    const [sourceTags, sourceDiscogs, sourceMicroGenres, discogsArtistId] = await Promise.all([
      getTopTags(artistName).catch((): { name: string; count: number; url: string }[] => []),
      getDiscogsGenres(artistName, 10).catch((): { genres: string[]; styles: string[] } => ({ genres: [], styles: [] })),
      getArtistMicroGenres(artistName).catch((): string[] => []),
      searchDiscogsArtist(artistName).catch((): number | null => null),
    ]);

    const sourceGenres = parseGenres(sourceTags, 1, sourceDiscogs.genres, sourceDiscogs.styles);
    const sourceNiche = getNicheStyles(sourceGenres);
    // Track Discogs styles separately for provenance-aware scoring
    const sourceDiscogsStyles = [...sourceDiscogs.genres, ...sourceDiscogs.styles].map(s => s.toLowerCase());

    // ─── Dynamic Member/Group Lookup (replaces hardcoded list) ────
    let memberNames: string[] = [];
    if (discogsArtistId) {
      try {
        const details = await getDiscogsArtistDetails(discogsArtistId);
        if (details) {
          const members = details.members?.map(m => m.name) || [];
          const groups = details.groups?.map(g => g.name) || [];
          memberNames = [...members, ...groups];
        }
      } catch { /* non-critical */ }
    }

    // 2. Fetch Potential Similar Artists from Last.fm
    const similar = await getSimilarArtists(artistName, 40);

    // 3. Enrich and Score artists in larger batches (10 at a time, 200ms delay)
    const enriched = [];
    const artists = similar.slice(0, 35); // Process 35 candidates max

    for (let i = 0; i < artists.length; i += 10) {
      if (i > 0) await delay(200);
      const batch = artists.slice(i, i + 10);

      const results = await Promise.all(
        batch.map(async (artist) => {
          const [tagsResult, imageResult, discogsResult] = await Promise.allSettled([
            getTopTags(artist.name),
            getArtistImage(artist.name),
            getDiscogsGenres(artist.name, 10) // Increased to 10 masters for deeper style profiling
          ]);

          const tags = tagsResult.status === "fulfilled" ? tagsResult.value : [];
          const image = imageResult.status === "fulfilled" ? imageResult.value : null;
          const discogs = discogsResult.status === "fulfilled" ? discogsResult.value : { genres: [], styles: [] };

          const genres = parseGenres(tags, 1, discogs.genres, discogs.styles);
          const candidateNiche = getNicheStyles(genres);
          const candidateDiscogsStyles = [...discogs.genres, ...discogs.styles].map(s => s.toLowerCase());

          // --- HIGH-PRECISION FILTERING (Provenance-Aware) ---
          const genreSimilarity = calculateGenreSimilarity(sourceGenres, genres, sourceDiscogsStyles, candidateDiscogsStyles);

          // ─── Niche Penalty (scaled by nicheDepth) ─────────────
          // nicheDepth 100 = strictest (0.02 penalty), nicheDepth 10 = loosest (0.5 penalty)
          const nichePenalty = 0.5 - (nicheDepth / 100) * 0.48; // Maps 10→0.452, 60→0.212, 100→0.02
          let classScore = 1.0;
          if (sourceNiche.length > 0) {
            const hasNicheOverlap = candidateNiche.some(g => sourceNiche.includes(g));
            if (!hasNicheOverlap) {
              classScore = nichePenalty;
            }
          }

          // Weighting: 90% Genre / 10% Popularity
          let confidence = (artist.match * 0.1) + (genreSimilarity * 0.9);

          // ─── Dynamic Member/Group Boost ────────────────────────
          if (memberNames.length > 0) {
            const isMemberOrGroup = memberNames.some(m =>
              artist.name.toLowerCase().includes(m.toLowerCase()) ||
              m.toLowerCase().includes(artist.name.toLowerCase())
            );
            if (isMemberOrGroup) {
              confidence = Math.min(1.0, confidence + 0.4);
              classScore = 1.0; // Members always same class
            }
          }

          // ─── EveryNoise Micro-Genre Boost ─────────────────────
          if (sourceMicroGenres.length > 0) {
            // Check if candidate shares any micro-genre neighborhoods
            const candidateMicro: string[] = await getArtistMicroGenres(artist.name).catch(() => [] as string[]);
            const sharedMicro = candidateMicro.filter((g: string) => sourceMicroGenres.includes(g));
            if (sharedMicro.length > 0) {
              // Significant boost for micro-genre co-occurrence
              confidence = Math.min(1.0, confidence + sharedMicro.length * 0.08);
              classScore = Math.max(classScore, 0.8); // Lift niche penalty if micro-genres match
            }
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
            isSameClass: classScore >= 0.8
          };
        })
      );
      enriched.push(...results);
    }

    // 4. Final Sort and Limit
    const finalArtists = enriched
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, limit);

    const result = { similar: finalArtists };
    setCache(cacheKey, result);

    return NextResponse.json(result);

  } catch (error) {
    console.error("Similar artists error:", error);
    return NextResponse.json(
      { error: "Failed to fetch similar artists" },
      { status: 500 }
    );
  }
}
