// Hand-picked curated playlist themes. Each entry maps to a YouTube Music
// search query whose top result is expected to be a large (>=40 track)
// editorial or community playlist. The resolver in /api/playlists/catalog
// filters candidates by trackCount >= MIN_TRACKS so we only surface sets
// that meet the quality floor.

export const MIN_TRACKS = 40;

export type CatalogCategory = "mood" | "era" | "vibe" | "genre";

export interface CatalogEntry {
  slug: string;
  title: string;
  subtitle: string;
  category: CatalogCategory;
  searchQuery: string;
  featured?: boolean;
  tags: string[];
}

export const CURATED_CATALOG: CatalogEntry[] = [
  // ═══ Mood ═══
  {
    slug: "feeling-happy",
    title: "Feeling Happy",
    subtitle: "Uplifting hits to move the room",
    category: "mood",
    searchQuery: "feel good happy hits playlist",
    featured: true,
    tags: ["happy", "upbeat", "mood"],
  },
  {
    slug: "sad-bangers",
    title: "Sad Bangers",
    subtitle: "Big feelings, bigger choruses",
    category: "mood",
    searchQuery: "sad songs playlist",
    tags: ["sad", "emotional", "mood"],
  },
  {
    slug: "focus-flow",
    title: "Focus Flow",
    subtitle: "Deep work, low friction",
    category: "mood",
    searchQuery: "deep focus instrumental playlist",
    featured: true,
    tags: ["focus", "work", "instrumental"],
  },
  {
    slug: "chill-vibes",
    title: "Chill Vibes",
    subtitle: "Easy listening, zero pressure",
    category: "mood",
    searchQuery: "chill vibes playlist",
    tags: ["chill", "relax", "mood"],
  },
  {
    slug: "rage-mode",
    title: "Rage Mode",
    subtitle: "High-octane workout & pregame",
    category: "mood",
    searchQuery: "workout hype playlist",
    tags: ["workout", "energy", "hype"],
  },
  {
    slug: "heartbreak",
    title: "Heartbreak",
    subtitle: "Soundtrack for the after-hours",
    category: "mood",
    searchQuery: "heartbreak songs playlist",
    tags: ["sad", "breakup", "mood"],
  },
  {
    slug: "rainy-day",
    title: "Rainy Day",
    subtitle: "Grey windows, warm speakers",
    category: "mood",
    searchQuery: "rainy day playlist",
    tags: ["calm", "rain", "mood"],
  },

  // ═══ Era ═══
  {
    slug: "70s-classics",
    title: "70's Classics",
    subtitle: "Arena rock, funk, and soft-rock staples",
    category: "era",
    searchQuery: "70s rock classics playlist",
    tags: ["70s", "classic-rock", "era"],
  },
  {
    slug: "80s-power-pop",
    title: "80's Power Pop",
    subtitle: "Synths, hair, and stadium hooks",
    category: "era",
    searchQuery: "80s pop hits playlist",
    featured: true,
    tags: ["80s", "pop", "era"],
  },
  {
    slug: "90s-hiphop",
    title: "90's HipHop",
    subtitle: "Golden era boom-bap and West Coast cuts",
    category: "era",
    searchQuery: "90s hip hop classics playlist",
    featured: true,
    tags: ["90s", "hip-hop", "era"],
  },
  {
    slug: "2000s-throwbacks",
    title: "2000's Throwbacks",
    subtitle: "Y2K radio, emo, and crunk anthems",
    category: "era",
    searchQuery: "2000s throwback hits playlist",
    tags: ["2000s", "throwback", "era"],
  },
  {
    slug: "2010s-hits",
    title: "2010's Hits",
    subtitle: "Streaming-era pop and indie crossovers",
    category: "era",
    searchQuery: "2010s hits playlist",
    tags: ["2010s", "pop", "era"],
  },

  // ═══ Vibe / Scene ═══
  {
    slug: "midnight-roadtrip",
    title: "Midnight Roadtrip",
    subtitle: "Empty highways and moody synths",
    category: "vibe",
    searchQuery: "late night driving playlist",
    featured: true,
    tags: ["road", "night", "vibe"],
  },
  {
    slug: "sunset-drives",
    title: "Sunset Drives",
    subtitle: "Golden hour on open road",
    category: "vibe",
    searchQuery: "sunset driving playlist",
    tags: ["sunset", "road", "vibe"],
  },
  {
    slug: "coffee-shop",
    title: "Coffee Shop",
    subtitle: "Acoustic textures and quiet conversation",
    category: "vibe",
    searchQuery: "coffee shop acoustic playlist",
    tags: ["acoustic", "cafe", "vibe"],
  },
  {
    slug: "house-party",
    title: "House Party",
    subtitle: "Floor-filler energy all night",
    category: "vibe",
    searchQuery: "house party hits playlist",
    tags: ["party", "dance", "vibe"],
  },
  {
    slug: "morning-run",
    title: "Morning Run",
    subtitle: "BPM-locked for steady cadence",
    category: "vibe",
    searchQuery: "running workout playlist",
    tags: ["run", "workout", "vibe"],
  },
  {
    slug: "dinner-jazz",
    title: "Dinner Jazz",
    subtitle: "Mid-tempo standards and modern fusion",
    category: "vibe",
    searchQuery: "dinner jazz playlist",
    tags: ["jazz", "dinner", "vibe"],
  },
  {
    slug: "study-session",
    title: "Study Session",
    subtitle: "Lo-fi and ambient for long focus blocks",
    category: "vibe",
    searchQuery: "lofi study playlist",
    tags: ["study", "lofi", "vibe"],
  },
  {
    slug: "beach-bonfire",
    title: "Beach Bonfire",
    subtitle: "Warm harmonies after the sun drops",
    category: "vibe",
    searchQuery: "beach bonfire playlist",
    tags: ["beach", "summer", "vibe"],
  },

  // ═══ Genre ═══
  {
    slug: "indie-hits",
    title: "Indie Hits",
    subtitle: "Modern indie rock & pop anthems",
    category: "genre",
    searchQuery: "best indie rock playlist",
    featured: true,
    tags: ["indie", "rock", "genre"],
  },
  {
    slug: "pop-princess",
    title: "Pop Princess",
    subtitle: "Top 40 bops and diva moments",
    category: "genre",
    searchQuery: "pop hits playlist",
    tags: ["pop", "genre"],
  },
  {
    slug: "rnb-slow-jams",
    title: "R&B Slow Jams",
    subtitle: "Late-night grooves and quiet storms",
    category: "genre",
    searchQuery: "rnb slow jams playlist",
    tags: ["rnb", "slow", "genre"],
  },
  {
    slug: "country-roads",
    title: "Country Roads",
    subtitle: "Modern country and alt-country cuts",
    category: "genre",
    searchQuery: "country hits playlist",
    tags: ["country", "genre"],
  },
  {
    slug: "latin-heat",
    title: "Latin Heat",
    subtitle: "Reggaeton, Latin pop, and street classics",
    category: "genre",
    searchQuery: "latin hits playlist",
    tags: ["latin", "reggaeton", "genre"],
  },
  {
    slug: "afrobeats-fire",
    title: "Afrobeats Fire",
    subtitle: "Lagos to the rest of the world",
    category: "genre",
    searchQuery: "afrobeats hits playlist",
    tags: ["afrobeats", "genre"],
  },
  {
    slug: "kpop-essentials",
    title: "K-Pop Essentials",
    subtitle: "Group cuts and solo showcases",
    category: "genre",
    searchQuery: "kpop hits playlist",
    tags: ["kpop", "genre"],
  },
  {
    slug: "classic-rock",
    title: "Classic Rock",
    subtitle: "Guitar-forward arena staples",
    category: "genre",
    searchQuery: "classic rock hits playlist",
    tags: ["rock", "classic", "genre"],
  },
  {
    slug: "edm-festival",
    title: "EDM Festival",
    subtitle: "Main-stage builds and drops",
    category: "genre",
    searchQuery: "edm festival hits playlist",
    tags: ["edm", "dance", "genre"],
  },
  {
    slug: "metal-essentials",
    title: "Metal Essentials",
    subtitle: "Riffs, speed, and atmosphere",
    category: "genre",
    searchQuery: "metal essentials playlist",
    tags: ["metal", "rock", "genre"],
  },
];

export const CATALOG_CATEGORIES: Array<{ id: CatalogCategory; label: string }> = [
  { id: "mood", label: "Mood" },
  { id: "era", label: "Era" },
  { id: "vibe", label: "Vibe" },
  { id: "genre", label: "Genre" },
];
