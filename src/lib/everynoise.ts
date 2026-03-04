/**
 * EveryNoise Intelligence Layer
 * Provides canonical artist-to-genre mappings for micro-genres
 * that are under-represented in Last.fm user tags.
 */

export interface EveryNoiseArtist {
    name: string;
    spotifyId: string;
}

// ─── In-Memory Cache (24h TTL) ──────────────────────────────────────
const MICRO_CACHE_TTL = 24 * 60 * 60 * 1000;
const microGenreCache = new Map<string, { data: string[]; timestamp: number }>();

function getMicroCached(key: string): string[] | null {
    const entry = microGenreCache.get(key);
    if (entry && Date.now() - entry.timestamp < MICRO_CACHE_TTL) return entry.data;
    if (entry) microGenreCache.delete(key);
    return null;
}

function setMicroCache(key: string, data: string[]) {
    microGenreCache.set(key, { data, timestamp: Date.now() });
    if (microGenreCache.size > 500) {
        const now = Date.now();
        for (const [k, v] of microGenreCache) {
            if (now - v.timestamp > MICRO_CACHE_TTL) microGenreCache.delete(k);
        }
    }
}

/**
 * Fetches and parses artists for a given genre from EveryNoise at Once.
 * This is a fallback/enrichment layer for Last.fm tags.
 */
export async function getEveryNoiseArtists(genre: string): Promise<EveryNoiseArtist[]> {
    // EveryNoise slugs are lowercase, no spaces or special characters
    const slug = genre.toLowerCase().replace(/[^a-z0-9]/g, "");
    const url = `https://everynoise.com/engenremap-${slug}.html`;

    try {
        const res = await fetch(url, {
            next: { revalidate: 86400 }, // Cache for 24 hours
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        if (!res.ok) {
            return [];
        }

        const html = await res.text();

        const artistRegex = /<div[^>]*class=["']genre["'][^>]*title=["']([^"']+)["'][^>]*>/g;
        const idRegex = /playp\(['"]([^'"]+)['"]/;

        const artists: EveryNoiseArtist[] = [];
        let match;

        while ((match = artistRegex.exec(html)) !== null) {
            const name = match[1].trim();

            const fullTagMatch = html.substring(match.index, html.indexOf('</div>', match.index));
            const idMatch = idRegex.exec(fullTagMatch);

            if (name && !name.includes("»")) {
                artists.push({
                    name,
                    spotifyId: idMatch ? idMatch[1] : ""
                });
            }
        }

        return artists;
    } catch (e) {
        console.error(`EveryNoise extraction error for ${genre}:`, e);
        return [];
    }
}

/**
 * Find which EveryNoise micro-genres contain a given artist.
 * Uses the artist's existing genre tags as starting points to search.
 */
export async function getArtistMicroGenres(artistName: string): Promise<string[]> {
    const cacheKey = `micro:${artistName.toLowerCase()}`;
    const cached = getMicroCached(cacheKey);
    if (cached) return cached;

    // Use Last.fm top tags as candidate micro-genres to search
    // We'll check a few common micro-genre neighborhoods
    const candidateGenres = await getLastFmTagsForMicroSearch(artistName);

    const matchedGenres: string[] = [];

    // Search in parallel (up to 5 genres at a time to avoid hammering EveryNoise)
    const searchBatch = candidateGenres.slice(0, 8);

    const results = await Promise.allSettled(
        searchBatch.map(async (genre) => {
            const artists = await getEveryNoiseArtists(genre);
            const found = artists.some(a =>
                a.name.toLowerCase() === artistName.toLowerCase()
            );
            return found ? genre : null;
        })
    );

    for (const result of results) {
        if (result.status === "fulfilled" && result.value) {
            matchedGenres.push(result.value);
        }
    }

    setMicroCache(cacheKey, matchedGenres);
    return matchedGenres;
}

/**
 * Helper: get Last.fm tags to use as EveryNoise search candidates.
 * These are fetched from EveryNoise-compatible genre slugs.
 */
async function getLastFmTagsForMicroSearch(artistName: string): Promise<string[]> {
    try {
        const BASE_URL = "https://ws.audioscrobbler.com/2.0";
        const apiKey = process.env.LASTFM_API_KEY;
        if (!apiKey) return [];

        const url = `${BASE_URL}/?method=artist.gettoptags&artist=${encodeURIComponent(artistName)}&api_key=${apiKey}&autocorrect=1&format=json`;
        const res = await fetch(url, { next: { revalidate: 3600 } });
        if (!res.ok) return [];

        const data = await res.json();
        const tags = data.toptags?.tag || [];

        // Filter to tags that are likely EveryNoise micro-genres
        // (not noise like "seen live", not too broad like just "rock")
        const NOISE_FILTER = new Set([
            "seen live", "favorite", "loved", "awesome", "favourite", "favorites",
            "under 2000 listeners", "female vocalists", "male vocalists",
            "beautiful", "genius", "love", "classic", "amazing", "best", "epic",
            "good", "great", "nice", "all", "favorite artists", "favourite artists",
        ]);

        return tags
            .filter((t: any) => t.count >= 30 && !NOISE_FILTER.has(t.name.toLowerCase()))
            .map((t: any) => t.name.toLowerCase())
            .slice(0, 12);
    } catch {
        return [];
    }
}
