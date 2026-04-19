import { dbCache } from "@/lib/dbCache";

const BASE_URL = "https://api.deezer.com";
const DAY = 24 * 60 * 60 * 1000;

export interface DeezerArtist {
  id: number;
  name: string;
  picture_medium: string | null;
  picture_big: string | null;
  nb_album: number;
  nb_fan: number;
}

export interface DeezerTrack {
  id: number;
  title: string;
  preview: string;
  duration: number;
  artist: { id: number; name: string; picture_medium: string };
}

export interface DeezerAlbum {
  id: number;
  title: string;
  cover_medium: string;
  cover_big: string;
  release_date: string;
  nb_tracks: number;
  type: string;
}

export async function searchArtist(
  query: string
): Promise<DeezerArtist | null> {
  const url = `${BASE_URL}/search/artist?q=${encodeURIComponent(query)}&limit=1`;
  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) return null;

  const data = await res.json();
  const artist = data.data?.[0];
  if (!artist) return null;

  return {
    id: artist.id,
    name: artist.name,
    picture_medium: artist.picture_medium || null,
    picture_big: artist.picture_big || null,
    nb_album: artist.nb_album || 0,
    nb_fan: artist.nb_fan || 0,
  };
}

export async function getArtistImage(
  artistName: string
): Promise<string | null> {
  const artist = await searchArtist(artistName);
  return artist?.picture_medium || null;
}

export async function getArtistDetails(
  deezerArtistId: number
): Promise<DeezerArtist | null> {
  const url = `${BASE_URL}/artist/${deezerArtistId}`;
  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) return null;

  const a = await res.json();
  return {
    id: a.id,
    name: a.name,
    picture_medium: a.picture_medium || null,
    picture_big: a.picture_big || null,
    nb_album: a.nb_album || 0,
    nb_fan: a.nb_fan || 0,
  };
}

export async function getTopTracks(
  deezerArtistId: number,
  limit = 5
): Promise<DeezerTrack[]> {
  const url = `${BASE_URL}/artist/${deezerArtistId}/top?limit=${limit}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return [];

  const data = await res.json();
  return (data.data || []).map(
    (t: { id: number; title: string; preview: string; duration: number; artist: { id: number; name: string; picture_medium?: string } }) => ({
      id: t.id,
      title: t.title,
      preview: t.preview,
      duration: t.duration,
      artist: {
        id: t.artist.id,
        name: t.artist.name,
        picture_medium: t.artist.picture_medium || null,
      },
    })
  );
}

export async function getAlbumDetail(
  albumId: number
): Promise<DeezerAlbum | null> {
  const url = `${BASE_URL}/album/${albumId}`;
  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) return null;

  const a = await res.json();
  return {
    id: a.id,
    title: a.title,
    cover_medium: a.cover_medium || "",
    cover_big: a.cover_big || "",
    release_date: a.release_date || "",
    nb_tracks: a.nb_tracks || 0,
    type: a.record_type || "album",
  };
}

export async function getAlbums(
  deezerArtistId: number,
  limit = 20
): Promise<DeezerAlbum[]> {
  const url = `${BASE_URL}/artist/${deezerArtistId}/albums?limit=${limit}`;
  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) return [];

  const data = await res.json();
  // Use list data directly — no need for individual album detail calls
  return (data.data || [])
    .filter((a: { record_type: string }) => a.record_type === "album")
    .map((a: { id: number; title: string; cover_medium?: string; cover_big?: string; release_date?: string; nb_tracks?: number; record_type?: string }) => ({
      id: a.id,
      title: a.title,
      cover_medium: a.cover_medium || "",
      cover_big: a.cover_big || a.cover_medium || "",
      release_date: a.release_date || "",
      nb_tracks: a.nb_tracks || 0,
      type: a.record_type || "album",
    }));
}

// ─── Playlist search & fetch ──────────────────────────────────────────────────

export interface DeezerPlaylistSummary {
  id: number;
  title: string;
  description: string;
  coverUrl: string | null;
  trackCount: number;
  creator: string;
}

export interface DeezerPlaylistTrack {
  id: number;
  title: string;
  artist: string;
  album: string;
  duration: number | null;
  explicit: boolean;
  preview: string | null;
  deezerUrl: string | null;
  coverUrl: string | null;
  isrc: string | null;
}

export interface DeezerPlaylistWithTracks extends DeezerPlaylistSummary {
  tracks: DeezerPlaylistTrack[];
}

function isErrorResponse(data: unknown): boolean {
  if (typeof data !== "object" || !data) return false;
  return typeof (data as Record<string, unknown>).error === "object";
}

function pStr(v: unknown): string {
  return typeof v === "string" && v ? v : "";
}

function pNum(v: unknown): number | null {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
}

async function deezerPlaylistFetch<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${BASE_URL}${path}`, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const data = (await res.json()) as unknown;
    if (isErrorResponse(data)) return null;
    return data as T;
  } catch {
    return null;
  }
}

function mapDeezerPlaylist(raw: unknown): DeezerPlaylistSummary | null {
  if (typeof raw !== "object" || !raw) return null;
  const r = raw as Record<string, unknown>;
  const id = pNum(r.id);
  const title = pStr(r.title);
  if (!id || !title) return null;
  const user = r.user as Record<string, unknown> | undefined;
  return {
    id,
    title,
    description: pStr(r.description),
    coverUrl: pStr(r.picture_xl) || pStr(r.picture_big) || pStr(r.picture_medium) || null,
    trackCount: Number(r.nb_tracks) || 0,
    creator: pStr(user?.name) || "Deezer",
  };
}

function mapDeezerPlaylistTrack(raw: unknown): DeezerPlaylistTrack | null {
  if (typeof raw !== "object" || !raw) return null;
  const r = raw as Record<string, unknown>;
  const id = pNum(r.id);
  const title = pStr(r.title);
  if (!id || !title) return null;
  const artist = r.artist as Record<string, unknown> | undefined;
  const album = r.album as Record<string, unknown> | undefined;
  return {
    id,
    title,
    artist: pStr(artist?.name) || "Unknown",
    album: pStr(album?.title),
    duration: r.duration ? Number(r.duration) : null,
    explicit: Boolean(r.explicit_lyrics),
    preview: pStr(r.preview) || null,
    deezerUrl: pStr(r.link) || null,
    coverUrl: album ? (pStr(album.cover_xl) || pStr(album.cover_big) || null) : null,
    isrc: pStr(r.isrc) || null,
  };
}

export async function searchDeezerPlaylists(
  query: string,
  limit = 50
): Promise<DeezerPlaylistSummary[]> {
  const key = `deezer:plsearch:${query.toLowerCase().trim()}:${limit}`;
  return dbCache<DeezerPlaylistSummary[]>(key, DAY, async () => {
    const results: DeezerPlaylistSummary[] = [];
    const pageSize = 50; // Deezer supports up to 100 but 50 is reliable
    let index = 0;

    while (results.length < limit) {
      const fetch_limit = Math.min(pageSize, limit - results.length);
      const data = await deezerPlaylistFetch<{
        data?: unknown[];
        total?: number;
        next?: string;
      }>(`/search/playlist?q=${encodeURIComponent(query)}&limit=${fetch_limit}&index=${index}`);

      if (!Array.isArray(data?.data) || data.data.length === 0) break;

      for (const item of data.data) {
        const pl = mapDeezerPlaylist(item);
        if (pl) results.push(pl);
      }

      // Stop if Deezer has no more pages
      if (!data.next || data.data.length < fetch_limit) break;
      index += fetch_limit;
    }

    return results;
  });
}

export async function getDeezerPlaylistWithTracks(
  playlistId: number,
  trackLimit = 100
): Promise<DeezerPlaylistWithTracks | null> {
  const key = `deezer:pl:${playlistId}:${trackLimit}`;
  return dbCache<DeezerPlaylistWithTracks | null>(key, DAY, async () => {
    const plData = await deezerPlaylistFetch<Record<string, unknown>>(`/playlist/${playlistId}`);
    if (!plData) return null;
    const summary = mapDeezerPlaylist(plData);
    if (!summary) return null;

    const tracks: DeezerPlaylistTrack[] = [];
    const embedded = plData.tracks as Record<string, unknown> | undefined;
    if (Array.isArray(embedded?.data)) {
      for (const item of embedded.data) {
        const t = mapDeezerPlaylistTrack(item);
        if (t) tracks.push(t);
        if (tracks.length >= trackLimit) break;
      }
    }

    // Paginate remaining pages if needed
    let nextUrl = typeof embedded?.next === "string" ? embedded.next : null;
    while (nextUrl && tracks.length < trackLimit) {
      const parsed = new URL(nextUrl);
      const page = await deezerPlaylistFetch<{ data?: unknown[]; next?: string }>(
        parsed.pathname + parsed.search
      );
      if (!Array.isArray(page?.data) || page.data.length === 0) break;
      for (const item of page.data) {
        const t = mapDeezerPlaylistTrack(item);
        if (t) tracks.push(t);
        if (tracks.length >= trackLimit) break;
      }
      nextUrl = typeof page?.next === "string" ? page.next : null;
    }

    return { ...summary, tracks };
  });
}

// ─── Album tracks ─────────────────────────────────────────────────────────────

export async function getAlbumTracks(
  albumId: number,
  limit = 50
): Promise<DeezerTrack[]> {
  const url = `${BASE_URL}/album/${albumId}/tracks?limit=${limit}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return [];

  const data = await res.json();
  return (data.data || []).map(
    (t: { id: number; title: string; preview?: string; duration: number; artist?: { id: number; name: string; picture_medium?: string } }) => ({
      id: t.id,
      title: t.title,
      preview: t.preview || "",
      duration: t.duration,
      artist: {
        id: t.artist?.id || 0,
        name: t.artist?.name || "",
        picture_medium: t.artist?.picture_medium || null,
      },
    })
  );
}
