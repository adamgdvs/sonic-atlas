import fs from "node:fs";
import path from "node:path";
import { execFile } from "node:child_process";
import { dbCache } from "@/lib/dbCache";
import {
  getYouTubeMusicPlaylist,
  searchYouTubeMusicPlaylists,
} from "@/lib/youtube";

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

const CuratedCacheTTL = {
  MOODS: DAY,
  MOOD_PLAYLISTS: 6 * HOUR,
  CHARTS: 6 * HOUR,
  PLAYLIST_TRACKS: DAY,
  SEARCH: 6 * HOUR,
} as const;

export interface CuratedPlaylistTrack {
  title: string;
  artist: string;
  videoId: string;
  coverUrl: string | null;
}

export interface CuratedPlaylist {
  id: string;
  title: string;
  description: string;
  coverUrl: string | null;
  source: "ytmusic" | "atlas";
  category: string;
  trackCount?: number | null;
  tracks?: CuratedPlaylistTrack[];
}

export interface MoodCategory {
  title: string;
  params: string;
  section: string;
}

export interface CuratedMoodCard {
  title: string;
  params: string;
  section: string;
  representativePlaylist: CuratedPlaylist | null;
}

export interface ChartResponse {
  country: string;
  songs: CuratedPlaylistTrack[];
  videos: CuratedPlaylistTrack[];
  artists: Array<{
    name: string;
    coverUrl: string | null;
  }>;
}

function getBridgePath() {
  return path.join(process.cwd(), "scripts", "ytmusic_bridge.py");
}

function getPythonBinary() {
  const candidates = [
    path.join(process.cwd(), ".venv", "bin", "python3"),
    path.join(process.cwd(), ".venv", "bin", "python"),
    "python3",
    "python",
  ];

  for (const candidate of candidates) {
    if (!candidate.includes(path.sep) || fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return "python3";
}

function runBridge<T>(args: string[]): Promise<T> {
  return new Promise((resolve, reject) => {
    execFile(
      getPythonBinary(),
      [getBridgePath(), ...args],
      {
        cwd: process.cwd(),
        maxBuffer: 1024 * 1024 * 4,
      },
      (error, stdout, stderr) => {
        if (error) {
          reject(new Error(stderr || stdout || error.message));
          return;
        }

        try {
          const parsed = JSON.parse(stdout) as T | { error: string; detail?: string };
          if (
            parsed &&
            typeof parsed === "object" &&
            "error" in parsed &&
            typeof parsed.error === "string"
          ) {
            reject(new Error(parsed.detail ? `${parsed.error}: ${parsed.detail}` : parsed.error));
            return;
          }

          resolve(parsed as T);
        } catch (parseError) {
          reject(parseError);
        }
      }
    );
  });
}

function shouldUseNodeFallback(error: unknown) {
  const message = error instanceof Error ? error.message : String(error || "");
  return [
    "ytmusicapi not installed",
    "No module named 'ytmusicapi'",
    "can't open file",
    "not found",
    "no such file or directory",
  ].some((needle) => message.toLowerCase().includes(needle.toLowerCase()));
}

async function runBridgeWithFallback<T>(
  args: string[],
  fallback: () => Promise<T>
): Promise<T> {
  try {
    return await runBridge<T>(args);
  } catch (error) {
    if (!shouldUseNodeFallback(error)) {
      throw error;
    }
    return fallback();
  }
}

export async function getMoodCategories() {
  return dbCache<MoodCategory[]>(
    "ytmusic:moods",
    CuratedCacheTTL.MOODS,
    () => runBridge<MoodCategory[]>(["moods"])
  );
}

export async function getMoodPlaylists(params: string) {
  return dbCache<CuratedPlaylist[]>(
    `ytmusic:mood:${params}`,
    CuratedCacheTTL.MOOD_PLAYLISTS,
    () => runBridge<CuratedPlaylist[]>(["mood_playlists", params])
  );
}

export async function getMoodCards() {
  const categories = await getMoodCategories();
  const selected = categories
    .filter((category) => category.section.toLowerCase().includes("mood"))
    .slice(0, 6);

  const cards = await Promise.all(
    selected.map(async (category) => {
      try {
        const playlists = await getMoodPlaylists(category.params);
        return {
          ...category,
          representativePlaylist: playlists.find((playlist) => Boolean(playlist.id)) || null,
        } satisfies CuratedMoodCard;
      } catch {
        return {
          ...category,
          representativePlaylist: null,
        } satisfies CuratedMoodCard;
      }
    })
  );

  return cards.filter((card) => card.representativePlaylist);
}

export async function getCharts(country: string) {
  return dbCache<ChartResponse>(
    `ytmusic:charts:${country.toUpperCase()}`,
    CuratedCacheTTL.CHARTS,
    () => runBridge<ChartResponse>(["charts", country.toUpperCase()])
  );
}

export async function getCuratedPlaylistTracks(playlistId: string) {
  return dbCache<CuratedPlaylist>(
    `ytmusic:playlist:${playlistId}`,
    CuratedCacheTTL.PLAYLIST_TRACKS,
    async () => {
      const playlist = await runBridgeWithFallback<CuratedPlaylist | null>(
        ["playlist_tracks", playlistId],
        async () => {
          const fallback = await getYouTubeMusicPlaylist(playlistId);
          if (!fallback) return null;
          return {
            id: fallback.id,
            title: fallback.title,
            description: fallback.description,
            coverUrl: fallback.coverUrl,
            source: "ytmusic",
            category: "curated",
            trackCount: fallback.trackCount,
            tracks: fallback.tracks,
          } satisfies CuratedPlaylist;
        }
      );

      if (playlist) return playlist;

      return {
        id: playlistId,
        title: "",
        description: "",
        coverUrl: null,
        source: "ytmusic",
        category: "curated",
        trackCount: 0,
        tracks: [],
      } satisfies CuratedPlaylist;
    }
  );
}

export async function searchCuratedPlaylists(query: string) {
  return dbCache<CuratedPlaylist[]>(
    `ytmusic:search:${query.toLowerCase()}`,
    CuratedCacheTTL.SEARCH,
    () =>
      runBridgeWithFallback<CuratedPlaylist[]>(
        ["search_playlists", query],
        async () => {
          const playlists = await searchYouTubeMusicPlaylists(query);
          return playlists.map((playlist) => ({
            id: playlist.id,
            title: playlist.title,
            description: playlist.description,
            coverUrl: playlist.coverUrl,
            source: "ytmusic",
            category: "curated",
            trackCount: playlist.trackCount,
          }));
        }
      )
  );
}
