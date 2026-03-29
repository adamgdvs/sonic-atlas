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
const cache = new Map<string, { data: { source: SourceProfile; candidates: EnrichedCandidate[] }; timestamp: number }>();

function getCached(key: string) {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.timestamp < CACHE_TTL) return entry.data;
  if (entry) cache.delete(key);
  return null;
}

function setCache(key: string, data: { source: SourceProfile; candidates: EnrichedCandidate[] }) {
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
          const members = details.members?.map((m: { name: string }) => m.name) || [];
          const groups = details.groups?.map((g: { name: string }) => g.name) || [];
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
// The key insight: at BROAD, use mostly Last.fm's popularity-based match.
// At DEEP NICHE, use mostly genre similarity. This creates fundamentally
// different orderings because Last.fm match and genre similarity often disagree.
function scoreAndSort(
  source: SourceProfile,
  candidates: EnrichedCandidate[],
  nicheDepth: number,
  limit: number
) {
  const depthFactor = nicheDepth / 100; // 0.0 to 1.0

  const scored = candidates.map(c => {
    // ─── Core scoring weights shift with the slider ──────────
    // BROAD (depth=0):   90% Last.fm match, 10% genre similarity
    // DEFAULT (depth=60): 30% Last.fm match, 70% genre similarity
    // DEEP (depth=100):   5% Last.fm match, 95% genre similarity
    const lastfmWeight = Math.max(0.05, 0.9 - (depthFactor * 0.85));
    const genreWeight = 1.0 - lastfmWeight;

    let confidence = (c.match * lastfmWeight) + (c.genreSimilarity * genreWeight);

    // Member/group boost (always applies)
    if (c.isMemberOrGroup) {
      confidence = Math.min(1.0, confidence + 0.35);
    }

    // Micro-genre boost (scales with depth — more impactful at high depth)
    const sharedMicro = c.microGenres.filter(g => source.microGenres.includes(g));
    if (sharedMicro.length > 0) {
      const microBonus = sharedMicro.length * (0.04 + depthFactor * 0.08);
      confidence = Math.min(1.0, confidence + microBonus);
    }

    // ─── Deep Niche Penalties (only kick in above 50%) ────────
    if (depthFactor > 0.5) {
      const highDepthFactor = (depthFactor - 0.5) * 2; // 0.0 to 1.0 for depth 50-100

      // Penalize artists with very low genre similarity
      if (c.genreSimilarity < 0.2) {
        confidence *= (1.0 - highDepthFactor * 0.7); // at 100%, 70% reduction
      } else if (c.genreSimilarity < 0.4) {
        confidence *= (1.0 - highDepthFactor * 0.35); // at 100%, 35% reduction
      }

      // Niche style overlap bonus/penalty
      if (source.nicheStyles.length > 0) {
        const nicheOverlap = c.nicheStyles.filter(g => source.nicheStyles.includes(g)).length;
        if (nicheOverlap > 0) {
          const nicheRatio = nicheOverlap / source.nicheStyles.length;
          confidence = Math.min(1.0, confidence + nicheRatio * highDepthFactor * 0.3);
        } else {
          // Zero niche overlap at high depth = harsh penalty
          confidence *= (1.0 - highDepthFactor * 0.5);
        }
      }

      // Discogs style overlap bonus at high depth
      if (source.discogsStyles.length > 0) {
        const styleOverlap = c.discogsStyles.filter(s => source.discogsStyles.includes(s)).length;
        if (styleOverlap > 0) {
          confidence = Math.min(1.0, confidence + (styleOverlap / source.discogsStyles.length) * highDepthFactor * 0.2);
        }
      }
    }

    // ─── Broad Bonus: boost high Last.fm match at low depth ──
    if (depthFactor < 0.4 && c.match > 0.7) {
      const broadFactor = (0.4 - depthFactor) * 2.5; // 0.0 to 1.0 for depth 0-40
      confidence = Math.min(1.0, confidence + c.match * broadFactor * 0.15);
    }

    return {
      ...c,
      confidence,
      match: confidence,
      isSameClass: c.genreSimilarity > 0.3,
    };
  });

  // Filter out very low confidence artists at high niche depth
  const minConfidence = depthFactor > 0.7 ? 0.1 + (depthFactor - 0.7) * 0.5 : 0;
  const filtered = scored.filter(a => a.confidence >= minConfidence);

  return filtered
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
