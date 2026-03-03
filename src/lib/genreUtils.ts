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
    const allCandidates = new Set<string>();

    // 1. Add Discogs (High Priority)
    discogsGenres.forEach(g => allCandidates.add(g.toLowerCase()));
    discogsStyles.forEach(s => allCandidates.add(s.toLowerCase()));

    // 2. Add Last.fm Tags (High Detail)
    tags.filter(t => t.count >= minCount && !NOISE_FILTER.has(t.name.toLowerCase()))
        .forEach(t => allCandidates.add(t.name.toLowerCase()));

    const validTags = Array.from(allCandidates);

    // Filter into Broad and Niche
    const broadCategories = validTags.filter((t) => BROAD_GENRES.has(t)).slice(0, 3); // Take up to 3 broad
    const nicheCategories = validTags.filter((t) => !BROAD_GENRES.has(t)).slice(0, 10); // Take up to 10 niche

    return Array.from(new Set([...broadCategories, ...nicheCategories]));
}

/**
 * Calculates a similarity score (0-1) between two sets of genres.
 * Favors niche sub-genres over broad categories.
 */
export function calculateGenreSimilarity(source: string[], candidate: string[]): number {
    if (source.length === 0 || candidate.length === 0) return 0;

    const sourceSet = new Set(source.map(g => g.toLowerCase()));
    const candidateSet = new Set(candidate.map(g => g.toLowerCase()));

    let score = 0;
    let matches = 0;

    candidateSet.forEach(genre => {
        if (sourceSet.has(genre)) {
            matches++;
            // Specific styles (not in BROAD_GENRES) provide a MUCH higher weight
            if (!BROAD_GENRES.has(genre)) {
                score += 10; // Significant boost for niche overlap
            } else {
                score += 1;
            }
        }
    });

    if (matches === 0) return 0;

    // Normalize score. 
    // We want a high score for even 1-2 niche matches.
    const maxPotential = sourceSet.size * 5;
    return Math.min(1, score / maxPotential);
}

/**
 * Returns only the niche sub-genres from a list of genres.
 */
export function getNicheStyles(genres: string[]): string[] {
    const BROAD_GENRES_LOCAL = new Set([
        "rock", "pop", "alternative", "alternative rock", "indie", "indie rock", "indie pop",
        "electronic", "electronica", "hip-hop", "hip hop", "rap", "r&b", "rnb", "soul", "funk",
        "jazz", "blues", "metal", "heavy metal", "punk", "punk rock", "folk", "country",
        "classical", "reggae", "dance", "house", "techno", "trance", "ambient", "acoustic",
        "instrumental", "singer-songwriter", "world", "latin", "pop rock", "hard rock",
        "classic rock"
    ]);
    return genres.filter(g => !BROAD_GENRES_LOCAL.has(g.toLowerCase()));
}

