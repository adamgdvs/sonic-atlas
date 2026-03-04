import { prisma } from "./prisma";

/**
 * Persistent database cache for external API responses.
 * 
 * Usage:
 *   const tags = await dbCache("lastfm:tags:radiohead", 7 * DAY, () => getTopTags("Radiohead"));
 * 
 * - Checks PostgreSQL for a cached entry by key
 * - If found and not expired → returns cached data instantly
 * - If expired or missing → calls fetchFn(), stores result, returns it
 */

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** Pre-defined TTLs for different data types */
export const CacheTTL = {
    ARTIST_INFO: 7 * DAY,   // Artist bio, listeners, etc.
    TAGS: 7 * DAY,   // Last.fm tags
    SIMILAR: 3 * DAY,   // Similar artist lists
    DISCOGS_GENRES: 7 * DAY,   // Discogs genre/style data
    DISCOGS_ARTIST: 7 * DAY,   // Discogs artist details
    DEEZER_IMAGE: 14 * DAY,   // Artist images (basically static)
    MICRO_GENRES: 7 * DAY,   // EveryNoise micro-genres
    FULL_INFO: 3 * DAY,   // Full assembled info response
    FULL_SIMILAR: 3 * DAY,   // Full assembled similar response
} as const;

/**
 * Database-backed cache with automatic expiration.
 * 
 * @param key - Unique cache key (e.g. "lastfm:tags:radiohead")
 * @param ttlMs - Time-to-live in milliseconds
 * @param fetchFn - Async function to call on cache miss
 * @returns The cached or freshly-fetched data
 */
export async function dbCache<T>(
    key: string,
    ttlMs: number,
    fetchFn: () => Promise<T>
): Promise<T> {
    try {
        // Check for cached entry
        const cached = await prisma.apiCache.findUnique({
            where: { key },
        });

        if (cached && new Date(cached.expiresAt) > new Date()) {
            return JSON.parse(cached.data) as T;
        }

        // Cache miss or expired — fetch fresh data
        const data = await fetchFn();

        // Store in cache (upsert to handle race conditions)
        const expiresAt = new Date(Date.now() + ttlMs);
        await prisma.apiCache.upsert({
            where: { key },
            update: { data: JSON.stringify(data), expiresAt },
            create: { key, data: JSON.stringify(data), expiresAt },
        }).catch((err: unknown) => {
            // Non-critical: log but don't fail the request
            console.error("Cache write error:", err);
        });

        return data;
    } catch (err) {
        // If DB is unreachable, fall back to direct fetch
        console.error("Cache read error, falling back to direct fetch:", err);
        return fetchFn();
    }
}

/**
 * Cleanup expired cache entries. Call periodically or on-demand.
 */
export async function cleanExpiredCache(): Promise<number> {
    const result = await prisma.apiCache.deleteMany({
        where: { expiresAt: { lt: new Date() } },
    });
    return result.count;
}
