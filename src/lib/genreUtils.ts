// src/lib/genreUtils.ts

export const NOISE_FILTER = new Set([
    "seen live", "favorite", "loved", "awesome", "favourite", "favorites", "favourite artists",
    "under 2000 listeners", "female vocalists", "male vocalists", "90s", "80s", "00s", "10s",
    "70s", "60s", "british", "american", "canadian", "swedish", "uk", "usa", "french", "german",
    "beautiful", "genius", "love", "classic", "chillout", "chill", "relax", "mellow",
    "amazing", "best", "epic", "good", "great", "nice", "my favorite", "my favorites",
    "favorite artists", "favourite artist", "fucking awesome", "all"
]);

const BROAD_GENRES = new Set([
    "rock", "pop", "alternative", "alternative rock", "indie", "indie rock", "indie pop",
    "electronic", "electronica", "hip-hop", "hip hop", "rap", "r&b", "rnb", "soul", "funk",
    "jazz", "blues", "metal", "heavy metal", "punk", "punk rock", "folk", "country",
    "classical", "reggae", "dance", "house", "techno", "trance", "ambient", "acoustic",
    "instrumental", "singer-songwriter", "world", "latin", "pop rock", "hard rock",
    "classic rock"
]);

export function parseGenres(
    tags: { name: string; count: number }[],
    minCount = 1,
    discogsGenres: string[] = [],
    discogsStyles: string[] = []
): string[] {
    // 1. If we have Discogs data, use it as the high-confidence source
    if (discogsGenres.length > 0 || discogsStyles.length > 0) {
        // We take up to 2 broad genres and 3 specific styles
        const broad = discogsGenres.map(g => g.toLowerCase()).slice(0, 2);
        const specific = discogsStyles.map(s => s.toLowerCase()).slice(0, 3);

        // Return unique combination
        return Array.from(new Set([...broad, ...specific]));
    }

    // 2. Fallback to Last.fm tags logic if Discogs data is unavailable
    const validTags = tags
        .filter((t) => t.count >= minCount && !NOISE_FILTER.has(t.name.toLowerCase()))
        .map((t) => t.name.toLowerCase());

    const broadCategories = validTags.filter((t) => BROAD_GENRES.has(t)).slice(0, 2);
    const nicheCategories = validTags.filter((t) => !BROAD_GENRES.has(t)).slice(0, 3);

    return Array.from(new Set([...broadCategories, ...nicheCategories]));
}

