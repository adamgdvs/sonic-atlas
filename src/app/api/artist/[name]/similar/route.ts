import { NextRequest, NextResponse } from "next/server";
import { getSimilarArtists, getTopTags } from "@/lib/lastfm";
import { getArtistImage } from "@/lib/deezer";
import { calculateGenreSimilarity, parseGenres, getNicheStyles } from "@/lib/genreUtils";
import { getDiscogsGenres, searchDiscogsArtist, getDiscogsArtistDetails } from "@/lib/discogs";
import { getArtistMicroGenres } from "@/lib/everynoise";
import { dbCache, CacheTTL } from "@/lib/dbCache";

// ─── In-Memory L1 Cache (30-minute TTL) ─────────────────────────────
// Caches the RAW enriched data (tags, images, genres) but NOT the niche scoring
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

// Cached: raw enrichment data (tags, images, genres, members, micro-genres)
// This does NOT depend on nicheDepth, so it can be cached across all nicheDepth values
interface EnrichedCandidate {
  name: string;
  mbid: string;
  url: string;
  match: number; // original Last.fm match
  image: string | null;
  genres: string[];
  nicheStyles: string[];
  discogsStyles: string[];
  microGenres: string[];
  genreSimilarity: number;
  isMemberOrGroup: boolean;
}

interface SourceProfile {
  genres: string[];
  nicheStyles: string[];
  discogsStyles: string[];
  microGenres: string[];
  memberNames: string[];
}

async function getEnrichedData(artistName: string, limit: number): Promise<{
  source: SourceProfile;
  candidates: EnrichedCandidate[];
}> {
  // Check L1 memory cache for raw enriched data
  const rawCacheKey = `enriched:raw:${artistName.toLowerCase()}:${limit}`;
  const cached = getCached(rawCacheKey);
  if (cached) return cached;

  // Check L2 DB cache for raw enriched data
  const dbRawKey = `enriched:raw:v2:${artistName.toLowerCase()}:${limit}`;
  const result = await dbCache(dbRawKey, CacheTTL.FULL_SIMILAR, async () => {
    // 1. Source artist profiling
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

    // Member/group lookup
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

    // 2. Fetch raw similar artists from Last.fm
    const similar = await dbCache(`lastfm:similar:${artistName.toLowerCase()}`, CacheTTL.SIMILAR, () =>
      getSimilarArtists(artistName, 40)
    );

    // 3. Enrich candidates with tags, images, genres
    const enriched: EnrichedCandidate[] = [];
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

          const genreSimilarity = calculateGenreSimilarity(sourceGenres, genres, sourceDiscogsStyles, candidateDiscogsStyles);

          // Micro-genre enrichment
          const candidateMicro: string[] = sourceMicroGenres.length > 0
            ? await dbCache(`everynoise:micro:${candidateName}`, CacheTTL.MICRO_GENRES,
              () => getArtistMicroGenres(artist.name).catch(() => [] as string[]))
            : [];

          // Check member/group relationship
          const isMemberOrGroup = memberNames.length > 0 && memberNames.some(m =>
            artist.name.toLowerCase().includes(m.toLowerCase()) ||
            m.toLowerCase().includes(artist.name.toLowerCase())
          );

          return {
            name: artist.name,
            mbid: artist.mbid || "",
            url: artist.url || "",
            match: artist.match,
            image: image || artist.image,
            genres,
            nicheStyles: candidateNiche,
            discogsStyles: candidateDiscogsStyles,
            microGenres: candidateMicro,
            genreSimilarity,
            isMemberOrGroup,
          };
        })
      );
      enriched.push(...results);
    }

    return {
      source: {
        genres: sourceGenres,
        nicheStyles: sourceNiche,
        discogsStyles: sourceDiscogsStyles,
        microGenres: sourceMicroGenres,
        memberNames,
      },
      candidates: enriched,
    };
  });

  // Store in L1
  setCache(rawCacheKey, result);
  return result;
}

// Scoring: applied fresh each time (depends on nicheDepth)
function scoreAndSort(
  source: SourceProfile,
  candidates: EnrichedCandidate[],
  nicheDepth: number,
  limit: number
) {
  const scored = candidates.map(c => {
    let confidence = (c.match * 0.1) + (c.genreSimilarity * 0.9);

    // Member/group boost (always applies regardless of niche depth)
    if (c.isMemberOrGroup) {
      confidence = Math.min(1.0, confidence + 0.4);
    }

    // Micro-genre boost
    const sharedMicro = c.microGenres.filter(g => source.microGenres.includes(g));
    if (sharedMicro.length > 0) {
      confidence = Math.min(1.0, confidence + sharedMicro.length * 0.08);
    }

    // ─── Niche Depth Scoring ───────────────────────────────────
    // This is the core of what the slider controls.
    //
    // At BROAD (nicheDepth=0-30): minimal genre filtering, mainstream artists kept
    // At MID (nicheDepth=40-70): moderate preference for genre-matched artists
    // At DEEP NICHE (nicheDepth=80-100): strong preference for niche overlap, penalize generic matches
    //
    // The penalty applies based on genre similarity score, not just binary niche overlap.
    // This makes it work even when sourceNiche is empty.

    const depthFactor = nicheDepth / 100; // 0.0 to 1.0

    // Genre similarity threshold — higher nicheDepth means artists need a higher
    // genre similarity score to avoid being penalized
    const similarityThreshold = depthFactor * 0.5; // 0.0 at broad, 0.5 at deep niche

    if (c.genreSimilarity < similarityThreshold) {
      // Artist doesn't meet the genre similarity bar for this niche depth
      // Penalty scales with how far below the threshold they are
      const deficit = similarityThreshold - c.genreSimilarity;
      const penalty = 1.0 - (deficit * depthFactor * 2.5);
      confidence *= Math.max(0.05, penalty);
    }

    // Additional niche style bonus when slider is high
    if (source.nicheStyles.length > 0 && depthFactor > 0.4) {
      const nicheOverlap = c.nicheStyles.filter(g => source.nicheStyles.includes(g)).length;
      const nicheRatio = nicheOverlap / source.nicheStyles.length;

      if (nicheOverlap > 0) {
        // Reward niche overlap proportionally to depth setting
        confidence = Math.min(1.0, confidence + nicheRatio * depthFactor * 0.25);
      } else if (depthFactor > 0.7) {
        // At very high depth, penalize artists with zero niche overlap
        confidence *= (1.0 - depthFactor * 0.5);
      }
    }

    // Discogs style overlap bonus at high depth
    if (source.discogsStyles.length > 0 && depthFactor > 0.5) {
      const styleOverlap = c.discogsStyles.filter(s => source.discogsStyles.includes(s)).length;
      if (styleOverlap > 0) {
        const styleBonus = (styleOverlap / source.discogsStyles.length) * depthFactor * 0.15;
        confidence = Math.min(1.0, confidence + styleBonus);
      }
    }

    return {
      ...c,
      confidence,
      match: confidence,
      isSameClass: c.genreSimilarity > 0.3,
    };
  });

  return scored
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, limit);
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
  const nicheDepth = Math.min(100, Math.max(0, parseInt(
    request.nextUrl.searchParams.get("nicheDepth") || "60"
  )));

  try {
    // Get cached enriched data (raw data without niche scoring)
    const { source, candidates } = await getEnrichedData(artistName, limit);

    // Apply niche depth scoring fresh each time (fast, no API calls)
    const finalArtists = scoreAndSort(source, candidates, nicheDepth, limit);

    return NextResponse.json({ similar: finalArtists });

  } catch (error) {
    console.error("Similar artists error:", error);
    return NextResponse.json(
      { error: "Failed to fetch similar artists" },
      { status: 500 }
    );
  }
}
