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

export function parseGenres(tags: { name: string; count: number }[], minCount = 1): string[] {
    const validTags = tags
        .filter((t) => t.count >= minCount && !NOISE_FILTER.has(t.name.toLowerCase()))
        .map((t) => t.name.toLowerCase());

    const broadCategories = validTags.filter((t) => BROAD_GENRES.has(t)).slice(0, 2);
    const nicheCategories = validTags.filter((t) => !BROAD_GENRES.has(t)).slice(0, 3);

    return Array.from(new Set([...broadCategories, ...nicheCategories]));
}
