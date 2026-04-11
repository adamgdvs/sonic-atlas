import { Innertube, Platform } from "youtubei.js";
import vm from "node:vm";
import https from "node:https";
import { Readable } from "node:stream";

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
 * Client types to try for streaming, in order of preference.
 * TV_EMBEDDED and WEB_EMBEDDED typically don't require PO tokens.
 */
const STREAM_CLIENTS = ["IOS", "ANDROID", "TV_EMBEDDED", "WEB"] as const;

/**
 * Get an authenticated stream URL for a videoId using youtubei.js.
 * Tries multiple client types to find one that returns valid audio streams.
 */
async function getStreamUrl(videoId: string): Promise<string | null> {
  const yt = await getInnertube();

  for (const client of STREAM_CLIENTS) {
    try {
      console.log(`[Stream] Trying client=${client} for videoId=${videoId}`);
      const info = await yt.getBasicInfo(videoId, { client: client as "TV_EMBEDDED" | "IOS" | "ANDROID" | "WEB" });

      if (!info.streaming_data) {
        console.log(`[Stream] No streaming_data from client=${client}`);
        continue;
      }

      // Prefer adaptive formats (audio-only), fall back to combined formats
      const formats = [
        ...(info.streaming_data.adaptive_formats || []),
        ...(info.streaming_data.formats || []),
      ];

      // Find best audio-only format
      const audioFormats = formats
        .filter((f) => f.has_audio && !f.has_video)
        .sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));

      // If no audio-only, try any format with audio
      const candidates = audioFormats.length > 0
        ? audioFormats
        : formats.filter((f) => f.has_audio).sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));

      if (candidates.length === 0) {
        console.log(`[Stream] No audio formats from client=${client}`);
        continue;
      }

      const chosen = candidates[0];

      // Get the URL — may need deciphering
      let url = chosen.url;
      if (!url) {
        try {
          url = await chosen.decipher(yt.session.player);
        } catch (e) {
          console.log(`[Stream] Decipher failed for client=${client}:`, e);
          continue;
        }
      }

      if (url && url.startsWith("http")) {
        console.log(`[Stream] Got URL via client=${client} for videoId=${videoId} (bitrate=${chosen.bitrate}, mime=${chosen.mime_type})`);
        return url;
      }
    } catch (error) {
      console.log(`[Stream] Client ${client} failed for videoId=${videoId}:`, error);
      continue;
    }
  }

  console.error(`[Stream] All clients failed for videoId=${videoId}`);
  return null;
}

/**
 * Get audio stream for a given videoId.
 * Uses youtubei.js to get a CDN URL, then proxies via node:https
 * with proper headers (Content-Length, Content-Type, Range support).
 */
export async function getAudioStream(
  videoId: string,
  rangeHeader?: string | null
): Promise<{
  stream: Readable;
  statusCode: number;
  headers: Record<string, string>;
} | null> {
  const streamUrl = await getStreamUrl(videoId);
  if (!streamUrl) return null;

  console.log(`[Stream] Got authenticated URL for videoId=${videoId}, proxying...`);

  return new Promise((resolve, reject) => {
    const url = new URL(streamUrl);
    const reqHeaders: Record<string, string> = {};
    if (rangeHeader) {
      reqHeaders["Range"] = rangeHeader;
    }

    const req = https.get(url, { headers: reqHeaders }, (res) => {
      const statusCode = res.statusCode || 500;

      if (statusCode !== 200 && statusCode !== 206) {
        res.destroy();
        console.error(`[Stream] CDN returned ${statusCode} for videoId=${videoId}`);
        resolve(null);
        return;
      }

      const headers: Record<string, string> = {};
      if (res.headers["content-type"]) {
        headers["Content-Type"] = res.headers["content-type"] as string;
      }
      if (res.headers["content-length"]) {
        headers["Content-Length"] = res.headers["content-length"] as string;
      }
      if (res.headers["content-range"]) {
        headers["Content-Range"] = res.headers["content-range"] as string;
      }
      if (res.headers["accept-ranges"]) {
        headers["Accept-Ranges"] = res.headers["accept-ranges"] as string;
      }

      console.log(
        `[Stream] CDN success for videoId=${videoId}: status=${statusCode} content-length=${headers["Content-Length"] || "unknown"} content-type=${headers["Content-Type"] || "unknown"}`
      );

      resolve({
        stream: res,
        statusCode,
        headers,
      });
    });
    req.on("error", reject);
  });
}
