import { CURATED_CATALOG, type CatalogEntry } from "@/lib/curated-catalog";
import {
  getYouTubeMusicPlaylist,
  searchYouTubeMusic,
  searchYouTubeMusicPlaylists,
  type YouTubeMusicPlaylistSummary,
} from "@/lib/youtube";
import {
  matchSpotifyTrackWithFeatures,
  searchSpotifyPlaylists,
  getSpotifyPlaylistTracks,
  type SpotifyAudioFeatures,
  type SpotifyPlaylistSummary,
} from "@/lib/spotify";

export const SPOTIFY_PL_PREFIX = "spotify-pl:";
import type { CuratedPlaylist, CuratedPlaylistTrack } from "@/lib/ytmusic";

const VIRTUAL_CURATED_PREFIX = "atlas-curated";
const DEFAULT_VIRTUAL_TRACK_LIMIT = 40;
const MAX_SOURCE_PLAYLISTS = 5;

type VirtualCuratedDescriptor = {
  title: string;
  description: string;
  category: string;
  query: string;
  coverUrl?: string | null;
  trackCount?: number | null;
};

type SeedTrack = {
  artist: string;
  title: string;
};

type LaneSeedProfile = {
  seedTracks: SeedTrack[];
  preferredTrackTerms?: string[];
  excludedTrackTerms?: string[];
  targetAudio?: Partial<SpotifyAudioFeatures>;
};

type DerivedLaneProfile = {
  preferredTrackTerms: string[];
  excludedTrackTerms: string[];
  targetAudio?: Partial<SpotifyAudioFeatures>;
};

type RankedTrack = CuratedPlaylistTrack & {
  score: number;
  sourceLabel: string;
  seed: boolean;
  spotifyAudio?: SpotifyAudioFeatures | null;
};

const SEEDED_LANES: Record<string, LaneSeedProfile> = {
  "midnight-roadtrip": {
    seedTracks: [
      { artist: "Kavinsky", title: "Nightcall" },
      { artist: "College & Electric Youth", title: "A Real Hero" },
      { artist: "Chromatics", title: "Night Drive" },
      { artist: "M83", title: "Wait" },
      { artist: "The Midnight", title: "Days of Thunder" },
    ],
    preferredTrackTerms: ["night", "drive", "midnight", "neon", "city", "highway", "after dark"],
    excludedTrackTerms: ["kids", "party", "workout", "sleep"],
  },
  "90s-hiphop": {
    seedTracks: [
      { artist: "Nas", title: "N.Y. State of Mind" },
      { artist: "A Tribe Called Quest", title: "Electric Relaxation" },
      { artist: "Gang Starr", title: "Mass Appeal" },
      { artist: "Dr. Dre", title: "Nuthin' But A 'G' Thang" },
      { artist: "Wu-Tang Clan", title: "C.R.E.A.M." },
    ],
    preferredTrackTerms: ["hip hop", "boom bap", "classic", "90s", "golden era"],
    excludedTrackTerms: ["drill", "trap", "phonk"],
  },
  "indie-rock": {
    seedTracks: [
      { artist: "The Strokes", title: "Someday" },
      { artist: "Arctic Monkeys", title: "Fluorescent Adolescent" },
      { artist: "Phoenix", title: "Lisztomania" },
      { artist: "Bloc Party", title: "Helicopter" },
      { artist: "Yeah Yeah Yeahs", title: "Maps" },
    ],
    preferredTrackTerms: ["indie", "alternative", "rock", "guitar"],
    excludedTrackTerms: ["lofi", "beats", "rap", "trap"],
  },
  "happy-days": {
    seedTracks: [
      { artist: "Earth, Wind & Fire", title: "September" },
      { artist: "Hall & Oates", title: "You Make My Dreams" },
      { artist: "Katrina & The Waves", title: "Walking on Sunshine" },
      { artist: "Whitney Houston", title: "I Wanna Dance with Somebody" },
      { artist: "ABBA", title: "Dancing Queen" },
    ],
    preferredTrackTerms: ["happy", "feel good", "sunshine", "upbeat", "dance"],
    excludedTrackTerms: ["sad", "heartbreak", "cry"],
  },
  "dream-pop": {
    seedTracks: [
      { artist: "Beach House", title: "Myth" },
      { artist: "Cocteau Twins", title: "Heaven or Las Vegas" },
      { artist: "Slowdive", title: "Alison" },
      { artist: "Cigarettes After Sex", title: "Apocalypse" },
      { artist: "Alvvays", title: "Dreams Tonite" },
    ],
    preferredTrackTerms: ["dream", "ethereal", "shimmer", "reverb", "lush"],
    excludedTrackTerms: ["edm", "festival", "hardstyle"],
  },
  "afro-house": {
    seedTracks: [
      { artist: "Black Coffee", title: "Drive" },
      { artist: "Caiiro", title: "The Akan" },
      { artist: "Shimza", title: "Akulalwa" },
      { artist: "Da Capo", title: "Found You" },
      { artist: "Enoo Napa", title: "Vortex" },
    ],
    preferredTrackTerms: ["afro house", "house", "percussion", "deep", "tribal"],
    excludedTrackTerms: ["hip hop", "trap", "pop"],
  },
  "shoegaze-signals": {
    seedTracks: [
      { artist: "My Bloody Valentine", title: "Only Shallow" },
      { artist: "Slowdive", title: "When the Sun Hits" },
      { artist: "Ride", title: "Vapour Trail" },
      { artist: "Lush", title: "Sweetness and Light" },
      { artist: "Nothing", title: "Bent Nail" },
    ],
    preferredTrackTerms: ["shoegaze", "wall of sound", "reverb", "noise pop"],
    excludedTrackTerms: ["dance pop", "festival", "trap"],
  },
  "post-punk-wire": {
    seedTracks: [
      { artist: "Joy Division", title: "Disorder" },
      { artist: "Wire", title: "Three Girl Rhumba" },
      { artist: "Gang of Four", title: "Damaged Goods" },
      { artist: "The Chameleons", title: "Swamp Thing" },
      { artist: "Interpol", title: "Obstacle 1" },
    ],
    preferredTrackTerms: ["post punk", "angular", "bass", "new wave"],
    excludedTrackTerms: ["pop punk", "trap", "country"],
  },
  "ambient-drift": {
    seedTracks: [
      { artist: "Brian Eno", title: "An Ending (Ascent)" },
      { artist: "Stars of the Lid", title: "Requiem for Dying Mothers, Part 2" },
      { artist: "Loscil", title: "Endless Falls" },
      { artist: "Tim Hecker", title: "Virginal II" },
      { artist: "Biosphere", title: "Poa Alpina" },
    ],
    preferredTrackTerms: ["ambient", "drone", "atmosphere", "slow"],
    excludedTrackTerms: ["party", "workout", "trap"],
  },
  "bossa-nights": {
    seedTracks: [
      { artist: "Antônio Carlos Jobim", title: "Wave" },
      { artist: "João Gilberto", title: "Chega de Saudade" },
      { artist: "Stan Getz & João Gilberto", title: "The Girl from Ipanema" },
      { artist: "Nara Leão", title: "O Barquinho" },
      { artist: "Elis Regina & Tom Jobim", title: "Aguas de Março" },
    ],
    preferredTrackTerms: ["bossa nova", "brazil", "soft", "sway"],
    excludedTrackTerms: ["metal", "festival", "drill"],
  },
  "soul-revival": {
    seedTracks: [
      { artist: "Erykah Badu", title: "On & On" },
      { artist: "D'Angelo", title: "Brown Sugar" },
      { artist: "Jill Scott", title: "A Long Walk" },
      { artist: "Maxwell", title: "Ascension (Don't Ever Wonder)" },
      { artist: "Sade", title: "Cherish the Day" },
    ],
    preferredTrackTerms: ["neo soul", "soul", "groove", "warm"],
    excludedTrackTerms: ["hard rock", "metal"],
  },
  "jazz-house": {
    seedTracks: [
      { artist: "St Germain", title: "Rose Rouge" },
      { artist: "Moodymann", title: "Shades of Jae" },
      { artist: "Kerri Chandler", title: "Atmosphere" },
      { artist: "Chaos in the CBD", title: "Midnight in Peckham" },
      { artist: "Tour-Maubourg", title: "Floating on Silence" },
    ],
    preferredTrackTerms: ["jazz house", "house", "club", "live"],
    excludedTrackTerms: ["metal", "country", "drill"],
  },
  "study-session": {
    seedTracks: [
      { artist: "Nujabes", title: "Feather" },
      { artist: "J Dilla", title: "Time: The Donut of the Heart" },
      { artist: "Uyama Hiroto", title: "Waltz for Life Will Born" },
      { artist: "Idealism", title: "Snowfall" },
      { artist: "Brock Berrigan", title: "Point Pleasant" },
    ],
    preferredTrackTerms: ["study", "focus", "lofi", "beats"],
    excludedTrackTerms: ["party", "rage", "hardstyle"],
  },
  "coffee-shop": {
    seedTracks: [
      { artist: "Nick Drake", title: "Pink Moon" },
      { artist: "José González", title: "Heartbeats" },
      { artist: "Norah Jones", title: "Don't Know Why" },
      { artist: "Phoebe Bridgers", title: "Motion Sickness" },
      { artist: "Iron & Wine", title: "Naked as We Came" },
    ],
    preferredTrackTerms: ["coffee shop", "acoustic", "cafe", "folk"],
    excludedTrackTerms: ["metal", "drill", "festival"],
  },
  "moonlit-disco": {
    seedTracks: [
      { artist: "Jessie Ware", title: "Spotlight" },
      { artist: "Roosevelt", title: "Feels Right" },
      { artist: "Purple Disco Machine", title: "Dished (Male Stripper)" },
      { artist: "Parcels", title: "Tieduprightnow" },
      { artist: "L'Impératrice", title: "Vanille fraise" },
    ],
    preferredTrackTerms: ["nu disco", "disco", "night", "dance"],
    excludedTrackTerms: ["metal", "drill", "acoustic"],
  },
  "window-seat": {
    seedTracks: [
      { artist: "Khruangbin", title: "August 10" },
      { artist: "Air", title: "La Femme d'Argent" },
      { artist: "Men I Trust", title: "Show Me How" },
      { artist: "Zero 7", title: "Destiny" },
      { artist: "Bonobo", title: "Kerala" },
    ],
    preferredTrackTerms: ["travel", "chill", "flight", "window seat"],
    excludedTrackTerms: ["party", "festival", "workout"],
  },
  "classic-rock": {
    seedTracks: [
      { artist: "Fleetwood Mac", title: "The Chain" },
      { artist: "Led Zeppelin", title: "Ramble On" },
      { artist: "The Rolling Stones", title: "Gimme Shelter" },
      { artist: "David Bowie", title: "Heroes" },
      { artist: "Tom Petty", title: "Runnin' Down a Dream" },
    ],
    preferredTrackTerms: ["classic rock", "guitar", "anthem", "vintage"],
    excludedTrackTerms: ["drill", "edm", "kpop"],
  },
  "indie-folk": {
    seedTracks: [
      { artist: "Fleet Foxes", title: "Blue Ridge Mountains" },
      { artist: "Bon Iver", title: "Holocene" },
      { artist: "The Head and the Heart", title: "Lost in My Mind" },
      { artist: "The Paper Kites", title: "Bloom" },
      { artist: "Phoebe Bridgers", title: "Scott Street" },
    ],
    preferredTrackTerms: ["indie folk", "acoustic", "singer songwriter"],
    excludedTrackTerms: ["edm", "metal", "drill"],
  },
  "garage-rock": {
    seedTracks: [
      { artist: "The White Stripes", title: "Fell in Love with a Girl" },
      { artist: "The Hives", title: "Hate to Say I Told You So" },
      { artist: "Ty Segall", title: "Girlfriend" },
      { artist: "The Black Keys", title: "Your Touch" },
      { artist: "Bass Drum of Death", title: "Get Found" },
    ],
    preferredTrackTerms: ["garage rock", "raw", "fuzz", "lo fi"],
    excludedTrackTerms: ["soft rock", "edm", "ballad"],
  },
};

const GENRE_FAMILY_RULES: Array<{
  match: string[];
  preferred: string[];
  excluded: string[];
}> = [
  { match: ["techno"], preferred: ["techno", "club", "driving", "warehouse"], excluded: ["acoustic", "country", "ballad"] },
  { match: ["house"], preferred: ["house", "groove", "club", "deep"], excluded: ["country", "metal", "acoustic"] },
  { match: ["ambient", "drone"], preferred: ["ambient", "drone", "atmospheric", "slow"], excluded: ["party", "workout", "drop"] },
  { match: ["jungle", "drum and bass"], preferred: ["breakbeat", "bass", "rave", "amen"], excluded: ["acoustic", "country", "ballad"] },
  { match: ["punk", "hardcore"], preferred: ["punk", "hardcore", "raw", "fast"], excluded: ["ballad", "smooth", "soft"] },
  { match: ["jazz"], preferred: ["jazz", "improv", "groove", "swing"], excluded: ["hardstyle", "drill", "trap"] },
  { match: ["country", "americana", "bluegrass"], preferred: ["americana", "twang", "road", "heartland"], excluded: ["edm", "drill", "kpop"] },
  { match: ["rap", "hip hop"], preferred: ["hip hop", "bars", "beats", "classic"], excluded: ["acoustic", "country", "edm"] },
  { match: ["soul", "r&b", "neo soul"], preferred: ["soul", "groove", "warm", "late night"], excluded: ["metal", "festival", "hardstyle"] },
  { match: ["latin", "salsa", "bachata", "cumbia", "reggaeton"], preferred: ["latin", "dance", "rhythm", "percussion"], excluded: ["metal", "country", "ambient"] },
  { match: ["goth", "darkwave", "coldwave"], preferred: ["dark", "synth", "night", "goth"], excluded: ["sunshine", "kids", "happy"] },
  { match: ["dream pop", "shoegaze"], preferred: ["dream", "shimmer", "reverb", "ethereal"], excluded: ["festival", "drill", "workout"] },
];

function deriveLaneProfile(entry: CatalogEntry | null, descriptor: VirtualCuratedDescriptor): DerivedLaneProfile {
  const haystack = `${entry?.title || ""} ${entry?.searchQuery || ""} ${descriptor.title} ${descriptor.query}`;
  const normalized = normalizeText(haystack);
  const preferredTrackTerms: string[] = [];
  const excludedTrackTerms: string[] = [];
  let targetAudio: Partial<SpotifyAudioFeatures> | undefined;

  if (entry?.category === "mood") {
    preferredTrackTerms.push(...tokenize(descriptor.title), ...tokenize(entry.title));
    if (normalized.includes("happy") || normalized.includes("sunrise")) {
      targetAudio = { energy: 0.8, danceability: 0.72, valence: 0.84 };
    } else if (normalized.includes("sad") || normalized.includes("heartbreak")) {
      targetAudio = { energy: 0.4, danceability: 0.44, valence: 0.2, acousticness: 0.32 };
    } else if (normalized.includes("focus") || normalized.includes("study")) {
      targetAudio = { energy: 0.34, danceability: 0.56, valence: 0.42, instrumentalness: 0.46 };
    } else if (normalized.includes("chill") || normalized.includes("rain")) {
      targetAudio = { energy: 0.3, danceability: 0.44, valence: 0.36, acousticness: 0.38 };
    }
  }

  if (entry?.category === "era") {
    const years = tokenize(haystack).filter((token) => /^\d{4}s?$/.test(token) || /^\d{2}s$/.test(token));
    preferredTrackTerms.push(...years);
  }

  if (entry?.category === "vibe") {
    if (normalized.includes("night") || normalized.includes("midnight")) preferredTrackTerms.push("night", "after dark", "late night");
    if (normalized.includes("drive") || normalized.includes("road")) preferredTrackTerms.push("driving", "roadtrip", "motion");
    if (normalized.includes("study") || normalized.includes("focus")) preferredTrackTerms.push("focus", "instrumental", "study");
    if (normalized.includes("party")) preferredTrackTerms.push("party", "dance", "hits");
    if (normalized.includes("coffee") || normalized.includes("cafe")) preferredTrackTerms.push("acoustic", "indie", "folk");
    if (normalized.includes("night") || normalized.includes("midnight")) {
      targetAudio = { energy: 0.64, danceability: 0.62, valence: 0.42 };
    } else if (normalized.includes("drive") || normalized.includes("road")) {
      targetAudio = { energy: 0.68, danceability: 0.58, valence: 0.48 };
    } else if (normalized.includes("party")) {
      targetAudio = { energy: 0.88, danceability: 0.82, valence: 0.76 };
    } else if (normalized.includes("coffee") || normalized.includes("cafe")) {
      targetAudio = { energy: 0.34, danceability: 0.42, valence: 0.52, acousticness: 0.56 };
    }
  }

  for (const rule of GENRE_FAMILY_RULES) {
    if (rule.match.some((term) => normalized.includes(normalizeText(term)))) {
      preferredTrackTerms.push(...rule.preferred);
      excludedTrackTerms.push(...rule.excluded);
      if (!targetAudio) {
        if (rule.match.includes("house")) {
          targetAudio = { energy: 0.76, danceability: 0.8, valence: 0.62 };
        } else if (rule.match.includes("ambient") || rule.match.includes("drone")) {
          targetAudio = { energy: 0.22, danceability: 0.2, valence: 0.32, instrumentalness: 0.74 };
        } else if (rule.match.includes("rap") || rule.match.includes("hip hop")) {
          targetAudio = { energy: 0.74, danceability: 0.84, valence: 0.56 };
        } else if (rule.match.includes("dream pop") || rule.match.includes("shoegaze")) {
          targetAudio = { energy: 0.44, danceability: 0.46, valence: 0.38, acousticness: 0.24 };
        } else if (rule.match.includes("country") || rule.match.includes("americana")) {
          targetAudio = { energy: 0.46, danceability: 0.44, valence: 0.48, acousticness: 0.42 };
        }
      }
    }
  }

  return {
    preferredTrackTerms: unique(preferredTrackTerms),
    excludedTrackTerms: unique(excludedTrackTerms),
    targetAudio,
  };
}

function encodePart(value: string) {
  return encodeURIComponent(value.trim());
}

function decodePart(value: string) {
  return decodeURIComponent(value);
}

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(value: string) {
  return normalizeText(value).split(" ").filter((token) => token.length > 1);
}

function containsPhrase(haystack: string, needle: string) {
  return haystack.includes(normalizeText(needle));
}

function overlapScore(left: string, right: string) {
  const leftTokens = new Set(tokenize(left));
  const rightTokens = tokenize(right);
  if (leftTokens.size === 0 || rightTokens.length === 0) return 0;
  return rightTokens.reduce((score, token) => score + (leftTokens.has(token) ? 1 : 0), 0);
}

function countMatches(haystack: string, terms: string[]) {
  let score = 0;
  for (const term of terms) {
    if (containsPhrase(haystack, term)) score += 1;
  }
  return score;
}

function artistKey(value: string) {
  return normalizeText(value);
}

function normalizeTrackKey(track: CuratedPlaylistTrack) {
  return track.videoId || `${track.title.toLowerCase()}::${track.artist.toLowerCase()}`;
}

function buildTrackQueries({ title, query }: Pick<VirtualCuratedDescriptor, "title" | "query">) {
  const cleanedQuery = query
    .replace(/\bplaylist\b/gi, "")
    .replace(/\bessentials\b/gi, "")
    .replace(/\bhits\b/gi, "")
    .replace(/\bmix\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
  const cleanedTitle = title.replace(/_/g, " ").trim();

  return [...new Set([
    cleanedTitle,
    cleanedQuery,
    `${cleanedTitle} playlist`,
    `${cleanedQuery} playlist`,
    `${cleanedTitle} mix`,
    `${cleanedQuery} mix`,
  ].filter((item) => item && item.length >= 2))];
}

function getCatalogEntry(descriptor: VirtualCuratedDescriptor): CatalogEntry | null {
  const normalizedTitle = normalizeText(descriptor.title);
  const normalizedQuery = normalizeText(descriptor.query);

  return CURATED_CATALOG.find((entry) => {
    if (normalizeText(entry.title) === normalizedTitle) return true;
    if (normalizeText(entry.searchQuery) === normalizedQuery) return true;
    return (entry.aliases || []).some((alias) => normalizeText(alias) === normalizedTitle);
  }) || null;
}

function getLaneSeedProfile(entry: CatalogEntry | null) {
  if (!entry) return null;
  return SEEDED_LANES[entry.slug] || null;
}

function buildPreferredTerms(entry: CatalogEntry | null, laneSeeds: LaneSeedProfile | null) {
  return [
    ...(entry?.preferredTerms || []),
    ...(entry?.aliases || []),
    ...(laneSeeds?.preferredTrackTerms || []),
  ];
}

function buildExcludedTerms(entry: CatalogEntry | null, laneSeeds: LaneSeedProfile | null) {
  return [
    ...(entry?.excludedTerms || []),
    ...(laneSeeds?.excludedTrackTerms || []),
    "karaoke",
    "instrumental version",
    "slowed",
    "reverb",
    "nightcore",
    "8d audio",
    "1 hour",
    "loop",
  ];
}

function unique(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

function buildRequiredTerms(entry: CatalogEntry | null) {
  return [...(entry?.requiredTerms || [])];
}

function looksTooLiteral(track: CuratedPlaylistTrack, descriptor: VirtualCuratedDescriptor) {
  const title = normalizeText(track.title);
  const artist = normalizeText(track.artist);
  const descriptorTitle = normalizeText(descriptor.title);
  const descriptorQuery = normalizeText(descriptor.query);

  if (!descriptorTitle && !descriptorQuery) return false;

  const titleExact = title === descriptorTitle || title === descriptorQuery;
  const artistExact = artist === descriptorTitle || artist === descriptorQuery;
  const titleOverlap = Math.max(
    overlapScore(track.title, descriptor.title),
    overlapScore(track.title, descriptor.query)
  );

  return titleExact || artistExact || titleOverlap >= 3;
}

function scorePlaylistCandidate(
  candidate: YouTubeMusicPlaylistSummary,
  descriptor: VirtualCuratedDescriptor,
  entry: CatalogEntry | null,
  laneSeeds: LaneSeedProfile | null
) {
  const searchable = normalizeText(`${candidate.title} ${candidate.description}`);
  let score = 0;

  score += overlapScore(candidate.title, descriptor.title) * 2.2;
  score += overlapScore(candidate.title, descriptor.query) * 1.8;
  score += overlapScore(candidate.description, descriptor.title) * 1.2;
  score += overlapScore(candidate.description, descriptor.query) * 1.1;

  const required = buildRequiredTerms(entry);
  const derived = deriveLaneProfile(entry, descriptor);
  const preferred = unique([...buildPreferredTerms(entry, laneSeeds), ...derived.preferredTrackTerms]);
  const excluded = unique([...buildExcludedTerms(entry, laneSeeds), ...derived.excludedTrackTerms]);

  const requiredHits = countMatches(searchable, required);
  if (required.length > 0) {
    if (requiredHits === required.length) score += 6;
    else score -= (required.length - requiredHits) * 5;
  }

  score += Math.min(8, countMatches(searchable, preferred) * 1.25);
  score -= countMatches(searchable, excluded) * 4.5;

  const trackCount = candidate.trackCount || 0;
  if (trackCount >= 30 && trackCount <= 120) score += 2;
  else if (trackCount > 0 && trackCount < 20) score -= 4;

  return score;
}

async function resolveSeedTracks(
  laneSeeds: LaneSeedProfile | null
): Promise<RankedTrack[]> {
  if (!laneSeeds) return [];

  const resolved = await Promise.all(
    laneSeeds.seedTracks.map(async (seed, index) => {
      const results = await searchYouTubeMusic(`${seed.artist} ${seed.title}`, 5);
      const match = results.find((track) => {
        const titleScore = overlapScore(track.title, seed.title);
        const artistScore = overlapScore(track.artist, seed.artist);
        return titleScore >= 2 && artistScore >= 1;
      }) || results[0];

      if (!match?.videoId) return null;

      return {
        title: match.title,
        artist: match.artist,
        videoId: match.videoId,
        coverUrl: match.thumbnailUrl,
        score: 40 - index,
        sourceLabel: "seed",
        seed: true,
      } satisfies RankedTrack;
    })
  );

  return resolved.filter((track): track is NonNullable<typeof track> => track !== null);
}

function scoreTrack(
  track: CuratedPlaylistTrack,
  descriptor: VirtualCuratedDescriptor,
  entry: CatalogEntry | null,
  laneSeeds: LaneSeedProfile | null,
  sourceScore: number
) {
  if (looksTooLiteral(track, descriptor)) return -100;

  const searchable = normalizeText(`${track.title} ${track.artist}`);
  const required = buildRequiredTerms(entry);
  const derived = deriveLaneProfile(entry, descriptor);
  const preferred = unique([...buildPreferredTerms(entry, laneSeeds), ...derived.preferredTrackTerms]);
  const excluded = unique([...buildExcludedTerms(entry, laneSeeds), ...derived.excludedTrackTerms]);

  let score = sourceScore;
  score += overlapScore(track.title, descriptor.title) * 0.35;
  score += overlapScore(track.artist, descriptor.title) * 0.2;
  score += countMatches(searchable, preferred) * 1.1;
  score -= countMatches(searchable, excluded) * 5;

  if (required.length > 0) {
    const requiredHits = countMatches(searchable, required);
    if (requiredHits === 0) score -= 2.5;
    else score += requiredHits * 1.5;
  }

  return score;
}

function audioFeatureDistance(value: number | undefined, target: number | undefined, weight: number) {
  if (typeof value !== "number" || typeof target !== "number") return 0;
  return Math.abs(value - target) * weight;
}

function scoreAudioAlignment(
  features: SpotifyAudioFeatures,
  target: Partial<SpotifyAudioFeatures> | undefined
) {
  if (!target) return 0;

  const distance =
    audioFeatureDistance(features.energy, target.energy, 2.2) +
    audioFeatureDistance(features.danceability, target.danceability, 2.2) +
    audioFeatureDistance(features.valence, target.valence, 2.4) +
    audioFeatureDistance(features.acousticness, target.acousticness, 1.4) +
    audioFeatureDistance(features.instrumentalness, target.instrumentalness, 1.4);

  return Math.max(-2.5, 4.5 - distance * 2.5);
}

async function rerankWithSpotify(
  rankedTracks: RankedTrack[],
  descriptor: VirtualCuratedDescriptor,
  entry: CatalogEntry | null,
  laneSeeds: LaneSeedProfile | null,
  limit: number
) {
  const derived = deriveLaneProfile(entry, descriptor);
  const targetAudio = laneSeeds?.targetAudio || derived.targetAudio;
  if (!targetAudio) return rankedTracks;

  const enrichmentWindow = rankedTracks
    .slice()
    .sort((left, right) => right.score - left.score)
    .slice(0, Math.min(Math.max(limit * 2, 24), 48));

  const enrichments = await Promise.all(
    enrichmentWindow.map(async (track) => {
      try {
        const spotify = await matchSpotifyTrackWithFeatures(track.title, track.artist);
        if (!spotify?.features) return null;
        return {
          key: normalizeTrackKey(track),
          features: spotify.features,
          bonus: scoreAudioAlignment(spotify.features, targetAudio),
        };
      } catch {
        return null;
      }
    })
  );

  const audioMap = new Map(
    enrichments
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .map((item) => [item.key, item])
  );

  return rankedTracks.map((track) => {
    const enrichment = audioMap.get(normalizeTrackKey(track));
    if (!enrichment) return track;
    return {
      ...track,
      score: track.score + enrichment.bonus,
      spotifyAudio: enrichment.features,
    };
  });
}

function sequenceTracks(tracks: RankedTrack[], limit: number) {
  const remaining = [...tracks].sort((left, right) => right.score - left.score);
  const sequenced: RankedTrack[] = [];
  const artistCounts = new Map<string, number>();
  let previousArtist = "";

  while (remaining.length > 0 && sequenced.length < limit) {
    let bestIndex = 0;
    let bestScore = -Infinity;

    for (let index = 0; index < remaining.length; index += 1) {
      const track = remaining[index];
      const normalizedArtist = artistKey(track.artist);
      let score = track.score;

      if (track.seed) score += sequenced.length < 6 ? 6 : 1.5;
      if (normalizedArtist === previousArtist) score -= 8;
      score -= (artistCounts.get(normalizedArtist) || 0) * 3.5;

      if (score > bestScore) {
        bestScore = score;
        bestIndex = index;
      }
    }

    const [selected] = remaining.splice(bestIndex, 1);
    if (!selected) break;

    const normalizedArtist = artistKey(selected.artist);
    artistCounts.set(normalizedArtist, (artistCounts.get(normalizedArtist) || 0) + 1);
    previousArtist = normalizedArtist;
    sequenced.push(selected);
  }

  return sequenced;
}

export function isVirtualCuratedId(id: string) {
  return id.startsWith(`${VIRTUAL_CURATED_PREFIX}::`);
}

export function buildVirtualCuratedPlaylist({
  title,
  description,
  category,
  query,
  coverUrl = null,
  trackCount = null,
}: VirtualCuratedDescriptor): CuratedPlaylist {
  return {
    id: [
      VIRTUAL_CURATED_PREFIX,
      encodePart(category || "curated"),
      encodePart(title),
      encodePart(query),
      encodePart(description || ""),
    ].join("::"),
    title,
    description,
    coverUrl,
    source: "atlas",
    category,
    trackCount,
  };
}

export function parseVirtualCuratedId(id: string): VirtualCuratedDescriptor | null {
  if (!isVirtualCuratedId(id)) return null;
  const parts = id.split("::");
  if (parts.length < 4) return null;

  return {
    category: decodePart(parts[1]) || "curated",
    title: decodePart(parts[2]) || "Curated Set",
    query: decodePart(parts[3]) || "",
    description: parts[4] ? decodePart(parts[4]) : "",
  };
}

// ─── Spotify playlist as source ──────────────────────────────────────────────

export function buildSpotifySourcedPlaylist(
  playlist: SpotifyPlaylistSummary,
  category: string
): CuratedPlaylist {
  return buildVirtualCuratedPlaylist({
    title: playlist.name,
    description: playlist.description || `${playlist.name} — curated by Spotify`,
    category,
    query: `${SPOTIFY_PL_PREFIX}${playlist.id}`,
    coverUrl: playlist.coverUrl,
    trackCount: playlist.trackCount,
  });
}

function extractSpotifyPlaylistId(query: string): string | null {
  return query.startsWith(SPOTIFY_PL_PREFIX) ? query.slice(SPOTIFY_PL_PREFIX.length) : null;
}

async function resolveSpotifyPlaylistToYT(
  spotifyPlaylistId: string,
  limit: number
): Promise<CuratedPlaylistTrack[]> {
  const spotifyTracks = await getSpotifyPlaylistTracks(spotifyPlaylistId, limit + 20);
  if (!spotifyTracks.length) return [];

  const resolved: CuratedPlaylistTrack[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < spotifyTracks.length && resolved.length < limit; i += 8) {
    const batch = spotifyTracks.slice(i, i + 8);
    const results = await Promise.all(batch.map((t) => resolveTrackToYT(t.title, t.artist)));
    for (const track of results) {
      if (!track) continue;
      const key = normalizeTrackKey(track);
      if (seen.has(key)) continue;
      seen.add(key);
      resolved.push(track);
    }
  }

  return resolved;
}

// ─── Spotify-sourced search-based resolution ──────────────────────────────────

async function resolveTrackToYT(
  title: string,
  artist: string
): Promise<CuratedPlaylistTrack | null> {
  const results = await searchYouTubeMusic(`${artist} ${title}`, 5);
  const match =
    results.find((r) => overlapScore(r.title, title) >= 2 && overlapScore(r.artist, artist) >= 1) ||
    results[0];
  if (!match?.videoId) return null;
  return {
    title,
    artist,
    videoId: match.videoId,
    coverUrl: match.thumbnailUrl,
  };
}

function scoreSpotifyPlaylist(
  playlist: SpotifyPlaylistSummary,
  descriptor: VirtualCuratedDescriptor
) {
  let score = 0;
  score += overlapScore(playlist.name, descriptor.title) * 2.5;
  score += overlapScore(playlist.name, descriptor.query) * 2.0;
  score += overlapScore(playlist.description, descriptor.title) * 1.0;
  if (playlist.owner.toLowerCase() === "spotify") score += 6;

  const tc = playlist.trackCount ?? 0;
  if (tc >= 40 && tc <= 120) score += 4;
  else if (tc >= 20 && tc < 40) score += 1;
  else if (tc > 120 && tc <= 300) score += 2;
  else if (tc > 0 && tc < 20) score -= 3;

  return score;
}

async function resolveViaSpotify(
  descriptor: VirtualCuratedDescriptor,
  entry: CatalogEntry | null,
  limit: number
): Promise<CuratedPlaylistTrack[] | null> {
  const query = entry?.searchQuery || descriptor.query;
  const playlists = await searchSpotifyPlaylists(query, 10);
  if (!playlists.length) return null;

  const ranked = playlists
    .map((p) => ({ playlist: p, score: scoreSpotifyPlaylist(p, descriptor) }))
    .sort((a, b) => b.score - a.score);

  for (const { playlist } of ranked) {
    if (playlist.trackCount !== null && playlist.trackCount < 20) continue;

    const spotifyTracks = await getSpotifyPlaylistTracks(playlist.id, limit + 20);
    if (spotifyTracks.length < 20) continue;

    // Resolve tracks to YouTube IDs in batches of 8 concurrent
    const resolved: CuratedPlaylistTrack[] = [];
    const seen = new Set<string>();

    for (let i = 0; i < spotifyTracks.length && resolved.length < limit; i += 8) {
      const batch = spotifyTracks.slice(i, i + 8);
      const results = await Promise.all(batch.map((t) => resolveTrackToYT(t.title, t.artist)));
      for (const track of results) {
        if (!track) continue;
        const key = normalizeTrackKey(track);
        if (seen.has(key)) continue;
        seen.add(key);
        resolved.push(track);
        if (resolved.length >= limit) break;
      }
    }

    if (resolved.length >= 30) return resolved;
  }

  return null;
}

// ─── Main resolver ────────────────────────────────────────────────────────────

export async function resolveVirtualCuratedPlaylist(
  descriptor: VirtualCuratedDescriptor,
  limit = DEFAULT_VIRTUAL_TRACK_LIMIT
): Promise<CuratedPlaylist> {
  const entry = getCatalogEntry(descriptor);
  const laneSeeds = getLaneSeedProfile(entry);
  const queries = buildTrackQueries(descriptor);

  // Direct Spotify playlist resolution — when hub item was sourced from Browse API
  const spotifyPlaylistId = extractSpotifyPlaylistId(descriptor.query);
  if (spotifyPlaylistId) {
    const tracks = await resolveSpotifyPlaylistToYT(spotifyPlaylistId, limit).catch(() => []);
    if (tracks.length >= 10) {
      const coverUrl = descriptor.coverUrl || tracks[0]?.coverUrl || null;
      return {
        ...buildVirtualCuratedPlaylist({ ...descriptor, coverUrl, trackCount: tracks.length }),
        tracks,
      };
    }
  }

  // Try Spotify editorial playlists first — highest quality track sourcing
  const spotifyTracks = await resolveViaSpotify(descriptor, entry, limit).catch(() => null);
  if (spotifyTracks && spotifyTracks.length >= 30) {
    const coverUrl = descriptor.coverUrl || spotifyTracks[0]?.coverUrl || null;
    return {
      ...buildVirtualCuratedPlaylist({ ...descriptor, coverUrl, trackCount: spotifyTracks.length }),
      tracks: spotifyTracks,
    };
  }

  const playlistCandidates = await Promise.all(
    queries.map(async (query) => searchYouTubeMusicPlaylists(query, 8))
  );

  const candidateMap = new Map<string, { candidate: YouTubeMusicPlaylistSummary; score: number }>();
  for (const batch of playlistCandidates) {
    for (const candidate of batch) {
      const score = scorePlaylistCandidate(candidate, descriptor, entry, laneSeeds);
      const existing = candidateMap.get(candidate.id);
      if (!existing || score > existing.score) {
        candidateMap.set(candidate.id, { candidate, score });
      }
    }
  }

  const topPlaylists = [...candidateMap.values()]
    .sort((left, right) => right.score - left.score)
    .slice(0, MAX_SOURCE_PLAYLISTS);

  const rankedTracks: RankedTrack[] = [];
  const seen = new Set<string>();

  const seededTracks = await resolveSeedTracks(laneSeeds);
  for (const track of seededTracks) {
    const key = normalizeTrackKey(track);
    if (seen.has(key)) continue;
    seen.add(key);
    rankedTracks.push(track);
  }

  for (const { candidate, score } of topPlaylists) {
    const playlist = await getYouTubeMusicPlaylist(candidate.id, 70);
    if (!playlist?.tracks?.length) continue;

    for (const track of playlist.tracks) {
      const key = normalizeTrackKey(track);
      if (seen.has(key)) continue;

      const trackScore = scoreTrack(track, descriptor, entry, laneSeeds, score);
      if (trackScore < 0) continue;

      seen.add(key);
      rankedTracks.push({
        ...track,
        score: trackScore,
        sourceLabel: candidate.title,
        seed: false,
      });
    }
  }

  if (rankedTracks.length < Math.min(limit, 20)) {
    for (const query of queries) {
      const results = await searchYouTubeMusic(query, 20);
      for (const result of results) {
        const track: CuratedPlaylistTrack = {
          title: result.title,
          artist: result.artist,
          videoId: result.videoId,
          coverUrl: result.thumbnailUrl,
        };
        const key = normalizeTrackKey(track);
        if (seen.has(key)) continue;

        const trackScore = scoreTrack(track, descriptor, entry, laneSeeds, 2.5);
        if (trackScore < 0) continue;

        seen.add(key);
        rankedTracks.push({
          ...track,
          score: trackScore,
          sourceLabel: query,
          seed: false,
        });

        if (rankedTracks.length >= limit * 2) break;
      }
      if (rankedTracks.length >= limit * 2) break;
    }
  }

  const spotifyRankedTracks = await rerankWithSpotify(
    rankedTracks,
    descriptor,
    entry,
    laneSeeds,
    limit
  );

  const tracks = sequenceTracks(spotifyRankedTracks, limit).map((track) => ({
    title: track.title,
    artist: track.artist,
    videoId: track.videoId,
    coverUrl: track.coverUrl,
  }));
  const coverUrl = descriptor.coverUrl || tracks[0]?.coverUrl || null;

  return {
    ...buildVirtualCuratedPlaylist({
      ...descriptor,
      coverUrl,
      trackCount: tracks.length,
    }),
    tracks,
  };
}
