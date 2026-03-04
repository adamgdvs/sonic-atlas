// Client-side API helpers

export interface SearchResult {
  id: string;
  name: string;
  disambiguation?: string;
  score: number;
  tags?: { name: string; count: number }[];
}

export interface SimilarArtistResult {
  name: string;
  mbid: string;
  match: number;
  url: string;
  image: string | null;
  genres: string[];
}

export interface PreviewTrack {
  id: number;
  title: string;
  preview: string;
  duration: number;
}

export interface ArtistInfo {
  name: string;
  image: string | null;
  listeners: number;
  playcount: number;
  bio: string;
  genres: string[];
  deezerId: number | null;
  nbAlbums: number;
  nbFans: number;
  location?: string | null;
  yearStarted?: string | null;
}

export interface Album {
  id: number;
  title: string;
  cover_medium: string;
  cover_big: string;
  release_date: string;
  nb_tracks: number;
  type: string;
}

export interface Discography {
  albums: Album[];
  topTracks: PreviewTrack[];
  artistImage: string | null;
}

export async function searchArtists(query: string): Promise<SearchResult[]> {
  if (query.length < 2) return [];
  const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.results || [];
}

export interface AutocompleteResult {
  type: 'artist' | 'genre';
  name: string;
}

export async function getAutocompleteSuggestions(query: string): Promise<AutocompleteResult[]> {
  if (query.length < 2) return [];
  const res = await fetch(`/api/search/autocomplete?q=${encodeURIComponent(query)}`);
  if (!res.ok) return [];
  return res.json();
}

export async function getSimilarArtists(
  artistName: string,
  limit = 30,
  nicheDepth = 60
): Promise<SimilarArtistResult[]> {
  const res = await fetch(
    `/api/artist/${encodeURIComponent(artistName)}/similar?limit=${limit}&nicheDepth=${nicheDepth}`
  );
  if (!res.ok) return [];
  const data = await res.json();
  return data.similar || [];
}

export async function getPreviewTracks(
  artistName: string
): Promise<PreviewTrack[]> {
  const res = await fetch(
    `/api/artist/${encodeURIComponent(artistName)}/preview`
  );
  if (!res.ok) return [];
  const data = await res.json();
  return data.tracks || [];
}

export interface ArtistPreviewData {
  tracks: PreviewTrack[];
  image: string | null;
}

export async function getArtistPreviewData(
  artistName: string
): Promise<ArtistPreviewData> {
  const res = await fetch(
    `/api/artist/${encodeURIComponent(artistName)}/preview`
  );
  if (!res.ok) return { tracks: [], image: null };
  const data = await res.json();
  return {
    tracks: data.tracks || [],
    image: data.artist?.picture || null,
  };
}

export async function getArtistInfo(
  artistName: string
): Promise<ArtistInfo | null> {
  const res = await fetch(
    `/api/artist/${encodeURIComponent(artistName)}/info`
  );
  if (!res.ok) return null;
  return res.json();
}

export async function getDiscography(
  artistName: string
): Promise<Discography | null> {
  const res = await fetch(
    `/api/artist/${encodeURIComponent(artistName)}/discography`
  );
  if (!res.ok) return null;
  return res.json();
}

// ─── Genre endpoints ─────────────────────────────────────────────

export interface GenreInfo {
  name: string;
  count: number;
  isAuthoritative?: boolean;
}

export interface GenreArtist {
  name: string;
  mbid: string;
  url: string;
  image: string | null;
}

export interface AlbumTrack {
  id: number;
  title: string;
  preview: string;
  duration: number;
  track_position: number;
}

export async function getTopGenres(
  limit = 7500
): Promise<GenreInfo[]> {
  const res = await fetch(`/api/genres?limit=${limit}`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.genres || [];
}

export async function getGenreArtists(
  genre: string,
  limit = 200
): Promise<GenreArtist[]> {
  const res = await fetch(
    `/api/genre/${encodeURIComponent(genre)}?limit=${limit}`
  );
  if (!res.ok) return [];
  const data = await res.json();
  return data.artists || [];
}

export async function getSimilarGenres(
  genre: string
): Promise<{ name: string }[]> {
  const res = await fetch(
    `/api/genre/${encodeURIComponent(genre)}/similar`
  );
  if (!res.ok) return [];
  const data = await res.json();
  return data.similar || [];
}

export async function getAlbumTracks(
  albumId: number
): Promise<AlbumTrack[]> {
  const res = await fetch(`/api/album/${albumId}/tracks`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.tracks || [];
}

// ─── Tag endpoints ─────────────────────────────────────────────

export interface TagArtistResult {
  name: string;
  mbid: string;
  url: string;
  image: string | null;
  match: number; // Reusing this property for sorting/display consistency with SimilarCard
}

export async function getTopTagArtists(
  tag: string,
  limit = 50
): Promise<TagArtistResult[]> {
  const res = await fetch(
    `/api/tag/${encodeURIComponent(tag)}/artists?limit=${limit}`
  );
  if (!res.ok) return [];
  const data = await res.json();
  return data.artists || [];
}
