import { NextRequest, NextResponse } from "next/server";
import { getSimilarArtists, getTopTags } from "@/lib/lastfm";
import { getArtistImage } from "@/lib/deezer";
import { calculateGenreSimilarity, parseGenres, getNicheStyles } from "@/lib/genreUtils";
import { getDiscogsGenres, searchDiscogsArtist, getDiscogsArtistDetails } from "@/lib/discogs";
import { getArtistMicroGenres } from "@/lib/everynoise";
import { dbCache, CacheTTL } from "@/lib/dbCache";

// ─── In-Memory L1 Cache (30-minute TTL) ─────────────────────────────
// Keeps frequently accessed results in memory for instant response
const CACHE_TTL = 30 * 60 * 1000;
const cache = new Map<string, { data: any; timestamp: number }>();

function getCached(key: string) {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.timestamp < CACHE_TTL) return entry.data;
  if (entry) cache.delete(key);
  return null;
}

function setCache(key: string, data: any) {
  cache.set(key, { data, timestamp: Date.now() });
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

  // ─── L1: Check In-Memory Cache ───────────────────────────────────
  const cacheKey = `similar:${artistName.toLowerCase()}:${limit}:${nicheDepth}`;
  const cached = getCached(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  // ─── L2: Check PostgreSQL Cache ──────────────────────────────────
  const dbCacheKey = `similar:full:${artistName.toLowerCase()}:${limit}:${nicheDepth}`;
  try {
    const result = await dbCache(dbCacheKey, CacheTTL.FULL_SIMILAR, async () => {
      // 1. Exhaustive Stylistic Profiling (with per-call DB caching)
      const [sourceTags, sourceDiscogs, sourceMicroGenres, discogsArtistId] = await Promise.all([
        dbCache(`lastfm:tags:${artistName.toLowerCase()}`, CacheTTL.TAGS, () =>
          getTopTags(artistName).catch((): { name: string; count: number; url: string }[] => [])
        ),
        dbCache(`discogs:genres:${artistName.toLowerCase()}`, CacheTTL.DISCOGS_GENRES, () =>
          getDiscogsGenres(artistName, 10).catch((): { genres: string[]; styles: string[] } => ({ genres: [], styles: [] }))
        ),
        dbCache(`everynoise:micro:${artistName.toLowerCase()}`, CacheTTL.MICRO_GENRES, () =>
          getArtistMicroGenres(artistName).catch((): string[] => [])
        ),
        dbCache(`discogs:id:${artistName.toLowerCase()}`, CacheTTL.DISCOGS_ARTIST, () =>
          searchDiscogsArtist(artistName).catch((): number | null => null)
        ),
      ]);

      const sourceGenres = parseGenres(sourceTags, 1, sourceDiscogs.genres, sourceDiscogs.styles);
      const sourceNiche = getNicheStyles(sourceGenres);
      const sourceDiscogsStyles = [...sourceDiscogs.genres, ...sourceDiscogs.styles].map(s => s.toLowerCase());

      // ─── Dynamic Member/Group Lookup ────
      let memberNames: string[] = [];
      if (discogsArtistId) {
        try {
          const details = await dbCache(`discogs:artist:${discogsArtistId}`, CacheTTL.DISCOGS_ARTIST, () =>
            getDiscogsArtistDetails(discogsArtistId)
          );
          if (details) {
            const members = details.members?.map((m: any) => m.name) || [];
            const groups = details.groups?.map((g: any) => g.name) || [];
            memberNames = [...members, ...groups];
          }
        } catch { /* non-critical */ }
      }

      // 2. Fetch Potential Similar Artists from Last.fm
      const similar = await dbCache(`lastfm:similar:${artistName.toLowerCase()}`, CacheTTL.SIMILAR, () =>
        getSimilarArtists(artistName, 40)
      );

      // 3. Enrich and Score artists in batches (with per-call DB caching)
      const enriched = [];
      const artists = similar.slice(0, 35);

      for (let i = 0; i < artists.length; i += 10) {
        if (i > 0) await delay(200);
        const batch = artists.slice(i, i + 10);

        const results = await Promise.all(
          batch.map(async (artist) => {
            const candidateName = artist.name.toLowerCase();

            const [tagsResult, imageResult, discogsResult] = await Promise.allSettled([
              dbCache(`lastfm:tags:${candidateName}`, CacheTTL.TAGS, () =>
                getTopTags(artist.name)
              ),
              dbCache(`deezer:image:${candidateName}`, CacheTTL.DEEZER_IMAGE, () =>
                getArtistImage(artist.name)
              ),
              dbCache(`discogs:genres:${candidateName}`, CacheTTL.DISCOGS_GENRES, () =>
                getDiscogsGenres(artist.name, 10)
              ),
            ]);

            const tags = tagsResult.status === "fulfilled" ? tagsResult.value : [];
            const image = imageResult.status === "fulfilled" ? imageResult.value : null;
            const discogs = discogsResult.status === "fulfilled" ? discogsResult.value : { genres: [], styles: [] };

            const genres = parseGenres(tags, 1, discogs.genres, discogs.styles);
            const candidateNiche = getNicheStyles(genres);
            const candidateDiscogsStyles = [...discogs.genres, ...discogs.styles].map(s => s.toLowerCase());

            // --- HIGH-PRECISION FILTERING (Provenance-Aware) ---
            const genreSimilarity = calculateGenreSimilarity(sourceGenres, genres, sourceDiscogsStyles, candidateDiscogsStyles);

            const nichePenalty = 0.5 - (nicheDepth / 100) * 0.48;
            let classScore = 1.0;
            if (sourceNiche.length > 0) {
              const hasNicheOverlap = candidateNiche.some(g => sourceNiche.includes(g));
              if (!hasNicheOverlap) {
                classScore = nichePenalty;
              }
            }

            let confidence = (artist.match * 0.1) + (genreSimilarity * 0.9);

            // ─── Dynamic Member/Group Boost ────────────────────────
            if (memberNames.length > 0) {
              const isMemberOrGroup = memberNames.some(m =>
                artist.name.toLowerCase().includes(m.toLowerCase()) ||
                m.toLowerCase().includes(artist.name.toLowerCase())
              );
              if (isMemberOrGroup) {
                confidence = Math.min(1.0, confidence + 0.4);
                classScore = 1.0;
              }
            }

            // ─── EveryNoise Micro-Genre Boost ─────────────────────
            if (sourceMicroGenres.length > 0) {
              const candidateMicro: string[] = await dbCache(
                `everynoise:micro:${candidateName}`, CacheTTL.MICRO_GENRES,
                () => getArtistMicroGenres(artist.name).catch(() => [] as string[])
              );
              const sharedMicro = candidateMicro.filter((g: string) => sourceMicroGenres.includes(g));
              if (sharedMicro.length > 0) {
                confidence = Math.min(1.0, confidence + sharedMicro.length * 0.08);
                classScore = Math.max(classScore, 0.8);
              }
            }

            confidence *= classScore;

            return {
              ...artist,
              genres,
              image: image || artist.image,
              genreSimilarity,
              confidence,
              match: confidence,
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

      return { similar: finalArtists };
    });

    // Store in L1 memory cache too
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
