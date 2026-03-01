const BASE_URL = "https://ws.audioscrobbler.com/2.0";

function getApiKey(): string {
  const key = process.env.LASTFM_API_KEY;
  if (!key || key === "YOUR_KEY_HERE") {
    throw new Error("LASTFM_API_KEY not configured in .env.local");
  }
  return key;
}

export interface LastFmSimilarArtist {
  name: string;
  mbid: string;
  match: number; // 0-1
  url: string;
  image: string | null;
}

export async function getSimilarArtists(
  artist: string,
  limit = 20
): Promise<LastFmSimilarArtist[]> {
  const apiKey = getApiKey();
  const url = `${BASE_URL}/?method=artist.getsimilar&artist=${encodeURIComponent(artist)}&api_key=${apiKey}&limit=${limit}&autocorrect=1&format=json`;

  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) {
    throw new Error(`Last.fm API error: ${res.status}`);
  }

  const data = await res.json();
  if (data.error) {
    throw new Error(`Last.fm error ${data.error}: ${data.message}`);
  }

  const artists = data.similarartists?.artist || [];
  return artists.map(
    (a: {
      name: string;
      mbid: string;
      match: string;
      url: string;
      image: { "#text": string; size: string }[];
    }) => {
      const rawImg = a.image?.find((img) => img.size === "large")?.["#text"];
      return {
        name: a.name,
        mbid: a.mbid,
        match: parseFloat(a.match),
        url: a.url,
        image: rawImg && rawImg.length > 0 ? rawImg : null,
      };
    }
  );
}

export interface LastFmTag {
  name: string;
  count: number;
  url: string;
}

export async function getTopTags(artist: string): Promise<LastFmTag[]> {
  const apiKey = getApiKey();
  const url = `${BASE_URL}/?method=artist.gettoptags&artist=${encodeURIComponent(artist)}&api_key=${apiKey}&autocorrect=1&format=json`;

  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) {
    throw new Error(`Last.fm API error: ${res.status}`);
  }

  const data = await res.json();
  if (data.error) {
    throw new Error(`Last.fm error ${data.error}: ${data.message}`);
  }

  return (data.toptags?.tag || []).map(
    (t: { name: string; count: number; url: string }) => ({
      name: t.name.toLowerCase(),
      count: t.count,
      url: t.url,
    })
  );
}

export interface LastFmArtistInfo {
  name: string;
  mbid: string;
  listeners: number;
  playcount: number;
  bio: string;
  tags: LastFmTag[];
  image: string | null;
}

export async function getArtistInfo(
  artist: string
): Promise<LastFmArtistInfo> {
  const apiKey = getApiKey();
  const url = `${BASE_URL}/?method=artist.getinfo&artist=${encodeURIComponent(artist)}&api_key=${apiKey}&autocorrect=1&format=json`;

  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) {
    throw new Error(`Last.fm API error: ${res.status}`);
  }

  const data = await res.json();
  if (data.error) {
    throw new Error(`Last.fm error ${data.error}: ${data.message}`);
  }

  const a = data.artist;
  return {
    name: a.name,
    mbid: a.mbid,
    listeners: parseInt(a.stats?.listeners || "0"),
    playcount: parseInt(a.stats?.playcount || "0"),
    bio: a.bio?.summary || "",
    tags: (a.tags?.tag || []).map(
      (t: { name: string; url: string }) => ({
        name: t.name.toLowerCase(),
        count: 0,
        url: t.url,
      })
    ),
    image: (() => {
      const rawImg = a.image?.find(
        (img: { "#text": string; size: string }) => img.size === "extralarge"
      )?.["#text"];
      return rawImg && rawImg.length > 0 ? rawImg : null;
    })(),
  };
}

// ─── Tag / Genre endpoints ────────────────────────────────────────

export interface LastFmTagArtist {
  name: string;
  mbid: string;
  url: string;
  image: string | null;
}

export async function getTagTopArtists(
  tag: string,
  limit = 200
): Promise<LastFmTagArtist[]> {
  const apiKey = getApiKey();
  const url = `${BASE_URL}/?method=tag.gettopartists&tag=${encodeURIComponent(tag)}&api_key=${apiKey}&limit=${limit}&format=json`;

  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) {
    throw new Error(`Last.fm API error: ${res.status}`);
  }

  const data = await res.json();
  if (data.error) {
    throw new Error(`Last.fm error ${data.error}: ${data.message}`);
  }

  const artists = data.topartists?.artist || [];
  return artists.map(
    (a: {
      name: string;
      mbid: string;
      url: string;
      image: { "#text": string; size: string }[];
    }) => {
      const rawImg = a.image?.find((img) => img.size === "large")?.["#text"];
      return {
        name: a.name,
        mbid: a.mbid || "",
        url: a.url,
        image: rawImg && rawImg.length > 0 ? rawImg : null,
      };
    }
  );
}

export async function getSimilarTags(
  tag: string
): Promise<{ name: string }[]> {
  const apiKey = getApiKey();
  const url = `${BASE_URL}/?method=tag.getsimilar&tag=${encodeURIComponent(tag)}&api_key=${apiKey}&format=json`;

  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) {
    throw new Error(`Last.fm API error: ${res.status}`);
  }

  const data = await res.json();
  if (data.error) {
    throw new Error(`Last.fm error ${data.error}: ${data.message}`);
  }

  const tags = data.similartags?.tag || [];
  return tags.map((t: { name: string }) => ({ name: t.name.toLowerCase() }));
}

export interface LastFmChartTag {
  name: string;
  count: number;
}

export async function getChartTopTags(
  limit = 250
): Promise<LastFmChartTag[]> {
  const apiKey = getApiKey();
  const url = `${BASE_URL}/?method=chart.gettoptags&api_key=${apiKey}&limit=${limit}&format=json`;

  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) {
    throw new Error(`Last.fm API error: ${res.status}`);
  }

  const data = await res.json();
  if (data.error) {
    throw new Error(`Last.fm error ${data.error}: ${data.message}`);
  }

  const tags = data.tags?.tag || [];
  return tags.map((t: { name: string; reach: string; taggings: string }) => ({
    name: t.name.toLowerCase(),
    count: parseInt(t.taggings || "0"),
  }));
}
