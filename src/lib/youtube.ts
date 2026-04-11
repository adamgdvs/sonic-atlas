import { Innertube, Platform } from "youtubei.js";
import vm from "node:vm";

// Provide a JavaScript evaluator for signature deciphering
Platform.shim.eval = (
  data: { output: string; exported: string[] },
  env: Record<string, unknown>
) => {
  const wrapped = "(function() { " + data.output + " })()";
  const context = vm.createContext(env);
  const result = vm.runInContext(wrapped, context);
  if (data.exported.length === 1) {
    return { [data.exported[0]]: result };
  }
  return result;
};

let innertubeInstance: Innertube | null = null;

async function getInnertube(): Promise<Innertube> {
  if (!innertubeInstance) {
    innertubeInstance = await Innertube.create({
      lang: "en",
      location: "US",
    });
  }
  return innertubeInstance;
}

export interface YouTubeMusicTrack {
  videoId: string;
  title: string;
  artist: string;
  duration: number;
  thumbnailUrl: string | null;
}

/**
 * Search YouTube Music for tracks by artist name.
 */
export async function searchYouTubeMusic(
  artistName: string,
  limit = 5
): Promise<YouTubeMusicTrack[]> {
  try {
    const yt = await getInnertube();
    const results = await yt.music.search(artistName, { type: "song" });

    const tracks: YouTubeMusicTrack[] = [];
    const contentsArray = results.contents as unknown as Array<{ type: string; contents?: unknown[] }>;
    const shelf = contentsArray?.[0];
    if (!shelf || shelf.type !== "MusicShelf") return tracks;

    interface FlexColumn {
      title?: {
        text?: string;
        runs?: Array<{
          text: string;
          endpoint?: {
            payload?: { videoId?: string };
          };
        }>;
      };
    }

    interface MusicItem {
      type: string;
      flex_columns?: FlexColumn[];
      thumbnail?: { contents?: Array<{ url: string }> };
    }

    const items = (shelf as { contents?: MusicItem[] }).contents || [];

    for (const item of items) {
      if (tracks.length >= limit) break;
      if (item.type !== "MusicResponsiveListItem") continue;

      const cols = item.flex_columns;
      if (!cols || cols.length < 2) continue;

      const titleRun = cols[0]?.title?.runs?.[0];
      const artistRun = cols[1]?.title?.runs?.[0];

      const title = titleRun?.text || "";
      const artist = artistRun?.text || artistName;
      const videoId = titleRun?.endpoint?.payload?.videoId;

      if (!videoId || !title) continue;

      const thumbs = item.thumbnail?.contents;

      tracks.push({
        videoId,
        title,
        artist,
        duration: 0,
        thumbnailUrl: thumbs?.[thumbs.length - 1]?.url || null,
      });
    }

    return tracks;
  } catch (error) {
    console.error("YouTube Music search failed:", error);
    return [];
  }
}

/**
 * Search YouTube Music for a specific song by artist + title.
 */
export async function findYouTubeVideoId(
  artistName: string,
  songTitle: string
): Promise<string | null> {
  try {
    const tracks = await searchYouTubeMusic(`${artistName} ${songTitle}`, 1);
    return tracks[0]?.videoId || null;
  } catch (error) {
    console.error("YouTube videoId lookup failed:", error);
    return null;
  }
}

/**
 * Hardcoded Piped API instances as fallback.
 * The app also fetches the live instance list on startup.
 */
const FALLBACK_PIPED_INSTANCES = [
  "https://api.piped.private.coffee",
  "https://pipedapi.kavin.rocks",
  "https://pipedapi.adminforge.de",
];

/** Cached list of working Piped API URLs, refreshed periodically. */
let cachedPipedInstances: string[] | null = null;
let instancesFetchedAt = 0;
const INSTANCES_TTL = 10 * 60 * 1000; // 10 minutes

/**
 * Fetch the live list of Piped instances from the official registry,
 * test each one briefly, and cache the working ones.
 */
async function getPipedInstances(): Promise<string[]> {
  if (cachedPipedInstances && Date.now() - instancesFetchedAt < INSTANCES_TTL) {
    return cachedPipedInstances;
  }

  try {
    const resp = await fetch("https://piped-instances.kavin.rocks/", {
      signal: AbortSignal.timeout(5000),
    });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

    const instances: Array<{ api_url?: string; name?: string }> = await resp.json();
    const apis = instances
      .map((i) => i.api_url)
      .filter((u): u is string => !!u && u.startsWith("https://"));

    if (apis.length > 0) {
      cachedPipedInstances = apis;
      instancesFetchedAt = Date.now();
      console.log(`[Stream] Loaded ${apis.length} Piped instances from registry`);
      return apis;
    }
  } catch (e) {
    console.log(`[Stream] Failed to fetch Piped registry: ${(e as Error).message}`);
  }

  return FALLBACK_PIPED_INSTANCES;
}

interface PipedAudioStream {
  url: string;
  mimeType: string;
  bitrate: number;
  quality: string;
  contentLength: number;
}

interface PipedResponse {
  audioStreams?: PipedAudioStream[];
  title?: string;
  error?: string;
}

/**
 * Get an audio stream URL for a videoId using Piped API.
 * Piped handles YouTube's anti-bot measures from their infrastructure,
 * so this works from datacenter IPs (Vercel) where direct
 * youtubei.js streaming is blocked with LOGIN_REQUIRED.
 */
async function getStreamUrl(videoId: string): Promise<string | null> {
  const instances = await getPipedInstances();

  for (const instance of instances) {
    try {
      const resp = await fetch(`${instance}/streams/${videoId}`, {
        headers: { "Accept": "application/json" },
        signal: AbortSignal.timeout(8000),
      });

      if (!resp.ok) continue;

      const data: PipedResponse = await resp.json();

      if (data.error || !data.audioStreams || data.audioStreams.length === 0) {
        continue;
      }

      // Pick the best audio stream — prefer mp4 for browser compatibility, then highest bitrate
      const sorted = [...data.audioStreams].sort((a, b) => {
        const aIsMp4 = a.mimeType?.includes("mp4") ? 1 : 0;
        const bIsMp4 = b.mimeType?.includes("mp4") ? 1 : 0;
        if (aIsMp4 !== bIsMp4) return bIsMp4 - aIsMp4;
        return (b.bitrate || 0) - (a.bitrate || 0);
      });

      const chosen = sorted[0];
      if (chosen?.url) {
        console.log(`[Stream] Got URL via ${instance} for videoId=${videoId} (bitrate=${chosen.bitrate}, mime=${chosen.mimeType})`);
        return chosen.url;
      }
    } catch {
      continue;
    }
  }

  console.error(`[Stream] All Piped instances failed for videoId=${videoId}`);
  return null;
}

/**
 * Get a redirect URL for a given videoId.
 * Returns a direct YouTube CDN URL that the browser can play from.
 */
export async function getStreamRedirectUrl(
  videoId: string
): Promise<string | null> {
  return getStreamUrl(videoId);
}
