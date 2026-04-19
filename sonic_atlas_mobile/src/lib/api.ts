import Constants from "expo-constants";

import { getGenreColor } from "@/lib/genre-color";

const configuredBaseUrl =
  Constants.expoConfig?.extra?.apiBaseUrl ??
  process.env.EXPO_PUBLIC_API_BASE_URL ??
  "https://sonic-atlas.vercel.app";

const API_BASE_URL = configuredBaseUrl.replace(/\/$/, "");

export function getApiBaseUrl() {
  return API_BASE_URL;
}

export function getStreamUrl(videoId: string) {
  return `${API_BASE_URL}/api/stream/${encodeURIComponent(videoId)}`;
}

type RequestOptions = RequestInit & {
  token?: string | null;
};

async function requestJson<T>(path: string, options?: RequestOptions): Promise<T> {
  const headers = new Headers(options?.headers);

  if (options?.token) {
    headers.set("Authorization", `Bearer ${options.token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let message = `Request failed: ${response.status} ${path}`;

    try {
      const data = (await response.json()) as { error?: string };
      if (data.error) {
        message = data.error;
      }
    } catch {
      // Ignore non-JSON responses and keep the HTTP fallback message.
    }

    throw new Error(message);
  }

  return (await response.json()) as T;
}

type CollectionResponse = {
  availableCollections?: string[];
  collections?: Array<{
    category?: string;
    label?: string;
    playlist?: {
      category?: string;
      description?: string;
      id?: string;
      title?: string;
    };
    tone?: string;
  }>;
  hasMore?: boolean;
  total?: number;
};

type GenreResponse = {
  genres: Array<{
    count?: number;
    name: string;
  }>;
};

type GenreArtistsResponse = {
  artists?: Array<{
    image?: string | null;
    name: string;
  }>;
  tag?: string;
};

type FeedResponse = {
  scans?: Array<{
    artistName: string;
    createdAt: string;
    id: string;
  }>;
};

type AutocompleteResponse = Array<{
  name: string;
  type: "artist" | "genre";
}>;

type CatalogResponse = {
  catalog?: Array<{
    entry: {
      category: string;
      slug: string;
      subtitle?: string;
      title: string;
    };
    playlist: {
      id?: string;
    } | null;
  }>;
};

type ArtistInfoResponse = {
  bio: string;
  genres: string[];
  image: string | null;
  listeners: number;
  location?: string | null;
  name: string;
  nbAlbums: number;
  nbFans: number;
  yearStarted?: string | null;
};

type ArtistPreviewResponse = {
  artist?: {
    name: string;
    picture: string | null;
  };
  tracks?: Array<{
    duration: number;
    id: number;
    preview: string;
    title: string;
    videoId?: string | null;
  }>;
};

type SimilarArtistsResponse = {
  similar?: Array<{
    genres: string[];
    image: string | null;
    match: number;
    name: string;
  }>;
};

type PlaylistDetailResponse = {
  category: string;
  coverUrl: string | null;
  description: string;
  id: string;
  source: string;
  title: string;
  tracks?: Array<{
    artist: string;
    coverUrl: string | null;
    title: string;
    videoId: string;
  }>;
};

type ArtistEventsResponse = {
  eventCount: number;
  hasEvents: boolean;
  nextEvent?: {
    city: string;
    date: string;
    name: string;
    url: string;
    venue: string;
  };
};

type ArtistDiscographyResponse = {
  albums?: Array<{
    cover?: string | null;
    id?: number | string;
    release_date?: string;
    title: string;
  }>;
  artistImage?: string | null;
  topTracks?: Array<{
    duration?: number;
    id?: number;
    preview?: string;
    title: string;
    videoId?: string | null;
  }>;
};

type ArtistSearchResponse = {
  results?: Array<{
    id?: string;
    name: string;
  }>;
};

type PlaylistSearchResponse = {
  playlists?: Array<{
    category?: string;
    coverUrl?: string | null;
    description?: string | null;
    id: string;
    source?: string;
    title: string;
    trackCount?: number | null;
  }>;
    query?: string;
};

type MobileAuthResponse = {
  accessToken: string;
  expiresIn: string;
  refreshToken: string;
  user: {
    email: string | null;
    id: string;
    name: string | null;
  };
};

type BookmarkResponse = Array<{
  artistId: string;
  createdAt: string;
  genres: string;
  id: string;
  imageUrl?: string | null;
  name: string;
}>;

type PlaylistResponse = Array<{
  _count?: {
    tracks?: number;
  };
  coverUrl?: string | null;
  createdAt: string;
  description?: string | null;
  id: string;
  name: string;
  updatedAt: string;
}>;

export type MobileCollectionItem = {
  accent: string;
  description: string;
  id: string;
  kind: string;
  title: string;
};

export type MobileCollectionResponse = {
  availableCollections: string[];
  hasMore: boolean;
  items: MobileCollectionItem[];
  total: number;
};

export type MobileGenre = {
  color: string;
  count: number;
  name: string;
};

export type MobileGenreArtist = {
  imageUrl: string | null;
  name: string;
};

export type MobileFeedEntry = {
  artistName: string;
  genres: string[];
  timeAgo: string;
  timestamp: string;
};

export type MobileAutocompleteItem = {
  name: string;
  subtitle: string;
  type: "artist" | "genre";
};

export type MobileCatalogItem = {
  accent: string;
  category: string;
  description: string;
  id: string;
  title: string;
};

export type MobileArtistInfo = ArtistInfoResponse;

export type MobilePreviewTrack = {
  artist: string;
  artwork: string | null;
  duration: number;
  previewUrl: string;
  title: string;
  videoId?: string | null;
};

export type MobileSimilarArtist = {
  genres: string[];
  image: string | null;
  match: number;
  name: string;
};

export type MobilePlaylistDetail = {
  category: string;
  coverUrl: string | null;
  description: string;
  id: string;
  source: string;
  title: string;
  tracks: MobilePreviewTrack[];
};

export type MobileArtistEvents = ArtistEventsResponse;

export type MobileArtistAlbum = {
  coverUrl: string | null;
  id: string;
  releaseDate: string | null;
  title: string;
};

export type MobileArtistDiscography = {
  albums: MobileArtistAlbum[];
  artistImage: string | null;
  topTracks: MobilePreviewTrack[];
};

export type MobileArtistSearchItem = {
  id: string;
  name: string;
  subtitle: string;
  type: "artist";
};

export type MobilePlaylistSearchItem = {
  category: string;
  coverUrl: string | null;
  description: string;
  id: string;
  source: string;
  title: string;
  trackCount: number | null;
};

export type MobileAuthSession = MobileAuthResponse;

export type MobileBookmark = {
  artistId: string;
  createdAt: string;
  genres: string[];
  id: string;
  imageUrl: string | null;
  name: string;
};

export type MobileUserPlaylist = {
  coverUrl: string | null;
  createdAt: string;
  description: string | null;
  id: string;
  name: string;
  trackCount: number;
  updatedAt: string;
};

function formatTimeAgo(timestamp: string): string {
  const diffMs = Date.now() - new Date(timestamp).getTime();
  const diffMinutes = Math.max(1, Math.floor(diffMs / 60000));
  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }
  return `${Math.floor(diffHours / 24)}d ago`;
}

export async function fetchFeaturedCollections(collection: string): Promise<MobileCollectionItem[]> {
  const data = await fetchPlaylistCollections({ collection });

  return data.items;
}

export async function fetchPlaylistCollections(options: {
  collection?: string;
  limit?: number;
  query?: string;
}): Promise<MobileCollectionResponse> {
  const params = new URLSearchParams();
  params.set("collection", options.collection ?? "featured");
  if (options.limit) {
    params.set("limit", String(options.limit));
  }
  if (options.query?.trim()) {
    params.set("q", options.query.trim());
  }

  const data = await requestJson<CollectionResponse>(`/api/playlists/collections?${params.toString()}`);

  const items = (data.collections ?? []).map((item, index) => {
    const playlist = item.playlist;
    const title = playlist?.title ?? item.label ?? "Untitled collection";
    const description = playlist?.description ?? item.tone ?? "Curated Sonic Atlas lane";
    const kind = item.category ?? playlist?.category ?? "collection";

    return {
      accent: getGenreColor(title),
      description,
      id: playlist?.id ?? `${title}-${index}`,
      kind,
      title,
    };
  });

  return {
    availableCollections: data.availableCollections ?? ["featured", "genre", "mood", "activity", "era"],
    hasMore: data.hasMore ?? false,
    items,
    total: data.total ?? items.length,
  };
}

export async function fetchGenres(limit = 12): Promise<MobileGenre[]> {
  const data = await requestJson<GenreResponse>(`/api/genres?limit=${limit}`);

  return data.genres.map((genre) => ({
    color: getGenreColor(genre.name),
    count: genre.count ?? 0,
    name: genre.name,
  }));
}

export async function fetchGenreArtists(name: string, limit = 16): Promise<MobileGenreArtist[]> {
  const data = await requestJson<GenreArtistsResponse>(
    `/api/genre/${encodeURIComponent(name)}?limit=${limit}`
  );

  return (data.artists ?? []).map((artist) => ({
    imageUrl: artist.image ?? null,
    name: artist.name,
  }));
}

export async function fetchFeed(): Promise<MobileFeedEntry[]> {
  const data = await requestJson<FeedResponse>("/api/feed");

  return (data.scans ?? []).map((entry) => ({
    artistName: entry.artistName,
    genres: [],
    timeAgo: formatTimeAgo(entry.createdAt),
    timestamp: entry.createdAt,
  }));
}

export async function fetchAutocomplete(query: string): Promise<MobileAutocompleteItem[]> {
  const data = await requestJson<AutocompleteResponse>(
    `/api/search/autocomplete?q=${encodeURIComponent(query)}`
  );

  return data.map((item) => ({
    name: item.name,
    subtitle: item.type === "artist" ? "Artist match" : "Genre lane",
    type: item.type,
  }));
}

export async function fetchCatalog(limit = 10): Promise<MobileCatalogItem[]> {
  const data = await requestJson<CatalogResponse>(`/api/playlists/catalog?limit=${limit}`);

  return (data.catalog ?? []).map((item) => ({
    accent: getGenreColor(item.entry.title),
    category: item.entry.category ?? "catalog",
    description: item.entry.subtitle ?? "Curated catalog entry",
    id: item.playlist?.id ?? item.entry.slug,
    title: item.entry.title,
  }));
}

export async function fetchArtistInfo(name: string): Promise<MobileArtistInfo> {
  return requestJson<MobileArtistInfo>(`/api/artist/${encodeURIComponent(name)}/info`);
}

export async function fetchArtistPreview(name: string): Promise<MobilePreviewTrack[]> {
  const data = await requestJson<ArtistPreviewResponse>(`/api/artist/${encodeURIComponent(name)}/preview`);
  const artistName = data.artist?.name ?? name;
  const artwork = data.artist?.picture ?? null;

  return (data.tracks ?? []).map((track) => ({
    artist: artistName,
    artwork,
    duration: track.duration ?? 0,
    previewUrl: track.preview ?? "",
    title: track.title,
    videoId: track.videoId ?? null,
  }));
}

export async function fetchSimilarArtists(name: string, limit = 12): Promise<MobileSimilarArtist[]> {
  const data = await requestJson<SimilarArtistsResponse>(
    `/api/artist/${encodeURIComponent(name)}/similar?limit=${limit}&nicheDepth=60`
  );

  return data.similar ?? [];
}

export async function fetchArtistEvents(name: string): Promise<MobileArtistEvents> {
  return requestJson<MobileArtistEvents>(`/api/artist/${encodeURIComponent(name)}/events`);
}

export async function fetchArtistDiscography(name: string): Promise<MobileArtistDiscography> {
  const data = await requestJson<ArtistDiscographyResponse>(
    `/api/artist/${encodeURIComponent(name)}/discography`
  );

  return {
    albums: (data.albums ?? []).map((album, index) => ({
      coverUrl: album.cover ?? null,
      id: String(album.id ?? `${album.title}-${index}`),
      releaseDate: album.release_date ?? null,
      title: album.title,
    })),
    artistImage: data.artistImage ?? null,
    topTracks: (data.topTracks ?? []).map((track) => ({
      artist: name,
      artwork: data.artistImage ?? null,
      duration: track.duration ?? 0,
      previewUrl: track.preview ?? "",
      title: track.title,
      videoId: track.videoId ?? null,
    })),
  };
}

export async function searchArtists(query: string): Promise<MobileArtistSearchItem[]> {
  const data = await requestJson<ArtistSearchResponse>(`/api/search?q=${encodeURIComponent(query)}`);

  return (data.results ?? []).map((item, index) => ({
    id: item.id ?? `${item.name}-${index}`,
    name: item.name,
    subtitle: "Artist result",
    type: "artist",
  }));
}

export async function searchPlaylists(query: string): Promise<MobilePlaylistSearchItem[]> {
  const data = await requestJson<PlaylistSearchResponse>(
    `/api/playlists/search?q=${encodeURIComponent(query)}`
  );

  return (data.playlists ?? []).map((playlist) => ({
    category: playlist.category ?? "playlist",
    coverUrl: playlist.coverUrl ?? null,
    description: playlist.description ?? "Curated playlist result",
    id: playlist.id,
    source: playlist.source ?? "atlas",
    title: playlist.title,
    trackCount: playlist.trackCount ?? null,
  }));
}

export async function fetchPlaylistDetail(id: string): Promise<MobilePlaylistDetail> {
  const data = await requestJson<PlaylistDetailResponse>(`/api/playlists/curated/${encodeURIComponent(id)}/tracks`);

  return {
    category: data.category,
    coverUrl: data.coverUrl,
    description: data.description,
    id: data.id,
    source: data.source,
    title: data.title,
    tracks: (data.tracks ?? []).map((track) => ({
      artist: track.artist,
      artwork: track.coverUrl,
      duration: 0,
      previewUrl: "",
      title: track.title,
      videoId: track.videoId,
    })),
  };
}

export async function loginWithEmail(email: string, password: string): Promise<MobileAuthSession> {
  return requestJson<MobileAuthResponse>("/api/auth/token", {
    body: JSON.stringify({ email, password }),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  });
}

export async function refreshMobileSession(refreshToken: string): Promise<MobileAuthSession> {
  return requestJson<MobileAuthResponse>("/api/auth/token", {
    body: JSON.stringify({ refreshToken }),
    headers: {
      "Content-Type": "application/json",
    },
    method: "PUT",
  });
}

export async function fetchMyBookmarks(token: string): Promise<MobileBookmark[]> {
  const data = await requestJson<BookmarkResponse>("/api/bookmarks", { token });

  return data.map((bookmark) => ({
    artistId: bookmark.artistId,
    createdAt: bookmark.createdAt,
    genres: JSON.parse(bookmark.genres || "[]") as string[],
    id: bookmark.id,
    imageUrl: bookmark.imageUrl ?? null,
    name: bookmark.name,
  }));
}

export async function createBookmark(
  token: string,
  input: {
    artistId: string;
    genres: string[];
    imageUrl?: string | null;
    name: string;
  }
): Promise<MobileBookmark> {
  const bookmark = await requestJson<{
    artistId: string;
    createdAt: string;
    genres: string;
    id: string;
    imageUrl?: string | null;
    name: string;
  }>("/api/bookmarks", {
    body: JSON.stringify(input),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
    token,
  });

  return {
    artistId: bookmark.artistId,
    createdAt: bookmark.createdAt,
    genres: JSON.parse(bookmark.genres || "[]") as string[],
    id: bookmark.id,
    imageUrl: bookmark.imageUrl ?? null,
    name: bookmark.name,
  };
}

export async function deleteBookmark(token: string, artistId: string) {
  return requestJson<{ success: boolean }>(`/api/bookmarks?artistId=${encodeURIComponent(artistId)}`, {
    method: "DELETE",
    token,
  });
}

export async function fetchMyPlaylists(token: string): Promise<MobileUserPlaylist[]> {
  const data = await requestJson<PlaylistResponse>("/api/playlists", { token });

  return data.map((playlist) => ({
    coverUrl: playlist.coverUrl ?? null,
    createdAt: playlist.createdAt,
    description: playlist.description ?? null,
    id: playlist.id,
    name: playlist.name,
    trackCount: playlist._count?.tracks ?? 0,
    updatedAt: playlist.updatedAt,
  }));
}

export async function createUserPlaylist(
  token: string,
  input: {
    description?: string;
    name: string;
  }
): Promise<MobileUserPlaylist> {
  const playlist = await requestJson<{
    coverUrl?: string | null;
    createdAt: string;
    description?: string | null;
    id: string;
    name: string;
    updatedAt: string;
  }>("/api/playlists", {
    body: JSON.stringify(input),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
    token,
  });

  return {
    coverUrl: playlist.coverUrl ?? null,
    createdAt: playlist.createdAt,
    description: playlist.description ?? null,
    id: playlist.id,
    name: playlist.name,
    trackCount: 0,
    updatedAt: playlist.updatedAt,
  };
}

export async function addTrackToUserPlaylist(
  token: string,
  playlistId: string,
  track: {
    artist: string;
    artwork?: string | null;
    genres?: string[];
    previewUrl?: string;
    title: string;
    videoId?: string | null;
  }
) {
  return requestJson<{
    artist: string;
    id: string;
    playlistId: string;
    position: number;
    title: string;
  }>(`/api/playlists/${encodeURIComponent(playlistId)}/tracks`, {
    body: JSON.stringify({
      artist: track.artist,
      coverUrl: track.artwork ?? null,
      genres: track.genres ?? [],
      title: track.title,
      url: track.previewUrl ?? "",
      videoId: track.videoId ?? null,
    }),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
    token,
  });
}
