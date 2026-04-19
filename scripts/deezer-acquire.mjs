#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import vm from "node:vm";
import { PrismaClient } from "@prisma/client";
import { Innertube, Platform } from "youtubei.js";

const DEEZER_BASE_URL = "https://api.deezer.com";
const DEFAULT_OUTPUT_DIR = "data/deezer";
const MAX_PAGE_GUARD = 500;

Platform.shim.eval = (data, env) => {
  const wrapped = "(function() { " + data.output + " })()";
  const context = vm.createContext(env);
  const result = vm.runInContext(wrapped, context);
  if (data.exported.length === 1) {
    return { [data.exported[0]]: result };
  }
  return result;
};

let innertubeInstance = null;
let prismaInstance = null;

async function getInnertube() {
  if (!innertubeInstance) {
    innertubeInstance = await Innertube.create({
      lang: "en",
      location: "US",
    });
  }
  return innertubeInstance;
}

function getPrisma() {
  if (!process.env.DATABASE_URL) return null;
  if (!prismaInstance) {
    prismaInstance = new PrismaClient();
  }
  return prismaInstance;
}

function printHelp() {
  console.log(`Deezer acquisition pipeline for Sonic Atlas

Usage:
  node scripts/deezer-acquire.mjs [options]

Inputs:
  --playlist <id>              Fetch a Deezer playlist by ID. Repeatable.
  --user <id>                  Crawl /user/{id}/playlists and ingest each playlist. Repeatable.
  --search <query>             Search Deezer playlists by text query. Repeatable.
  --user-playlists-json <file> Load a saved /user/{id}/playlists payload and ingest listed playlist IDs.
  --bundle-json <file>         Load a local bundle shaped as { playlist, trackPages } and ingest it.

Behavior:
  --match-youtube              Also generate matched YouTube output for each playlist.
  --force                      Ignore checksum short-circuiting and rebuild artifacts.
  --limit-playlists <n>        Cap playlists imported from each user/search source.
  --limit-tracks <n>           Cap tracks matched to YouTube per playlist.
  --output <dir>               Output root. Defaults to data/deezer.

Examples:
  node scripts/deezer-acquire.mjs --playlist 760160361 --match-youtube
  node scripts/deezer-acquire.mjs --user 2529 --limit-playlists 100
  node scripts/deezer-acquire.mjs --search "indie rock" --search shoegaze --match-youtube
  node scripts/deezer-acquire.mjs --bundle-json ./fixtures/indie-rock-now.bundle.json --match-youtube
`);
}

function parseArgs(argv) {
  const options = {
    playlists: [],
    users: [],
    searches: [],
    bundleJson: [],
    userPlaylistsJson: [],
    matchYoutube: false,
    force: false,
    output: DEFAULT_OUTPUT_DIR,
    limitPlaylists: null,
    limitTracks: null,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--help" || arg === "-h") {
      options.help = true;
      continue;
    }
    if (arg === "--match-youtube") {
      options.matchYoutube = true;
      continue;
    }
    if (arg === "--force") {
      options.force = true;
      continue;
    }

    const next = argv[index + 1];
    if (!next) {
      throw new Error(`Missing value for ${arg}`);
    }

    if (arg === "--playlist") {
      options.playlists.push(next);
    } else if (arg === "--user") {
      options.users.push(next);
    } else if (arg === "--search") {
      options.searches.push(next);
    } else if (arg === "--bundle-json") {
      options.bundleJson.push(next);
    } else if (arg === "--user-playlists-json") {
      options.userPlaylistsJson.push(next);
    } else if (arg === "--output") {
      options.output = next;
    } else if (arg === "--limit-playlists") {
      options.limitPlaylists = parseInteger(next, "--limit-playlists");
    } else if (arg === "--limit-tracks") {
      options.limitTracks = parseInteger(next, "--limit-tracks");
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }

    index += 1;
  }

  return options;
}

function parseInteger(value, label) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`${label} must be a positive integer`);
  }
  return parsed;
}

function toAbsolute(root, targetPath) {
  return path.isAbsolute(targetPath) ? targetPath : path.join(root, targetPath);
}

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function readJson(filePath) {
  const content = await fs.readFile(filePath, "utf8");
  return JSON.parse(content);
}

async function writeJson(filePath, value) {
  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, JSON.stringify(value, null, 2) + "\n", "utf8");
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "SonicAtlas/1.0",
    },
  });

  if (!response.ok) {
    throw new Error(`Request failed (${response.status}) for ${url}`);
  }

  const payload = await response.json();
  if (payload && payload.error) {
    throw new Error(`Deezer error for ${url}: ${payload.error.message || "Unknown error"}`);
  }

  return payload;
}

async function fetchPaginated(url) {
  const pages = [];
  let nextUrl = url;
  let guard = 0;

  while (nextUrl) {
    if (guard > MAX_PAGE_GUARD) {
      throw new Error(`Pagination exceeded guard for ${url}`);
    }

    const page = await fetchJson(nextUrl);
    pages.push(page);
    nextUrl = typeof page.next === "string" && page.next.trim() ? page.next : null;
    guard += 1;
  }

  return pages;
}

function cleanWhitespace(value) {
  return String(value || "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeText(value) {
  return cleanWhitespace(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function slugify(value) {
  return normalizeText(value).replace(/\s+/g, "-") || "query";
}

function simplifyTrackTitle(value) {
  return cleanWhitespace(
    String(value || "")
      .replace(/\((feat|ft)\.[^)]+\)/gi, "")
      .replace(/\[(feat|ft)\.[^\]]+\]/gi, "")
      .replace(/\((from the motel|mj lenderman version|radio edit|edit|version)\)/gi, "")
      .replace(/\s+\/\s+.*$/g, "")
  );
}

function titleWords(value) {
  return new Set(normalizeText(value).split(/\s+/).filter(Boolean));
}

function tokenOverlap(left, right) {
  const leftWords = titleWords(left);
  const rightWords = titleWords(right);
  if (leftWords.size === 0 || rightWords.size === 0) return 0;

  let overlap = 0;
  for (const word of leftWords) {
    if (rightWords.has(word)) overlap += 1;
  }

  return overlap / Math.max(leftWords.size, rightWords.size);
}

function stringSimilarity(left, right) {
  const a = normalizeText(left);
  const b = normalizeText(right);
  if (!a || !b) return 0;
  if (a === b) return 1;
  if (a.includes(b) || b.includes(a)) return 0.92;
  return tokenOverlap(a, b);
}

function durationCloseness(left, right) {
  if (!Number.isFinite(left) || !Number.isFinite(right)) return 0;
  const delta = Math.abs(left - right);
  if (delta <= 2) return 1;
  if (delta <= 5) return 0.8;
  if (delta <= 10) return 0.55;
  if (delta <= 20) return 0.2;
  return 0;
}

function normalizeTrack(raw) {
  if (!raw || typeof raw !== "object") return null;
  if (!raw.id || !raw.title || !raw.artist?.name) return null;

  return {
    sourceTrackId: raw.id,
    isrc: raw.isrc || null,
    title: cleanWhitespace(raw.title),
    artist: cleanWhitespace(raw.artist.name),
    album: cleanWhitespace(raw.album?.title || ""),
    duration: Number.isFinite(raw.duration) ? raw.duration : null,
    explicit: Boolean(raw.explicit_lyrics),
    preview: raw.preview || null,
    deezerUrl: raw.link || null,
    timeAdded: Number.isFinite(raw.time_add) ? raw.time_add : null,
    coverUrl:
      raw.album?.cover_xl ||
      raw.album?.cover_big ||
      raw.album?.cover_medium ||
      raw.album?.cover ||
      null,
  };
}

function normalizePlaylist(playlistPayload, trackPages = []) {
  const rawTracks = [];
  if (Array.isArray(playlistPayload?.tracks?.data)) {
    rawTracks.push(...playlistPayload.tracks.data);
  }
  for (const page of trackPages) {
    if (Array.isArray(page?.data)) {
      rawTracks.push(...page.data);
    }
  }

  const seen = new Set();
  const tracks = rawTracks
    .map(normalizeTrack)
    .filter(Boolean)
    .filter((track) => {
      if (seen.has(track.sourceTrackId)) return false;
      seen.add(track.sourceTrackId);
      return true;
    });

  return {
    source: "deezer",
    sourcePlaylistId: playlistPayload.id,
    checksum: playlistPayload.checksum || null,
    title: cleanWhitespace(playlistPayload.title || ""),
    description: cleanWhitespace(playlistPayload.description || ""),
    creator: cleanWhitespace(playlistPayload.creator?.name || ""),
    coverUrl:
      playlistPayload.picture_xl ||
      playlistPayload.picture_big ||
      playlistPayload.picture_medium ||
      playlistPayload.picture ||
      null,
    deezerUrl: playlistPayload.link || playlistPayload.share || null,
    trackCount: Number.isFinite(playlistPayload.nb_tracks) ? playlistPayload.nb_tracks : tracks.length,
    tracks,
  };
}

async function searchYouTubeMusic(query, limit) {
  const yt = await getInnertube();
  const results = await yt.music.search(query, { type: "song" });
  const tracks = [];
  const contentsArray = results.contents || [];
  const shelf = contentsArray[0];
  if (!shelf || shelf.type !== "MusicShelf") return tracks;

  const items = shelf.contents || [];
  for (const item of items) {
    if (tracks.length >= limit) break;
    if (item.type !== "MusicResponsiveListItem") continue;

    const cols = item.flex_columns;
    if (!cols || cols.length < 2) continue;

    const titleRun = cols[0]?.title?.runs?.[0];
    const artistRun = cols[1]?.title?.runs?.[0];
    const videoId = titleRun?.endpoint?.payload?.videoId;
    const title = titleRun?.text || "";
    const artist = artistRun?.text || "";

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
}

function scoreCandidate(track, candidate) {
  const titleScore = stringSimilarity(simplifyTrackTitle(track.title), candidate.title);
  const artistScore = stringSimilarity(track.artist, candidate.artist);
  const durationScore = durationCloseness(track.duration, candidate.duration || null);

  let score = titleScore * 0.58 + artistScore * 0.34 + durationScore * 0.08;
  const normalizedCandidate = normalizeText(candidate.title);
  if (normalizedCandidate.includes("karaoke")) score -= 0.35;
  if (normalizedCandidate.includes("instrumental")) score -= 0.15;
  if (normalizedCandidate.includes("sped up")) score -= 0.2;
  if (normalizedCandidate.includes("slowed")) score -= 0.2;
  if (normalizedCandidate.includes("nightcore")) score -= 0.3;

  return Math.max(0, Math.min(1, score));
}

async function matchPlaylistToYouTube(normalizedPlaylist, limitTracks) {
  const targetTracks = normalizedPlaylist.tracks.slice(
    0,
    limitTracks || normalizedPlaylist.tracks.length
  );
  const matches = [];

  for (const track of targetTracks) {
    const query = `${track.artist} ${simplifyTrackTitle(track.title)}`.trim();
    let ranked = [];
    try {
      const results = await searchYouTubeMusic(query, 5);
      ranked = results
        .map((candidate) => ({
          candidate,
          score: scoreCandidate(track, candidate),
        }))
        .sort((left, right) => right.score - left.score);
    } catch {
      ranked = [];
    }

    const best = ranked[0];
    if (!best || best.score < 0.55 || !best.candidate.videoId) {
      matches.push({
        status: "unmatched",
        confidence: best?.score || 0,
        deezerTrack: track,
        videoId: null,
        matchedTitle: null,
        matchedArtist: null,
        thumbnailUrl: null,
      });
      continue;
    }

    matches.push({
      status: "matched",
      confidence: best.score,
      deezerTrack: track,
      videoId: best.candidate.videoId,
      matchedTitle: best.candidate.title,
      matchedArtist: best.candidate.artist,
      thumbnailUrl: best.candidate.thumbnailUrl,
    });
  }

  const matchedCount = matches.filter((item) => item.status === "matched").length;
  return {
    playlist: normalizedPlaylist,
    matches,
    stats: {
      requested: targetTracks.length,
      matched: matchedCount,
      unmatched: targetTracks.length - matchedCount,
      coverage: targetTracks.length > 0 ? matchedCount / targetTracks.length : 0,
    },
  };
}

async function fetchUserPlaylistIds(userId, limitPlaylists, outputRoot) {
  const url = `${DEEZER_BASE_URL}/user/${encodeURIComponent(userId)}/playlists`;
  const pages = await fetchPaginated(url);
  await writeJson(
    path.join(outputRoot, "raw", "users", `${userId}.playlists.json`),
    {
      source: "deezer-user-playlists",
      userId,
      fetchedAt: new Date().toISOString(),
      pages,
    }
  );

  const ids = [];
  for (const page of pages) {
    for (const item of page.data || []) {
      if (item?.id) ids.push(String(item.id));
    }
  }

  return unique(ids).slice(0, limitPlaylists || ids.length);
}

async function fetchSearchPlaylistIds(query, limitPlaylists, outputRoot) {
  const url = `${DEEZER_BASE_URL}/search/playlist?q=${encodeURIComponent(query)}`;
  const pages = await fetchPaginated(url);
  await writeJson(
    path.join(outputRoot, "raw", "search", `${slugify(query)}.json`),
    {
      source: "deezer-search",
      query,
      fetchedAt: new Date().toISOString(),
      pages,
    }
  );

  const ids = [];
  for (const page of pages) {
    for (const item of page.data || []) {
      if (item?.id) ids.push(String(item.id));
    }
  }

  return unique(ids).slice(0, limitPlaylists || ids.length);
}

async function loadPlaylistIdsFromUserDump(filePath) {
  const payload = await readJson(filePath);
  const pages = Array.isArray(payload?.pages) ? payload.pages : [payload];
  const ids = [];

  for (const page of pages) {
    for (const item of page?.data || []) {
      if (item?.id) ids.push(String(item.id));
    }
  }

  return unique(ids);
}

function unique(values) {
  return [...new Set(values)];
}

async function processPlaylistBundle(bundle, context) {
  const { outputRoot, matchYoutube, limitTracks } = context;
  const playlistPayload = bundle?.playlist;
  const trackPages = Array.isArray(bundle?.trackPages) ? bundle.trackPages : [];

  if (!playlistPayload?.id || !playlistPayload?.title) {
    throw new Error("Bundle is missing playlist metadata");
  }

  const playlistId = String(playlistPayload.id);
  const normalized = normalizePlaylist(playlistPayload, trackPages);

  const playlistRawPath = path.join(outputRoot, "raw", "playlists", `${playlistId}.json`);
  const tracksRawPath = path.join(outputRoot, "raw", "playlists", `${playlistId}.tracks.json`);
  const normalizedPath = path.join(outputRoot, "normalized", "playlists", `${playlistId}.json`);
  const matchedPath = path.join(outputRoot, "matched", "playlists", `${playlistId}.json`);

  await writeJson(playlistRawPath, playlistPayload);
  await writeJson(
    tracksRawPath,
    {
      playlistId,
      checksum: playlistPayload.checksum || null,
      pages: trackPages,
      tracks: normalized.tracks,
    }
  );
  await writeJson(normalizedPath, normalized);

  let matched = null;
  if (matchYoutube) {
    matched = await matchPlaylistToYouTube(normalized, limitTracks);
    await writeJson(matchedPath, matched);
  }

  await persistImportedPlaylist(normalized, matched);

  return {
    playlistId,
    title: normalized.title,
    checksum: normalized.checksum,
    trackCount: normalized.trackCount,
    matchedCoverage: matched?.stats?.coverage ?? null,
    source: "bundle",
    paths: {
      rawPlaylist: relativeToCwd(playlistRawPath),
      rawTracks: relativeToCwd(tracksRawPath),
      normalized: relativeToCwd(normalizedPath),
      matched: matchYoutube ? relativeToCwd(matchedPath) : null,
    },
  };
}

function relativeToCwd(targetPath) {
  return path.relative(process.cwd(), targetPath) || ".";
}

async function processRemotePlaylistId(playlistId, context) {
  const { outputRoot, matchYoutube, limitTracks, force } = context;
  const playlistRawPath = path.join(outputRoot, "raw", "playlists", `${playlistId}.json`);
  const tracksRawPath = path.join(outputRoot, "raw", "playlists", `${playlistId}.tracks.json`);
  const normalizedPath = path.join(outputRoot, "normalized", "playlists", `${playlistId}.json`);
  const matchedPath = path.join(outputRoot, "matched", "playlists", `${playlistId}.json`);

  const playlistPayload = await fetchJson(`${DEEZER_BASE_URL}/playlist/${encodeURIComponent(playlistId)}`);
  const existingPayload = (await fileExists(playlistRawPath)) ? await readJson(playlistRawPath) : null;
  const unchanged =
    !force &&
    existingPayload &&
    playlistPayload?.checksum &&
    existingPayload?.checksum &&
    playlistPayload.checksum === existingPayload.checksum &&
    (await fileExists(normalizedPath));

  if (unchanged) {
    const normalized = await readJson(normalizedPath);
    const existingMatched = (await fileExists(matchedPath)) ? await readJson(matchedPath) : null;
    let matchedCoverage = null;
    if (matchYoutube) {
      if (existingMatched) {
        matchedCoverage = existingMatched?.stats?.coverage ?? null;
      } else {
        const tracksRaw = (await fileExists(tracksRawPath)) ? await readJson(tracksRawPath) : null;
        const rebuiltMatch = await matchPlaylistToYouTube(normalized, limitTracks);
        await writeJson(matchedPath, rebuiltMatch);
        matchedCoverage = rebuiltMatch?.stats?.coverage ?? null;
        if (!tracksRaw?.tracks) {
          await writeJson(
            tracksRawPath,
            {
              playlistId,
              checksum: normalized.checksum || null,
              pages: [],
              tracks: normalized.tracks,
            }
          );
        }
      }

    }
    await persistImportedPlaylist(
      normalized,
      matchYoutube ? ((await fileExists(matchedPath)) ? await readJson(matchedPath) : existingMatched) : existingMatched
    );

    return {
      playlistId,
      title: normalized.title,
      checksum: normalized.checksum,
      trackCount: normalized.trackCount,
      matchedCoverage,
      source: "remote",
      skipped: true,
      paths: {
        rawPlaylist: relativeToCwd(playlistRawPath),
        rawTracks: relativeToCwd(tracksRawPath),
        normalized: relativeToCwd(normalizedPath),
        matched: matchYoutube ? relativeToCwd(matchedPath) : null,
      },
    };
  }

  const trackPages = await fetchPaginated(
    `${DEEZER_BASE_URL}/playlist/${encodeURIComponent(playlistId)}/tracks`
  );
  const normalized = normalizePlaylist(playlistPayload, trackPages);

  await writeJson(playlistRawPath, playlistPayload);
  await writeJson(
    tracksRawPath,
    {
      playlistId,
      checksum: playlistPayload.checksum || null,
      pages: trackPages,
      tracks: normalized.tracks,
    }
  );
  await writeJson(normalizedPath, normalized);

  let matched = null;
  if (matchYoutube) {
    matched = await matchPlaylistToYouTube(normalized, limitTracks);
    await writeJson(matchedPath, matched);
  }

  await persistImportedPlaylist(normalized, matched);

  return {
    playlistId,
    title: normalized.title,
    checksum: normalized.checksum,
    trackCount: normalized.trackCount,
    matchedCoverage: matched?.stats?.coverage ?? null,
    source: "remote",
    skipped: false,
    paths: {
      rawPlaylist: relativeToCwd(playlistRawPath),
      rawTracks: relativeToCwd(tracksRawPath),
      normalized: relativeToCwd(normalizedPath),
      matched: matchYoutube ? relativeToCwd(matchedPath) : null,
    },
  };
}

async function persistImportedPlaylist(normalized, matched) {
  const prisma = getPrisma();
  if (!prisma) return;

  const matchedMap = new Map(
    (matched?.matches || []).map((item) => [String(item.deezerTrack.sourceTrackId), item])
  );

  const trackCount = normalized.trackCount ?? normalized.tracks.length;
  const matchedCoverage = typeof matched?.stats?.coverage === "number" ? matched.stats.coverage : null;

  await prisma.$transaction(async (tx) => {
    const playlist = await tx.importedPlaylist.upsert({
      where: {
        source_sourcePlaylistId: {
          source: "deezer",
          sourcePlaylistId: String(normalized.sourcePlaylistId),
        },
      },
      update: {
        title: normalized.title,
        description: normalized.description || null,
        creator: normalized.creator || null,
        coverUrl: normalized.coverUrl,
        sourceUrl: normalized.deezerUrl,
        checksum: normalized.checksum,
        trackCount,
        matchedCoverage,
      },
      create: {
        source: "deezer",
        sourcePlaylistId: String(normalized.sourcePlaylistId),
        title: normalized.title,
        description: normalized.description || null,
        creator: normalized.creator || null,
        coverUrl: normalized.coverUrl,
        sourceUrl: normalized.deezerUrl,
        checksum: normalized.checksum,
        trackCount,
        matchedCoverage,
      },
    });

    await tx.importedPlaylistTrack.deleteMany({
      where: { importedPlaylistId: playlist.id },
    });

    if (normalized.tracks.length > 0) {
      await tx.importedPlaylistTrack.createMany({
        data: normalized.tracks.map((track, index) => {
          const match = matchedMap.get(String(track.sourceTrackId));
          return {
            importedPlaylistId: playlist.id,
            sourceTrackId: String(track.sourceTrackId),
            title: track.title,
            artist: track.artist,
            album: track.album || null,
            duration: track.duration,
            explicit: Boolean(track.explicit),
            previewUrl: track.preview,
            sourceUrl: track.deezerUrl,
            coverUrl: track.coverUrl,
            isrc: track.isrc || null,
            position: index,
            matchStatus: match?.status || "unmatched",
            matchConfidence: typeof match?.confidence === "number" ? match.confidence : null,
            videoId: match?.videoId || null,
            matchedTitle: match?.matchedTitle || null,
            matchedArtist: match?.matchedArtist || null,
            matchedThumbnailUrl: match?.thumbnailUrl || null,
          };
        }),
      });
    }
  });
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    printHelp();
    return;
  }

  const hasInput =
    options.playlists.length > 0 ||
    options.users.length > 0 ||
    options.searches.length > 0 ||
    options.bundleJson.length > 0 ||
    options.userPlaylistsJson.length > 0;

  if (!hasInput) {
    printHelp();
    process.exitCode = 1;
    return;
  }

  const outputRoot = toAbsolute(process.cwd(), options.output);
  await ensureDir(outputRoot);

  const context = {
    outputRoot,
    matchYoutube: options.matchYoutube,
    limitTracks: options.limitTracks,
    force: options.force,
  };

  const manifest = [];
  const playlistIds = new Set(options.playlists.map(String));

  for (const userId of options.users) {
    const ids = await fetchUserPlaylistIds(userId, options.limitPlaylists, outputRoot);
    for (const id of ids) playlistIds.add(id);
  }

  for (const query of options.searches) {
    const ids = await fetchSearchPlaylistIds(query, options.limitPlaylists, outputRoot);
    for (const id of ids) playlistIds.add(id);
  }

  for (const filePath of options.userPlaylistsJson) {
    const ids = await loadPlaylistIdsFromUserDump(toAbsolute(process.cwd(), filePath));
    for (const id of ids.slice(0, options.limitPlaylists || ids.length)) {
      playlistIds.add(id);
    }
  }

  for (const bundlePath of options.bundleJson) {
    const bundle = await readJson(toAbsolute(process.cwd(), bundlePath));
    const record = await processPlaylistBundle(bundle, context);
    manifest.push(record);
  }

  for (const playlistId of playlistIds) {
    const record = await processRemotePlaylistId(playlistId, context);
    manifest.push(record);
  }

  const summary = {
    generatedAt: new Date().toISOString(),
    outputRoot: relativeToCwd(outputRoot),
    matchYoutube: options.matchYoutube,
    importedPlaylists: manifest.length,
    playlists: manifest.sort((left, right) => {
      if (left.title && right.title) return left.title.localeCompare(right.title);
      return String(left.playlistId).localeCompare(String(right.playlistId));
    }),
  };

  await writeJson(path.join(outputRoot, "index", "playlists.json"), summary);

  console.log(
    JSON.stringify(
      {
        importedPlaylists: summary.importedPlaylists,
        outputRoot: summary.outputRoot,
        manifest: relativeToCwd(path.join(outputRoot, "index", "playlists.json")),
      },
      null,
      2
    )
  );

  const prisma = getPrisma();
  if (prisma) {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
