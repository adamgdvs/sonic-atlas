"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  getSimilarArtists,
  getArtistPreviewData,
  getTopTagArtists,
  type SimilarArtistResult,
  type TagArtistResult,
} from "@/lib/api";
import { useAudio } from "@/contexts/AudioContext";
import { buildGeneratedDiscoveryMix, type GeneratedDiscoveryMix } from "@/lib/playlist-engine";
import ArtistInitials from "./ArtistInitials";

interface BookmarkSeed {
  name: string;
  imageUrl?: string | null;
  genres: string[];
}

interface DiscoveryArtist extends SimilarArtistResult {
  score?: number;
}

interface RecoGroup {
  source: string;
  sourceImage?: string;
  sourceType: "artist" | "genre";
  artists: DiscoveryArtist[];
}

interface RecoPool {
  source: string;
  sourceImage?: string;
  sourceType: "artist" | "genre";
  artists: DiscoveryArtist[];
}

const DISPLAY_GROUP_COUNT = 4;
const DISPLAY_ARTISTS_PER_GROUP = 8;
const ROTATION_INTERVAL_MS = 45000;

function shuffle<T>(items: T[]): T[] {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

function sample<T>(items: T[], count: number): T[] {
  return shuffle(items).slice(0, count);
}

function parseBookmarkGenres(raw: unknown): string[] {
  if (typeof raw !== "string") return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((value): value is string => typeof value === "string")
      : [];
  } catch {
    return [];
  }
}

function normalizeDiscoveryArtist(
  artist: SimilarArtistResult | TagArtistResult,
  score = 0
): DiscoveryArtist {
  return {
    name: artist.name,
    mbid: artist.mbid || "",
    match: "match" in artist ? artist.match : score,
    url: artist.url || "",
    image: artist.image || null,
    genres: "genres" in artist && Array.isArray(artist.genres) ? artist.genres : [],
    score,
  };
}

function DiscoveryCard({
  artist,
  onOpen,
  onPlay,
  isActive,
}: {
  artist: DiscoveryArtist;
  onOpen: () => void;
  onPlay: (e: React.MouseEvent) => void;
  isActive: boolean;
}) {
  return (
    <div
      onClick={onOpen}
      className="shrink-0 w-[150px] sm:w-[170px] cursor-pointer group snap-start touch-manipulation"
    >
      <div
        className={`relative aspect-square bg-white/5 overflow-hidden mb-3 border transition-all duration-300 ${
          isActive
            ? "border-shift5-orange shadow-[0_0_20px_rgba(255,88,65,0.25)]"
            : "border-white/5 group-hover:border-white/20 group-active:border-white/30"
        }`}
      >
        {artist.image ? (
          <Image
            src={artist.image}
            alt={artist.name}
            fill
            sizes="(max-width: 640px) 150px, 170px"
            className="object-cover grayscale group-hover:grayscale-0 group-active:grayscale-0 scale-105 group-hover:scale-100 group-active:scale-100 transition-all duration-700"
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ArtistInitials name={artist.name} size={56} />
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-shift5-dark/60 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />

        {isActive && (
          <div className="absolute top-2 left-2 px-2 py-0.5 bg-shift5-orange text-white text-[8px] font-mono font-bold uppercase tracking-widest">
            ● Signal
          </div>
        )}

        <button
          onClick={onPlay}
          className="absolute bottom-2.5 right-2.5 w-11 h-11 bg-shift5-orange text-white border-2 border-shift5-orange flex items-center justify-center opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 group-active:opacity-100 group-active:translate-y-0 transition-all duration-300 shadow-[0_4px_20px_rgba(255,88,65,0.5)] hover:bg-white hover:text-shift5-orange touch-manipulation"
          aria-label={`Play ${artist.name}`}
        >
          <svg width={12} height={12} viewBox="0 0 12 12" fill="currentColor">
            <polygon points="3,0 12,6 3,12" />
          </svg>
        </button>
      </div>

      <div className="px-0.5 min-w-0">
        <div
          className={`text-[12px] sm:text-[13px] font-mono font-bold uppercase tracking-tight truncate transition-colors ${
            isActive
              ? "text-shift5-orange"
              : "text-white group-hover:text-shift5-orange"
          }`}
        >
          {artist.name}
        </div>
        <div className="text-[10px] font-mono text-shift5-muted uppercase truncate mt-1 tracking-wider">
          {artist.genres[0] || "Uncharted"}
        </div>
      </div>
    </div>
  );
}

function DailyScanHero({
  collageImages,
  seedNames,
  onStart,
  isStarting,
}: {
  collageImages: string[];
  seedNames: string[];
  onStart: () => void;
  isStarting: boolean;
}) {
  const today = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });

  const filled = [...collageImages];
  while (filled.length < 4) filled.push("");

  return (
    <div className="relative w-full overflow-hidden border-2 border-white/10 mb-8 sm:mb-10 group bg-shift5-dark">
      <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
        {filled.slice(0, 4).map((img, i) =>
          img ? (
            <div key={i} className="relative overflow-hidden">
              <Image
                src={img}
                alt=""
                fill
                sizes="50vw"
                className="object-cover scale-110 group-hover:scale-105 transition-transform duration-1000 opacity-40 group-hover:opacity-55"
                unoptimized
              />
            </div>
          ) : (
            <div key={i} className="bg-white/[0.03]" />
          )
        )}
      </div>

      <div className="absolute inset-0 bg-gradient-to-br from-shift5-orange/25 via-shift5-dark/80 to-shift5-dark/95" />
      <div className="absolute inset-0 bg-gradient-to-t from-shift5-dark via-shift5-dark/60 to-transparent" />
      <div className="absolute inset-0 opacity-[0.04] bg-[linear-gradient(to_right,#888_1px,transparent_1px),linear-gradient(to_bottom,#888_1px,transparent_1px)] bg-[size:32px_32px]" />

      <div className="relative z-10 p-5 sm:p-7 md:p-9 flex flex-col sm:flex-row sm:items-end justify-between gap-5 sm:gap-6 min-h-[220px] sm:min-h-[240px]">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <span className="w-2 h-2 bg-shift5-orange animate-pulse shadow-[0_0_10px_rgba(255,88,65,0.8)]" />
            <span className="text-[9px] sm:text-[10px] font-mono text-shift5-orange uppercase tracking-[0.3em] font-bold">
              Daily_Frequency_Profile
            </span>
          </div>
          <h2 className="text-3xl sm:text-5xl md:text-6xl font-black uppercase tracking-tighter leading-[0.9] mb-3 sm:mb-4 text-white">
            Your Daily Scan
          </h2>
          <p className="text-[11px] sm:text-[12px] font-mono text-shift5-muted uppercase tracking-widest truncate">
            Tuned for {seedNames.slice(0, 3).join(" · ")}
            {seedNames.length > 3 && " · +more"}
          </p>
          <p className="text-[9px] font-mono text-shift5-subtle uppercase tracking-widest mt-1">
            {today}
          </p>
        </div>

        <button
          onClick={onStart}
          disabled={isStarting}
          className="shrink-0 flex items-center justify-center gap-2.5 sm:gap-3 px-6 sm:px-8 py-3.5 sm:py-4 bg-shift5-orange text-white border-2 border-shift5-orange font-mono text-[11px] sm:text-[12px] font-bold uppercase tracking-[0.2em] hover:bg-white hover:text-shift5-orange hover:border-white active:bg-white active:text-shift5-orange transition-all duration-300 touch-manipulation active:scale-[0.97] shadow-[0_6px_24px_rgba(255,88,65,0.35)] disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isStarting ? (
            <>
              <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
              TUNING...
            </>
          ) : (
            <>
              <svg width={12} height={12} viewBox="0 0 12 12" fill="currentColor">
                <polygon points="3,0 12,6 3,12" />
              </svg>
              START_MIX
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default function DiscoverFeed() {
  const { data: session, status } = useSession();
  const { history, currentTrack, isPlaying, playTrack, playQueue, setRadioMode } = useAudio();
  const router = useRouter();

  const [recoPools, setRecoPools] = useState<RecoPool[]>([]);
  const [displayGroups, setDisplayGroups] = useState<RecoGroup[]>([]);
  const [collageImages, setCollageImages] = useState<string[]>([]);
  const [seedNames, setSeedNames] = useState<string[]>([]);
  const [bookmarkSeeds, setBookmarkSeeds] = useState<BookmarkSeed[]>([]);
  const [generatedMix, setGeneratedMix] = useState<GeneratedDiscoveryMix | null>(null);
  const [loading, setLoading] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isSavingMix, setIsSavingMix] = useState(false);
  const [mixSaveState, setMixSaveState] = useState<"idle" | "saved" | "error">("idle");
  const [rotationKey, setRotationKey] = useState(0);

  const tasteSignature = useMemo(() => {
    const recentArtists = [...new Set(history.slice(0, 18).map((entry) => entry.track.artist))]
      .filter(Boolean);
    const genreCounts = new Map<string, number>();

    history.slice(0, 30).forEach((entry) => {
      (entry.track.genres || []).forEach((genre) => {
        const normalized = genre.toLowerCase();
        genreCounts.set(normalized, (genreCounts.get(normalized) || 0) + 1);
      });
    });

    return {
      recentArtists,
      recentGenres: [...genreCounts.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([genre]) => genre),
    };
  }, [history]);

  const rebuildDisplayGroups = useCallback((pools: RecoPool[]) => {
    if (pools.length === 0) {
      setDisplayGroups([]);
      setCollageImages([]);
      return;
    }

    const selectedPools = sample(
      pools.filter((pool) => pool.artists.length > 0),
      DISPLAY_GROUP_COUNT
    ).map((pool) => ({
      ...pool,
      artists: sample(pool.artists, DISPLAY_ARTISTS_PER_GROUP),
    }));

    setDisplayGroups(selectedPools);

    const images: string[] = [];
    for (const group of selectedPools) {
      for (const artist of group.artists) {
        if (artist.image && !images.includes(artist.image)) {
          images.push(artist.image);
        }
        if (images.length >= 4) break;
      }
      if (images.length >= 4) break;
    }
    setCollageImages(images);
  }, []);

  useEffect(() => {
    if (recoPools.length === 0) return;
    rebuildDisplayGroups(recoPools);
  }, [rotationKey, recoPools, rebuildDisplayGroups]);

  useEffect(() => {
    if (recoPools.length === 0) return;
    const timer = window.setInterval(() => {
      setRotationKey((value) => value + 1);
    }, ROTATION_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [recoPools.length]);

  useEffect(() => {
    if (status === "loading") return;

    async function loadRecos() {
      const historyArtists = tasteSignature.recentArtists.slice(0, 4);
      const historyGenres = tasteSignature.recentGenres.slice(0, 4);

      let bookmarkSeeds: BookmarkSeed[] = [];
      if (session?.user) {
        try {
          const res = await fetch("/api/bookmarks");
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data)) {
              bookmarkSeeds = data.slice(0, 12).map((bookmark: {
                name: string;
                imageUrl?: string | null;
                genres?: string;
              }) => ({
                name: bookmark.name,
                imageUrl: bookmark.imageUrl || null,
                genres: parseBookmarkGenres(bookmark.genres),
              }));
            }
          }
        } catch {
          // non-critical
        }
      }

      setBookmarkSeeds(bookmarkSeeds);

      const bookmarkArtists = bookmarkSeeds.slice(0, 6).map((bookmark) => bookmark.name);
      const bookmarkGenres = [...new Set(
        bookmarkSeeds.flatMap((bookmark) => bookmark.genres.map((genre) => genre.toLowerCase()))
      )].slice(0, 6);

      const artistSeeds = [...new Set([...bookmarkArtists, ...historyArtists])].slice(0, 6);
      const genreSeeds = [...new Set([...bookmarkGenres, ...historyGenres])].slice(0, 4);
      const bannedNames = new Set(
        [...bookmarkArtists, ...historyArtists].map((name) => name.toLowerCase())
      );

      if (artistSeeds.length === 0 && genreSeeds.length === 0) {
        setRecoPools([]);
        setDisplayGroups([]);
        return;
      }

      setSeedNames([...artistSeeds.slice(0, 4), ...genreSeeds.slice(0, 2)]);
      setLoading(true);

      try {
        const artistPoolsPromise = Promise.all(
          artistSeeds.map(async (source) => {
            const sourceMeta = bookmarkSeeds.find((bookmark) => bookmark.name === source);
            const similar = await getSimilarArtists(source, 18, 70);

            const deduped = similar
              .filter((artist) => artist.name.toLowerCase() !== source.toLowerCase())
              .filter((artist) => !bannedNames.has(artist.name.toLowerCase()))
              .reduce<DiscoveryArtist[]>((acc, artist) => {
                if (acc.some((item) => item.name.toLowerCase() === artist.name.toLowerCase())) {
                  return acc;
                }
                acc.push(normalizeDiscoveryArtist(artist, artist.match));
                return acc;
              }, []);

            return {
              source,
              sourceImage: sourceMeta?.imageUrl || undefined,
              sourceType: "artist" as const,
              artists: deduped,
            };
          })
        );

        const genrePoolsPromise = Promise.all(
          genreSeeds.map(async (genre) => {
            const artists = await getTopTagArtists(genre, 16);
            const deduped = artists
              .filter((artist) => !bannedNames.has(artist.name.toLowerCase()))
              .reduce<DiscoveryArtist[]>((acc, artist, index) => {
                if (acc.some((item) => item.name.toLowerCase() === artist.name.toLowerCase())) {
                  return acc;
                }
                const normalized = normalizeDiscoveryArtist(artist, Math.max(0.3, 1 - index * 0.04));
                normalized.genres = normalized.genres.length > 0 ? normalized.genres : [genre];
                acc.push(normalized);
                return acc;
              }, []);

            return {
              source: genre,
              sourceType: "genre" as const,
              artists: deduped,
            };
          })
        );

        const combined = [...await artistPoolsPromise, ...await genrePoolsPromise]
          .filter((pool) => pool.artists.length > 0);

        setRecoPools(combined);
        setRotationKey((value) => value + 1);
      } finally {
        setLoading(false);
      }
    }

    if (history.length > 0 || session?.user) {
      loadRecos();
    }
  }, [history.length, session?.user, status, tasteSignature]);

  const handleStartMix = async () => {
    if (recoPools.length === 0 || isStarting) return;
    setIsStarting(true);
    setMixSaveState("idle");

    try {
      const mix = await buildGeneratedDiscoveryMix(
        {
          candidatePools: recoPools,
          tasteSeeds: {
            artists: [...new Set([
              ...bookmarkSeeds.map((bookmark) => bookmark.name),
              ...tasteSignature.recentArtists,
            ])].slice(0, 6),
            genres: [...new Set([
              ...bookmarkSeeds.flatMap((bookmark) => bookmark.genres.map((genre) => genre.toLowerCase())),
              ...tasteSignature.recentGenres,
            ])].slice(0, 6),
          },
          maxTracks: 12,
        },
        getArtistPreviewData
      );

      if (mix.tracks.length === 0) return;

      setGeneratedMix(mix);
      setRadioMode(false);
      playQueue(
        mix.tracks.map((track, index) => ({
          id: `${track.artist}-${track.title}-${index}`,
          url: track.url,
          title: track.title,
          artist: track.artist,
          coverUrl: track.coverUrl || undefined,
          genres: track.genres,
          videoId: track.videoId,
        })),
        0
      );
    } finally {
      setIsStarting(false);
    }
  };

  const handleSaveMix = async () => {
    if (!generatedMix || !session?.user || isSavingMix) return;
    setIsSavingMix(true);
    setMixSaveState("idle");

    try {
      const playlistRes = await fetch("/api/playlists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: generatedMix.name,
          description: generatedMix.description,
        }),
      });

      if (!playlistRes.ok) {
        throw new Error("Failed to create playlist");
      }

      const playlist = await playlistRes.json();

      for (const track of generatedMix.tracks) {
        const trackRes = await fetch(`/api/playlists/${playlist.id}/tracks`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: track.title,
            artist: track.artist,
            url: track.url,
            videoId: track.videoId,
            coverUrl: track.coverUrl,
            genres: track.genres,
          }),
        });

        if (!trackRes.ok) {
          throw new Error("Failed to save playlist tracks");
        }
      }

      setMixSaveState("saved");
    } catch {
      setMixSaveState("error");
    } finally {
      setIsSavingMix(false);
    }
  };

  const handlePlayArtist = async (artist: DiscoveryArtist) => {
    try {
      const data = await getArtistPreviewData(artist.name);
      const track = data.tracks.find((item) => item.videoId || item.preview);
      if (!track) return;

      playTrack({
        id: artist.name,
        url: track.preview || "",
        title: track.title,
        artist: artist.name,
        coverUrl: data.image || artist.image || undefined,
        genres: artist.genres,
        videoId: track.videoId || undefined,
      });
    } catch {
      // non-critical
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-[900px] mt-14 sm:mt-20">
        <div className="mb-5 border-b border-white/[0.06] pb-3">
          <div className="text-[10px] font-mono text-shift5-orange/80 uppercase tracking-[0.2em]">
            Discover_For_You
          </div>
          <div className="text-[11px] sm:text-[12px] font-mono text-shift5-muted uppercase tracking-wider mt-1">
            Calibrating_Signal...
          </div>
        </div>
        <div className="w-full h-[220px] sm:h-[240px] bg-white/[0.03] border-2 border-white/5 animate-pulse mb-8 sm:mb-10" />
        <div className="space-y-8">
          {[1, 2, 3].map((row) => (
            <div key={row}>
              <div className="h-4 w-48 bg-white/5 animate-pulse mb-3" />
              <div className="flex gap-3 -mx-5 sm:mx-0 px-5 sm:px-0 overflow-hidden">
                {[1, 2, 3, 4, 5].map((index) => (
                  <div key={index} className="shrink-0 w-[150px] sm:w-[170px]">
                    <div className="aspect-square bg-white/5 animate-pulse mb-3" />
                    <div className="h-3 w-3/4 bg-white/5 animate-pulse mb-1" />
                    <div className="h-2 w-1/2 bg-white/5 animate-pulse" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (displayGroups.length === 0) return null;

  return (
    <div className="w-full max-w-[900px] mt-14 sm:mt-20">
      <div className="mb-5 sm:mb-6 border-b border-white/[0.06] pb-3">
        <div className="text-[10px] font-mono text-shift5-orange/80 uppercase tracking-[0.2em]">
          Discover_For_You
        </div>
        <div className="text-[11px] sm:text-[12px] font-mono text-shift5-muted uppercase tracking-wider mt-1">
          Tuned to your atlas profile
        </div>
      </div>

      <DailyScanHero
        collageImages={collageImages}
        seedNames={seedNames}
        onStart={handleStartMix}
        isStarting={isStarting}
      />

      {generatedMix && (
        <div className="border border-white/[0.08] bg-white/[0.02] mb-8 sm:mb-10">
          <div className="px-4 sm:px-5 py-4 border-b border-white/[0.06] flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[10px] font-mono text-shift5-orange uppercase tracking-[0.2em]">
                Generated_Playlist
              </div>
              <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tighter text-white mt-1">
                {generatedMix.name}
              </h3>
              <p className="text-[10px] sm:text-[11px] font-mono text-shift5-muted uppercase tracking-wider mt-1">
                {generatedMix.tracks.length} tracks tuned from My Atlas and recent listening
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {session?.user && (
                <button
                  onClick={handleSaveMix}
                  disabled={isSavingMix || mixSaveState === "saved"}
                  className="px-4 py-2 border border-white/10 text-[10px] font-mono font-bold uppercase tracking-[0.18em] text-white hover:border-shift5-orange hover:text-shift5-orange active:border-shift5-orange active:text-shift5-orange transition-colors disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                >
                  {mixSaveState === "saved"
                    ? "Saved_To_My_Atlas"
                    : isSavingMix
                      ? "Saving..."
                      : "Save_Playlist"}
                </button>
              )}
              <button
                onClick={() => router.push("/my-atlas")}
                className="px-4 py-2 border border-white/10 text-[10px] font-mono font-bold uppercase tracking-[0.18em] text-white/80 hover:border-shift5-orange hover:text-shift5-orange active:border-shift5-orange active:text-shift5-orange transition-colors touch-manipulation"
              >
                Open_My_Atlas
              </button>
            </div>
          </div>

          <div className="px-4 sm:px-5 py-4 grid gap-4 sm:grid-cols-[1.2fr_1fr]">
            <div>
              <div className="text-[10px] font-mono text-white/40 uppercase tracking-widest mb-2">
                Why_This_Mix
              </div>
              <div className="space-y-2">
                {generatedMix.rationale.map((line) => (
                  <p
                    key={line}
                    className="text-[11px] sm:text-[12px] font-mono text-shift5-muted uppercase tracking-wide"
                  >
                    {line}
                  </p>
                ))}
                {mixSaveState === "error" && (
                  <p className="text-[10px] font-mono text-shift5-orange uppercase tracking-widest">
                    Save failed. Try again.
                  </p>
                )}
                {!session?.user && (
                  <p className="text-[10px] font-mono text-white/35 uppercase tracking-widest">
                    Sign in to save this mix to My Atlas
                  </p>
                )}
              </div>
            </div>

            <div>
              <div className="text-[10px] font-mono text-white/40 uppercase tracking-widest mb-2">
                Track_Run
              </div>
              <div className="space-y-2">
                {generatedMix.tracks.slice(0, 6).map((track, index) => (
                  <div
                    key={`${track.artist}-${track.title}-${index}`}
                    className="flex items-start justify-between gap-3 text-[11px] font-mono uppercase tracking-wide"
                  >
                    <div className="min-w-0">
                      <div className="text-white truncate">
                        {index + 1}. {track.title}
                      </div>
                      <div className="text-shift5-muted truncate mt-0.5">
                        {track.artist} · {track.sourceLabel}
                      </div>
                    </div>
                    <div className="shrink-0 text-[9px] text-white/30 tracking-widest">
                      {track.sourceType}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-8 sm:space-y-10">
        {displayGroups.map((group) => (
          <div key={`${group.sourceType}-${group.source}`}>
            <div className="flex items-end justify-between gap-3 mb-3 sm:mb-4">
              <div className="min-w-0 flex-1">
                <div className="text-[10px] font-mono text-shift5-muted uppercase tracking-widest flex items-center gap-1.5">
                  <span className="text-shift5-orange">›</span>
                  {group.sourceType === "genre" ? "Because_You_Like_This_Genre" : "Because_You_Saved"}
                </div>
                <h3
                  onClick={() =>
                    router.push(
                      group.sourceType === "genre"
                        ? `/genre/${encodeURIComponent(group.source)}`
                        : `/artist/${encodeURIComponent(group.source)}`
                    )
                  }
                  className="text-lg sm:text-2xl font-black uppercase tracking-tighter truncate text-white hover:text-shift5-orange active:text-shift5-orange transition-colors cursor-pointer mt-1 touch-manipulation"
                >
                  {group.source}
                </h3>
              </div>
              <button
                onClick={() =>
                  router.push(
                    group.sourceType === "genre"
                      ? `/genre/${encodeURIComponent(group.source)}`
                      : `/artist/${encodeURIComponent(group.source)}`
                  )
                }
                className="shrink-0 text-[9px] font-mono text-white/30 hover:text-shift5-orange active:text-shift5-orange uppercase tracking-widest transition-colors touch-manipulation px-1"
              >
                View →
              </button>
            </div>

            <div
              className="flex gap-3 sm:gap-4 overflow-x-auto no-scrollbar pb-2 -mx-5 sm:mx-0 px-5 sm:px-0 snap-x snap-mandatory sm:snap-none scroll-smooth"
              style={{
                WebkitOverflowScrolling: "touch",
                touchAction: "pan-x",
                scrollPaddingLeft: "20px",
              }}
            >
              {group.artists.map((artist) => {
                const isActive = isPlaying && currentTrack?.artist === artist.name;
                return (
                  <DiscoveryCard
                    key={`${group.source}-${artist.name}`}
                    artist={artist}
                    onOpen={() => router.push(`/artist/${encodeURIComponent(artist.name)}`)}
                    onPlay={(event) => {
                      event.stopPropagation();
                      handlePlayArtist(artist);
                    }}
                    isActive={isActive}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
