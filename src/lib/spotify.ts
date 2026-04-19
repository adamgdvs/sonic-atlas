import { dbCache } from "@/lib/dbCache";

const SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token";
const SPOTIFY_API_BASE = "https://api.spotify.com/v1";
const TOKEN_SKEW_MS = 30 * 1000;
const DAY = 24 * 60 * 60 * 1000;

export interface SpotifyAudioFeatures {
  id: string;
  danceability: number;
  energy: number;
  valence: number;
  acousticness: number;
  instrumentalness: number;
  speechiness: number;
  liveness: number;
  tempo: number;
}

export interface SpotifyMatchedTrack {
  id: string;
  name: string;
  artistName: string;
  externalUrl: string | null;
  previewUrl: string | null;
}

let cachedToken: { accessToken: string; expiresAt: number } | null = null;

function getCredentials() {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;
  return { clientId, clientSecret };
}

function normalize(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function overlapScore(left: string, right: string) {
  const leftTokens = new Set(normalize(left).split(" ").filter(Boolean));
  const rightTokens = normalize(right).split(" ").filter(Boolean);
  if (leftTokens.size === 0 || rightTokens.length === 0) return 0;
  return rightTokens.reduce((score, token) => score + (leftTokens.has(token) ? 1 : 0), 0);
}

async function getAccessToken() {
  const credentials = getCredentials();
  if (!credentials) return null;

  if (cachedToken && cachedToken.expiresAt > Date.now() + TOKEN_SKEW_MS) {
    return cachedToken.accessToken;
  }

  const basic = Buffer.from(
    `${credentials.clientId}:${credentials.clientSecret}`,
    "utf8"
  ).toString("base64");

  const response = await fetch(SPOTIFY_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ grant_type: "client_credentials" }).toString(),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Spotify token request failed: ${response.status}`);
  }

  const data = (await response.json()) as {
    access_token?: string;
    expires_in?: number;
  };

  if (!data.access_token) {
    throw new Error("Spotify token response missing access_token");
  }

  cachedToken = {
    accessToken: data.access_token,
    expiresAt: Date.now() + (data.expires_in || 3600) * 1000,
  };

  return cachedToken.accessToken;
}

async function spotifyFetch<T>(path: string) {
  const token = await getAccessToken();
  if (!token) return null;

  const response = await fetch(`${SPOTIFY_API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate: 3600 },
  });

  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`Spotify API request failed: ${response.status}`);
  }

  return (await response.json()) as T;
}

export async function matchSpotifyTrack(
  title: string,
  artist: string
): Promise<SpotifyMatchedTrack | null> {
  const credentials = getCredentials();
  if (!credentials) return null;

  const cacheKey = `spotify:match:${normalize(artist)}::${normalize(title)}`;
  return dbCache<SpotifyMatchedTrack | null>(cacheKey, 30 * DAY, async () => {
    const query = encodeURIComponent(`track:${title} artist:${artist}`);
    const data = await spotifyFetch<{
      tracks?: {
        items?: Array<{
          id: string;
          name: string;
          preview_url: string | null;
          external_urls?: { spotify?: string };
          artists?: Array<{ name: string }>;
        }>;
      };
    }>(`/search?q=${query}&type=track&limit=5`);

    const items = data?.tracks?.items || [];
    if (!items.length) return null;

    let best: SpotifyMatchedTrack | null = null;
    let bestScore = -Infinity;

    for (const item of items) {
      const artistName = item.artists?.[0]?.name || "";
      let score = 0;
      score += overlapScore(item.name, title) * 2.5;
      score += overlapScore(artistName, artist) * 3;
      if (normalize(item.name) === normalize(title)) score += 5;
      if (normalize(artistName) === normalize(artist)) score += 6;

      if (score > bestScore) {
        bestScore = score;
        best = {
          id: item.id,
          name: item.name,
          artistName,
          externalUrl: item.external_urls?.spotify || null,
          previewUrl: item.preview_url,
        };
      }
    }

    return bestScore >= 6 ? best : null;
  });
}

export async function getSpotifyAudioFeatures(
  trackId: string
): Promise<SpotifyAudioFeatures | null> {
  const credentials = getCredentials();
  if (!credentials) return null;

  return dbCache<SpotifyAudioFeatures | null>(`spotify:audio:${trackId}`, 30 * DAY, async () => {
    const data = await spotifyFetch<SpotifyAudioFeatures>(`/audio-features/${trackId}`);
    return data || null;
  });
}

export async function matchSpotifyTrackWithFeatures(title: string, artist: string) {
  const match = await matchSpotifyTrack(title, artist);
  if (!match) return null;
  const features = await getSpotifyAudioFeatures(match.id);
  if (!features) return null;
  return { match, features };
}

// ─── Playlist sourcing ────────────────────────────────────────────────────────

type SpotifyPlaylistItem = {
  id: string;
  name: string;
  description: string | null;
  images?: Array<{ url: string }>;
  tracks?: { total: number };
  owner?: { display_name: string };
} | null;

function mapPlaylistItem(item: SpotifyPlaylistItem): SpotifyPlaylistSummary | null {
  if (!item?.id || !item.name) return null;
  return {
    id: item.id,
    name: item.name,
    description: item.description || "",
    coverUrl: item.images?.[0]?.url || null,
    trackCount: item.tracks?.total ?? null,
    owner: item.owner?.display_name || "",
  };
}

export interface SpotifyPlaylistSummary {
  id: string;
  name: string;
  description: string;
  coverUrl: string | null;
  trackCount: number | null;
  owner: string;
}

export interface SpotifyPlaylistTrack {
  title: string;
  artist: string;
  spotifyId: string;
}

export async function searchSpotifyPlaylists(
  query: string,
  limit = 10
): Promise<SpotifyPlaylistSummary[]> {
  if (!getCredentials()) return [];

  return dbCache<SpotifyPlaylistSummary[]>(
    `spotify:plsearch:${normalize(query)}`,
    DAY,
    async () => {
      const q = encodeURIComponent(query);
      const data = await spotifyFetch<{
        playlists?: { items?: SpotifyPlaylistItem[] };
      }>(`/search?q=${q}&type=playlist&limit=${limit}`);
      return (data?.playlists?.items || [])
        .map(mapPlaylistItem)
        .filter((item): item is SpotifyPlaylistSummary => item !== null);
    }
  );
}

// Spotify deprecated /browse/categories and /browse/featured-playlists (2024).
// These replacements use /search?type=playlist which is still supported.

const CATEGORY_SEARCH_QUERIES: Record<string, string[]> = {
  mood:      ["mood booster playlist", "feel good playlist", "happy vibes playlist"],
  chill:     ["chill vibes playlist", "lofi chill playlist", "relaxing music playlist"],
  sleep:     ["sleep music playlist", "calm sleep playlist", "peaceful sleep playlist"],
  focus:     ["focus study playlist", "deep focus music", "concentration playlist"],
  workout:   ["workout playlist", "gym music playlist", "high energy workout"],
  party:     ["party hits playlist", "dance party playlist", "club hits playlist"],
  pop:       ["pop hits playlist", "top pop songs", "popular music playlist"],
  rock:      ["rock classics playlist", "rock hits", "best rock songs playlist"],
  hiphop:    ["hip hop playlist", "rap hits playlist", "best rap songs"],
  indie_alt: ["indie playlist", "indie rock playlist", "alternative playlist"],
  electronic:["electronic playlist", "edm playlist", "dance music playlist"],
  rnb:       ["r&b playlist", "soul r&b playlist", "best r&b songs"],
  jazz:      ["jazz playlist", "smooth jazz playlist", "jazz classics"],
  country:   ["country playlist", "country hits", "best country songs"],
  decades:   ["80s hits playlist", "90s playlist", "2000s hits", "70s classic rock"],
};

const FEATURED_SEARCH_QUERIES = [
  "today's top hits playlist",
  "viral hits playlist",
  "new music friday playlist",
  "trending songs playlist",
  "global top songs playlist",
  "hot hits playlist",
];

async function searchPlaylistBatch(
  queries: string[],
  perQuery: number
): Promise<SpotifyPlaylistSummary[]> {
  const results = await Promise.allSettled(
    queries.map((q) => searchSpotifyPlaylists(q, perQuery))
  );
  const seen = new Set<string>();
  return results
    .flatMap((r) => (r.status === "fulfilled" ? r.value : []))
    .filter((p) => {
      if (seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    });
}

export async function getCategoryPlaylists(
  categoryId: string,
  limit = 20
): Promise<SpotifyPlaylistSummary[]> {
  if (!getCredentials()) return [];
  const queries = CATEGORY_SEARCH_QUERIES[categoryId] || [`${categoryId} playlist`];
  const perQuery = Math.ceil(limit / queries.length) + 2;
  const results = await searchPlaylistBatch(queries, perQuery);
  return results.slice(0, limit);
}

export async function getFeaturedPlaylists(
  limit = 24
): Promise<SpotifyPlaylistSummary[]> {
  if (!getCredentials()) return [];
  const perQuery = Math.ceil(limit / FEATURED_SEARCH_QUERIES.length) + 2;
  const results = await searchPlaylistBatch(FEATURED_SEARCH_QUERIES, perQuery);
  return results.slice(0, limit);
}

export async function getSpotifyPlaylistTracks(
  playlistId: string,
  limit = 100
): Promise<SpotifyPlaylistTrack[]> {
  if (!getCredentials()) return [];

  return dbCache<SpotifyPlaylistTrack[]>(
    `spotify:pltracks:${playlistId}`,
    DAY,
    async () => {
      const tracks: SpotifyPlaylistTrack[] = [];
      let nextPath: string | null =
        `/playlists/${playlistId}/tracks?limit=50&fields=next,items(track(id,name,artists(name)))`;

      type TrackPage = {
        next: string | null;
        items?: Array<{
          track: {
            id: string;
            name: string;
            artists: Array<{ name: string }>;
          } | null;
        }>;
      };

      while (nextPath && tracks.length < limit) {
        const data: TrackPage | null = await spotifyFetch<TrackPage>(nextPath);

        if (!data) break;

        for (const item of data.items || []) {
          const track = item.track;
          if (!track?.id || !track.name) continue;
          tracks.push({
            title: track.name,
            artist: track.artists?.[0]?.name || "Unknown Artist",
            spotifyId: track.id,
          });
          if (tracks.length >= limit) break;
        }

        nextPath = data.next ? data.next.replace(SPOTIFY_API_BASE, "") : null;
      }

      return tracks;
    }
  );
}
