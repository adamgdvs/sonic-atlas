import type { CatalogCategory, CatalogEntry } from "@/lib/curated-catalog";

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function tokenize(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter((token) => token.length > 1);
}

function unique<T>(values: T[]) {
  return [...new Set(values)];
}

function subtitleFor(category: CatalogCategory, title: string) {
  switch (category) {
    case "mood":
      return `${title} signal lane for curious listening`;
    case "era":
      return `${title} staples and adjacent rediscoveries`;
    case "vibe":
      return `${title} atmosphere routed into a playable set`;
    case "genre":
      return `${title} essentials and adjacent scenes`;
  }
}

function makeEntry(
  category: CatalogCategory,
  title: string,
  searchQuery?: string,
  extra?: Partial<CatalogEntry>
): CatalogEntry {
  const query = searchQuery || `${title.toLowerCase()} playlist`;
  const tags = unique([
    ...tokenize(title),
    ...tokenize(query),
    category,
    ...(extra?.tags || []),
  ]);

  return {
    slug: extra?.slug || slugify(title),
    title,
    subtitle: extra?.subtitle || subtitleFor(category, title),
    category,
    searchQuery: query,
    tags,
    aliases: extra?.aliases,
    requiredTerms: extra?.requiredTerms,
    preferredTerms: unique([
      ...tokenize(title).filter((term) => term.length > 2),
      ...(extra?.preferredTerms || []),
    ]),
    excludedTerms: extra?.excludedTerms,
    featured: extra?.featured,
    minTracks: extra?.minTracks,
    idealTrackRange: extra?.idealTrackRange || [40, 100],
  };
}

const BASELINE_GENRES = [
  "Synthpop", "Trip-Hop", "Downtempo", "Techno", "Detroit Techno", "Minimal Techno",
  "Melodic Techno", "Progressive House", "Deep House", "French House", "Electro House",
  "Microhouse", "Breakbeat", "Big Beat", "Drum and Bass", "Liquid Drum and Bass",
  "Jungle", "UK Garage", "2-Step Garage", "Bassline", "Dubstep", "Future Garage",
  "Trance", "Progressive Trance", "Psytrance", "Hardgroove", "Electroclash", "EBM",
  "Industrial", "Industrial Rock", "Darkwave", "Coldwave", "Goth Rock", "Post-Industrial",
  "Synthwave", "Retrowave", "Vaporwave", "Chillwave", "Nu Disco", "Italo Disco",
  "Boogie", "City Pop", "Amapiano", "Gqom", "Kuduro", "Afroswing", "Baile Funk",
  "Funk Carioca", "Salsa", "Bachata", "Cumbia", "Merengue", "Bolero", "Latin Alternative",
  "Corridos Tumbados", "Regional Mexican", "Norteño", "Tejano", "Flamenco Pop", "Fado Pop",
  "Bossa Nova", "MPB", "Samba Soul", "Tropicália", "Highlife", "Soukous", "Makossa",
  "Raï", "Gnawa Fusion", "Desert Blues", "Alt-R&B", "Neo-Soul", "Conscious Rap",
  "Underground Hip Hop", "Jazz Rap", "Cloud Rap", "Memphis Rap", "West Coast Rap",
  "East Coast Rap", "Alternative Hip Hop", "Emo Rap", "Pop Punk", "Skate Punk",
  "Hardcore Punk", "Post-Hardcore", "Math Rock", "Post-Rock", "Slowcore", "Emo Revival",
  "Indie Pop", "Art Pop", "Baroque Pop", "Chamber Pop", "Psychedelic Pop", "Dream Pop",
  "Shoegaze", "Noise Pop", "Britpop", "Madchester", "Baggy", "Grunge", "Garage Punk",
  "Stoner Rock", "Desert Rock", "Psych Rock", "Krautrock", "Folk Rock", "Americana",
  "Bluegrass", "Roots Rock", "Outlaw Country", "Honky Tonk", "Contemporary Gospel",
  "Spiritual Jazz", "Jazz Fusion", "Jazz Funk", "Acid Jazz", "Soul Jazz", "Bebop",
  "Hard Bop", "Cool Jazz", "Latin Jazz", "Ambient", "Drone", "New Age", "Meditation",
  "Lofi Beats", "Glitch Hop", "Wonky", "Footwork", "Juke", "Hyperpop", "Electropop",
  "K-Indie", "J-Rock", "J-Pop", "Anime Pop", "Visual Kei", "Twee Pop"
];

const MOOD_ADJECTIVES = [
  "Euphoric", "Melancholy", "Tender", "Restless", "Weightless", "Hopeful", "Romantic",
  "Cathartic", "Dreamy", "Reflective", "Fearless", "Bittersweet", "Smoky", "Radiant"
];

const MOOD_NOUNS = [
  "Glow", "Drift", "Pulse", "Weather", "Motion", "Hours", "Recovery", "Bloom"
];

const TIME_PREFIXES = [
  "Midnight", "After Hours", "Sunrise", "Golden Hour", "Blue Hour", "Twilight",
  "Moonlight", "Dawn", "Late Night", "Daybreak", "Sunday Morning", "Monday Reset",
  "Red-Eye", "First Light", "Neon", "Rainy"
];

const SCENES = [
  "Drive", "Commute", "Rooftop", "Coastline", "Train Ride", "City Walk",
  "Study Hall", "Smoke Session", "Bonfire", "Poolside", "Hotel Lobby", "Warehouse"
];

const CITY_PREFIXES = [
  "Tokyo", "Lagos", "Seoul", "Rio", "London", "Paris", "Mexico City", "Miami",
  "Berlin", "Barcelona", "Kingston", "Johannesburg"
];

const CITY_SCENES = [
  "Night Drive", "After Dark", "Rooftop", "Sunrise", "Club Warmup", "Rain Walk",
  "Neon Drift", "Dawn Commute"
];

const ERA_DECADES = [
  "1950s", "1960s", "1970s", "1980s", "1990s", "2000s", "2010s", "2020s"
];

const ERA_STYLES = [
  "Rock", "Pop", "Soul", "Funk", "Disco", "Hip Hop", "R&B", "Indie", "Country", "Dance", "Alternative"
];

const GENERATED_MOODS = MOOD_ADJECTIVES.flatMap((adjective) =>
  MOOD_NOUNS.map((noun) =>
    makeEntry("mood", `${adjective} ${noun}`, `${adjective.toLowerCase()} ${noun.toLowerCase()} playlist`)
  )
);

const GENERATED_VIBES = [
  ...TIME_PREFIXES.flatMap((prefix) =>
    SCENES.map((scene) =>
      makeEntry("vibe", `${prefix} ${scene}`, `${prefix.toLowerCase()} ${scene.toLowerCase()} playlist`)
    )
  ),
  ...CITY_PREFIXES.flatMap((city) =>
    CITY_SCENES.map((scene) =>
      makeEntry("vibe", `${city} ${scene}`, `${city.toLowerCase()} ${scene.toLowerCase()} playlist`)
    )
  ),
];

const GENERATED_ERAS = ERA_DECADES.flatMap((decade) =>
  ERA_STYLES.map((style) =>
    makeEntry("era", `${decade} ${style}`, `${decade.toLowerCase()} ${style.toLowerCase()} playlist`)
  )
);

const GENERATED_GENRES = BASELINE_GENRES.map((genre) =>
  makeEntry("genre", genre, `${genre.toLowerCase()} playlist`)
);

export const BASELINE_CURATED_CATALOG: CatalogEntry[] = [
  ...GENERATED_MOODS,
  ...GENERATED_VIBES,
  ...GENERATED_ERAS,
  ...GENERATED_GENRES,
];
