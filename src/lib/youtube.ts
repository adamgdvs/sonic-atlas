import { Innertube, Platform } from "youtubei.js";
import vm from "node:vm";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import https from "node:https";
import { Readable } from "node:stream";

const execFileAsync = promisify(execFile);

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
 * Get an authenticated stream URL for a videoId using yt-dlp.
 * yt-dlp handles all YouTube anti-bot measures (PO tokens, signatures, etc).
 */
async function getStreamUrl(videoId: string): Promise<string | null> {
  try {
    const { stdout } = await execFileAsync("yt-dlp", [
      "-f", "bestaudio",
      "--print", "urls",
      "--no-warnings",
      "--no-playlist",
      `https://music.youtube.com/watch?v=${videoId}`,
    ], { timeout: 15000 });

    const url = stdout.trim();
    if (!url || !url.startsWith("http")) {
      console.error(`[Stream] yt-dlp returned invalid URL for videoId=${videoId}`);
      return null;
    }
    return url;
  } catch (error) {
    console.error(`[Stream] yt-dlp failed for videoId=${videoId}:`, error);
    return null;
  }
}

/**
 * Get audio stream for a given videoId.
 * Uses yt-dlp to get an authenticated CDN URL, then proxies via node:https
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
    const reqHeaders: Record<string, string> = {
      "accept": "*/*",
      "origin": "https://www.youtube.com",
      "referer": "https://www.youtube.com",
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    };
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
