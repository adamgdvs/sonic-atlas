/**
 * EveryNoise Intelligence Layer
 * Provides canonical artist-to-genre mappings for micro-genres
 * that are under-represented in Last.fm user tags.
 */

export interface EveryNoiseArtist {
    name: string;
    spotifyId: string;
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
            console.warn(`EveryNoise fetch failed for ${genre} (${url}): ${res.status}`);
            return [];
        }

        const html = await res.text();

        /**
         * EveryNoise artist element structure:
         * <div id="item0" ... class="genre" ... title="Artist Name">Artist Name<a class="p" ...>»</a></div>
         */
        const artistRegex = /<div[^>]*class=["']genre["'][^>]*title=["']([^"']+)["'][^>]*>/g;
        const idRegex = /playp\(['"]([^'"]+)['"]/;

        const artists: EveryNoiseArtist[] = [];
        let match;

        while ((match = artistRegex.exec(html)) !== null) {
            const name = match[1].trim();

            // Attempt to extract Spotify ID from the neighboring onclick or same div
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
