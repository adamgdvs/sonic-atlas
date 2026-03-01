const BASE_URL = "https://musicbrainz.org/ws/2";
const USER_AGENT = "SonicAtlas/1.0 (https://github.com/sonic-atlas)";

// Simple in-memory rate limiter: 1 req/sec
let lastRequest = 0;

async function rateLimitedFetch(url: string): Promise<Response> {
  const now = Date.now();
  const wait = Math.max(0, 1000 - (now - lastRequest));
  if (wait > 0) {
    await new Promise((resolve) => setTimeout(resolve, wait));
  }
  lastRequest = Date.now();

  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
    next: { revalidate: 3600 }, // cache for 1 hour
  });

  if (!res.ok) {
    throw new Error(`MusicBrainz API error: ${res.status}`);
  }
  return res;
}

export interface MBArtistSearchResult {
  id: string;
  name: string;
  disambiguation?: string;
  score: number;
  tags?: { name: string; count: number }[];
}

export async function searchArtists(
  query: string,
  limit = 10
): Promise<MBArtistSearchResult[]> {
  const url = `${BASE_URL}/artist?query=${encodeURIComponent(query)}&limit=${limit}&fmt=json`;
  const res = await rateLimitedFetch(url);
  const data = await res.json();

  return (data.artists || []).map(
    (a: {
      id: string;
      name: string;
      disambiguation?: string;
      score: number;
      tags?: { name: string; count: number }[];
    }) => ({
      id: a.id,
      name: a.name,
      disambiguation: a.disambiguation,
      score: a.score,
      tags: a.tags,
    })
  );
}

export interface MBArtistDetail {
  id: string;
  name: string;
  disambiguation?: string;
  genres: { name: string; count: number }[];
  tags: { name: string; count: number }[];
}

export async function getArtist(mbid: string): Promise<MBArtistDetail> {
  const url = `${BASE_URL}/artist/${encodeURIComponent(mbid)}?inc=genres+tags&fmt=json`;
  const res = await rateLimitedFetch(url);
  const data = await res.json();

  return {
    id: data.id,
    name: data.name,
    disambiguation: data.disambiguation,
    genres: (data.genres || []).sort(
      (a: { count: number }, b: { count: number }) => b.count - a.count
    ),
    tags: (data.tags || []).sort(
      (a: { count: number }, b: { count: number }) => b.count - a.count
    ),
  };
}
