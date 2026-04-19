import { NextResponse } from "next/server";
import { DEFAULT_MIN_CURATED_TRACKS } from "@/lib/playlist-ranking";
import { buildResolverEntry, resolveCuratedPlaylist } from "@/lib/curated-resolver";
import { buildVirtualCuratedPlaylist, buildSpotifySourcedPlaylist } from "@/lib/virtual-curated";
import {
  getCategoryPlaylists,
  getFeaturedPlaylists,
  type SpotifyPlaylistSummary,
} from "@/lib/spotify";

type Preset = {
  label: string;
  query: string;
  category: "featured" | "genre" | "mood" | "activity" | "era";
  tone: string;
};

const PRESETS: Preset[] = [
  { label: "90s Hip Hop", query: "90s hip hop essentials playlist", category: "featured", tone: "golden era rap" },
  { label: "Midnight Roadtrip", query: "midnight road trip playlist", category: "featured", tone: "late-night drive" },
  { label: "Indie Rock", query: "indie rock essentials playlist", category: "featured", tone: "guitars and hooks" },
  { label: "Garage Bands", query: "garage rock playlist", category: "featured", tone: "raw and loud" },
  { label: "Happy Days", query: "happy songs playlist", category: "featured", tone: "bright lift" },
  { label: "Sunset Soul", query: "neo soul playlist", category: "featured", tone: "warm and smooth" },
  { label: "Dream Pop", query: "dream pop playlist", category: "featured", tone: "shimmer and float" },
  { label: "Bossa Nights", query: "bossa nova playlist", category: "featured", tone: "soft-lit sway" },
  { label: "Roadhouse Country", query: "outlaw country playlist", category: "genre", tone: "dust and grit" },
  { label: "Dream Pop", query: "dream pop playlist", category: "genre", tone: "hazy shimmer" },
  { label: "Afrobeats", query: "afrobeats playlist", category: "genre", tone: "dance-forward" },
  { label: "Shoegaze", query: "shoegaze essentials playlist", category: "genre", tone: "wall of sound" },
  { label: "Jazz Fusion", query: "jazz fusion playlist", category: "genre", tone: "technical groove" },
  { label: "City Pop", query: "city pop playlist", category: "genre", tone: "night skyline" },
  { label: "Post-Punk Wire", query: "post punk playlist", category: "genre", tone: "tense and angular" },
  { label: "Afro House", query: "afro house playlist", category: "genre", tone: "percussive elevation" },
  { label: "Happy Days", query: "feel good songs playlist", category: "mood", tone: "easy serotonin" },
  { label: "Heartbreak Hours", query: "heartbreak playlist", category: "mood", tone: "melancholy pull" },
  { label: "Focus Mode", query: "focus playlist", category: "mood", tone: "locked in" },
  { label: "After Hours", query: "after hours playlist", category: "mood", tone: "dim neon" },
  { label: "Velvet Weather", query: "smooth soul chill playlist", category: "mood", tone: "warm overcast glow" },
  { label: "Soft Landing", query: "soft acoustic chill playlist", category: "mood", tone: "gentle exhale" },
  { label: "Workout Heat", query: "workout playlist", category: "activity", tone: "high tempo" },
  { label: "Morning Coffee", query: "morning coffee playlist", category: "activity", tone: "gentle start" },
  { label: "Beach Drive", query: "summer drive playlist", category: "activity", tone: "windows down" },
  { label: "House Party", query: "house party playlist", category: "activity", tone: "crowd lift" },
  { label: "Window Seat", query: "travel chill playlist", category: "activity", tone: "airborne calm" },
  { label: "Moonlit Disco", query: "nu disco playlist", category: "activity", tone: "mirrorball pulse" },
  { label: "80s New Wave", query: "80s new wave playlist", category: "era", tone: "synth nostalgia" },
  { label: "90s R&B", query: "90s r&b playlist", category: "era", tone: "slow jams" },
  { label: "2000s Indie", query: "2000s indie playlist", category: "era", tone: "blog-era staples" },
  { label: "2010s Pop", query: "2010s pop playlist", category: "era", tone: "mainstream peaks" },
  { label: "2000s Emo", query: "2000s emo playlist", category: "era", tone: "cathartic guitars" },
  { label: "60s Soul", query: "60s soul essentials playlist", category: "era", tone: "timeless groove" },
];

// Maps our collection tabs to Spotify Browse category IDs.
// Categories can be verified at: GET /browse/categories
const COLLECTION_SPOTIFY_CATEGORIES: Record<string, string[]> = {
  featured: [], // uses getFeaturedPlaylists instead
  mood:     ["mood", "chill", "sleep"],
  genre:    ["pop", "rock", "hiphop", "indie_alt", "electronic", "rnb", "jazz", "country"],
  activity: ["workout", "focus", "party"],
  era:      ["decades"],
};

async function fetchSpotifyCollectionPlaylists(
  collection: string
): Promise<SpotifyPlaylistSummary[]> {
  if (collection === "featured") {
    return getFeaturedPlaylists(40).catch(() => []);
  }
  const categoryIds = COLLECTION_SPOTIFY_CATEGORIES[collection] || [];
  if (!categoryIds.length) return [];

  const batches = await Promise.allSettled(
    categoryIds.map((id) => getCategoryPlaylists(id, 30))
  );
  const seen = new Set<string>();
  return batches
    .flatMap((r) => (r.status === "fulfilled" ? r.value : []))
    .filter((p) => {
      if (seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    });
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const collection = (searchParams.get("collection") || "featured").toLowerCase();
  const availableCollections = ["featured", "genre", "mood", "activity", "era"];

  try {
    // Try Spotify Browse API first — real editorial playlists with full track counts
    const spotifyPlaylists = await fetchSpotifyCollectionPlaylists(collection).catch(() => []);

    if (spotifyPlaylists.length > 0) {
      const collections = spotifyPlaylists.map((playlist) => ({
        label: playlist.name,
        query: playlist.name,
        category: collection,
        tone: playlist.description || `${collection} vibes`,
        playlist: buildSpotifySourcedPlaylist(playlist, collection),
      }));
      return NextResponse.json({ collection, collections, availableCollections, source: "spotify" });
    }

    // Fallback: preset-based virtual playlists (no Spotify creds or API error)
    const filtered = collection === "all"
      ? PRESETS
      : PRESETS.filter((preset) => preset.category === collection);

    const results = await Promise.all(
      filtered.map(async (preset) => {
        try {
          const rankingEntry = buildResolverEntry({
            title: preset.label,
            subtitle: preset.tone,
            category:
              preset.category === "activity" || preset.category === "featured"
                ? "vibe"
                : preset.category,
            searchQuery: preset.query,
            tags: [preset.label.toLowerCase(), preset.tone.toLowerCase()],
            preferredTerms: [preset.label, preset.tone, preset.query],
            minTracks: DEFAULT_MIN_CURATED_TRACKS,
            idealTrackRange: [40, 100],
          });
          const { selected } = await resolveCuratedPlaylist(rankingEntry, {
            minimumTracks: DEFAULT_MIN_CURATED_TRACKS,
          });
          return {
            ...preset,
            playlist: buildVirtualCuratedPlaylist({
              title: preset.label,
              description: preset.tone,
              category: rankingEntry.category,
              query: preset.query,
              coverUrl: selected?.coverUrl || null,
              trackCount: selected?.trackCount ?? null,
            }),
          };
        } catch {
          return {
            ...preset,
            playlist: buildVirtualCuratedPlaylist({
              title: preset.label,
              description: preset.tone,
              category:
                preset.category === "activity" || preset.category === "featured"
                  ? "vibe"
                  : preset.category,
              query: preset.query,
            }),
          };
        }
      })
    );

    return NextResponse.json({ collection, collections: results, availableCollections });
  } catch (error) {
    console.error("Failed to load curated collections:", error);
    return NextResponse.json({ collection, collections: [], availableCollections });
  }
}
