// src/lib/discogs.ts

const DISCOGS_BASE_URL = "https://api.discogs.com";
const DISCOGS_KEY = process.env.DISCOGS_CONSUMER_KEY;
const DISCOGS_SECRET = process.env.DISCOGS_CONSUMER_SECRET;

const DEFAULT_HEADERS = {
    "User-Agent": "SonicAtlas/1.0 +http://localhost:3001",
    Authorization: `Discogs key=${DISCOGS_KEY}, secret=${DISCOGS_SECRET}`,
};

export interface DiscogsArtist {
    id: number;
    name: string;
    profile: string; // Bio
    uri: string;
    images?: { resource_url: string; type: string; width: number; height: number }[];
    members?: { id: number; name: string; active: boolean }[];
    groups?: { id: number; name: string; active: boolean }[];
}

export interface DiscogsRelease {
    id: number;
    title: string;
    year: number;
    resource_url: string;
    type: string;
    main_release?: number;
    artist: string;
    role: string;
    stats?: { community: { in_wantlist: number; in_collection: number } };
}

/**
 * Search for an artist on Discogs and return the most relevant match ID.
 */
export async function searchDiscogsArtist(name: string): Promise<number | null> {
    if (!DISCOGS_KEY || !DISCOGS_SECRET) {
        console.warn("Discogs API keys missing from environment.");
        return null;
    }

    const url = `${DISCOGS_BASE_URL}/database/search?q=${encodeURIComponent(
        name
    )}&type=artist&limit=1`;

    try {
        const res = await fetch(url, {
            headers: DEFAULT_HEADERS,
            next: { revalidate: 86400 }, // Cache search for 24 hours
        });

        if (!res.ok) {
            console.error(`Discogs search error: ${res.statusText}`);
            return null;
        }

        const data = await res.json();
        const result = data.results?.[0];
        return result?.id || null;
    } catch (error) {
        console.error("Discogs search fetch failed:", error);
        return null;
    }
}

/**
 * Get full details for a Discogs artist by ID.
 */
export async function getDiscogsArtistDetails(id: number): Promise<DiscogsArtist | null> {
    const url = `${DISCOGS_BASE_URL}/artists/${id}`;

    try {
        const res = await fetch(url, {
            headers: DEFAULT_HEADERS,
            next: { revalidate: 86400 },
        });

        if (!res.ok) return null;
        return await res.json();
    } catch (error) {
        console.error("Discogs artist details fetch failed:", error);
        return null;
    }
}

/**
 * Get artist releases (discography) from Discogs.
 */
export async function getDiscogsArtistReleases(id: number, limit = 50): Promise<DiscogsRelease[]> {
    const url = `${DISCOGS_BASE_URL}/artists/${id}/releases?sort=year&sort_order=desc&per_page=${limit}`;

    try {
        const res = await fetch(url, {
            headers: DEFAULT_HEADERS,
            next: { revalidate: 86400 },
        });

        if (!res.ok) return [];
        const data = await res.json();
        return data.releases || [];
    } catch (error) {
        console.error("Discogs releases fetch failed:", error);
        return [];
    }
}

/**
 * Extract official genres and styles from Discogs artist data.
 * This is technically not on the Artist object but usually derived from their top releases 
 * or provided in secondary lookups. 
 * Actually, Discogs Search results often include genre/style tags for the artist.
 */
export async function getDiscogsGenres(name: string, limit = 1): Promise<{ genres: string[]; styles: string[] }> {
    // Search for the artist's master releases using the artist parameter for precision
    const url = `${DISCOGS_BASE_URL}/database/search?artist=${encodeURIComponent(name)}&type=master&limit=${limit}`;

    try {
        const res = await fetch(url, {
            headers: DEFAULT_HEADERS,
            next: { revalidate: 86400 },
        });

        if (!res.ok) return { genres: [], styles: [] };

        const data = await res.json();
        const results = data.results || [];

        const allGenres = new Set<string>();
        const allStyles = new Set<string>();

        results.forEach((r: { genre?: string[]; style?: string[] }) => {
            (r.genre || []).forEach((g: string) => allGenres.add(g));
            (r.style || []).forEach((s: string) => allStyles.add(s));
        });

        return {
            genres: Array.from(allGenres),
            styles: Array.from(allStyles),
        };
    } catch (error) {
        console.error("Discogs genre fetch failed:", error);
        return { genres: [], styles: [] };
    }
}

/**
 * Fetch artists for a specific genre/style from Discogs.
 */
export async function getDiscogsGenreArtists(genre: string, limit = 100): Promise<{ name: string; resource_url: string }[]> {
    if (!DISCOGS_KEY || !DISCOGS_SECRET) return [];

    // Increase per_page to discover more unique artists in niche genres
    const url = `${DISCOGS_BASE_URL}/database/search?q=${encodeURIComponent(genre)}&type=release&per_page=100`;

    try {
        const res = await fetch(url, {
            headers: DEFAULT_HEADERS,
            next: { revalidate: 86400 },
        });

        if (!res.ok) return [];

        const data = await res.json();
        const results = data.results || [];

        // Extract unique artists from release titles (e.g. "Artist - Title")
        const artistMap = new Map<string, string>();

        results.forEach((r: { title: string }) => {
            const titleParts = r.title.split(" - ");
            if (titleParts.length > 1) {
                const name = titleParts[0].trim();
                // Avoid "Various", "Unknown Artist", etc.
                if (name && !["various", "unknown artist", "unknown"].includes(name.toLowerCase())) {
                    artistMap.set(name.toLowerCase(), name);
                }
            }
        });

        return Array.from(artistMap.values()).map(name => ({
            name,
            resource_url: "" // We don't have a direct artist resource URL here without extra lookups
        }));
    } catch (error) {
        console.error("Discogs genre artists fetch failed:", error);
        return [];
    }
}
