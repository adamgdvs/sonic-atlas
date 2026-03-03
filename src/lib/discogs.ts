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
export async function getDiscogsGenres(name: string): Promise<{ genres: string[]; styles: string[] }> {
    const url = `${DISCOGS_BASE_URL}/database/search?q=${encodeURIComponent(name)}&type=artist&limit=1`;

    try {
        const res = await fetch(url, {
            headers: DEFAULT_HEADERS,
            next: { revalidate: 86400 },
        });

        if (!res.ok) return { genres: [], styles: [] };

        const data = await res.json();
        const result = data.results?.[0];

        return {
            genres: result?.genre || [],
            styles: result?.style || [],
        };
    } catch (error) {
        console.error("Discogs genre fetch failed:", error);
        return { genres: [], styles: [] };
    }
}
