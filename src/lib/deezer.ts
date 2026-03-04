const BASE_URL = "https://api.deezer.com";

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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (t: any) => ({
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data.data || [])
    .filter((a: any) => a.record_type === "album")
    .map((a: any) => ({
      id: a.id,
      title: a.title,
      cover_medium: a.cover_medium || "",
      cover_big: a.cover_big || a.cover_medium || "",
      release_date: a.release_date || "",
      nb_tracks: a.nb_tracks || 0,
      type: a.record_type || "album",
    }));
}

export async function getAlbumTracks(
  albumId: number,
  limit = 50
): Promise<DeezerTrack[]> {
  const url = `${BASE_URL}/album/${albumId}/tracks?limit=${limit}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return [];

  const data = await res.json();
  return (data.data || []).map(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (t: any) => ({
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
