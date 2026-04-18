"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useAudio } from "@/contexts/AudioContext";
import {
  getArtistPreviewData,
  getTopGenres,
  getGenreArtists,
} from "@/lib/api";
import ArtistInitials from "./ArtistInitials";

interface RotationArtist {
  id: string;
  name: string;
  image?: string | null;
  genres: string[];
  source: "atlas" | "trending";
}

interface BookmarkRaw {
  id: string | number;
  name: string;
  imageUrl?: string | null;
  genres?: string;
}

function parseGenres(raw: unknown): string[] {
  if (typeof raw !== "string") return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((v): v is string => typeof v === "string")
      : [];
  } catch {
    return [];
  }
}

function shuffle<T>(items: T[]): T[] {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

const DISPLAY_COUNT = 12;

export default function YourAtlasRotation() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { playTrack, currentTrack, isPlaying } = useAudio();

  const [artists, setArtists] = useState<RotationArtist[]>([]);
  const [mode, setMode] = useState<"atlas" | "trending" | "loading" | "empty">("loading");
  const [rotationKey, setRotationKey] = useState(0);

  useEffect(() => {
    if (status === "loading") return;
    let cancelled = false;

    async function load() {
      if (session?.user) {
        try {
          const res = await fetch("/api/bookmarks");
          if (res.ok) {
            const data: BookmarkRaw[] = await res.json();
            if (Array.isArray(data) && data.length > 0) {
              const mapped: RotationArtist[] = data.map((b) => ({
                id: String(b.id),
                name: b.name,
                image: b.imageUrl || null,
                genres: parseGenres(b.genres),
                source: "atlas",
              }));
              if (!cancelled) {
                setArtists(mapped);
                setMode("atlas");
              }
              return;
            }
          }
        } catch {
          // fall through to trending
        }
      }

      try {
        const genres = await getTopGenres(6);
        const batches = await Promise.all(
          genres.slice(0, 6).map(async (g) => {
            const list = await getGenreArtists(g.name, 4);
            return list.map((a) => ({
              id: a.mbid || `${g.name}-${a.name}`,
              name: a.name,
              image: a.image || null,
              genres: [g.name],
              source: "trending" as const,
            }));
          })
        );
        const flat = batches.flat();
        const deduped: RotationArtist[] = [];
        const seen = new Set<string>();
        for (const a of flat) {
          const key = a.name.toLowerCase();
          if (seen.has(key)) continue;
          seen.add(key);
          deduped.push(a);
        }
        if (!cancelled) {
          setArtists(deduped);
          setMode(deduped.length > 0 ? "trending" : "empty");
        }
      } catch {
        if (!cancelled) setMode("empty");
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [session?.user, status]);

  useEffect(() => {
    if (mode !== "atlas" && mode !== "trending") return;
    const timer = window.setInterval(() => {
      setRotationKey((n) => n + 1);
    }, 60_000);
    return () => window.clearInterval(timer);
  }, [mode]);

  const display = useMemo(() => {
    if (artists.length === 0) return [];
    return shuffle(artists).slice(0, DISPLAY_COUNT);
    // rotationKey is intentionally referenced to re-shuffle
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [artists, rotationKey]);

  const handlePlay = async (artist: RotationArtist) => {
    try {
      const data = await getArtistPreviewData(artist.name);
      const track = data.tracks.find((t) => t.videoId || t.preview);
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

  if (mode === "loading" || mode === "empty") return null;
  if (display.length === 0) return null;

  const isAtlas = mode === "atlas";

  return (
    <div className="w-full max-w-[900px] mt-14 sm:mt-20">
      <div className="mb-5 sm:mb-6 border-b border-white/[0.06] pb-3 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[10px] font-mono text-shift5-orange/80 uppercase tracking-[0.2em]">
            {isAtlas ? "Your_Atlas" : "Trending_Signals"}
          </div>
          <div className="text-[11px] sm:text-[12px] font-mono text-shift5-muted uppercase tracking-wider mt-1">
            {isAtlas ? "On rotation — shuffled from your saved artists" : "Popular across the constellation right now"}
          </div>
        </div>
        <button
          onClick={() => setRotationKey((n) => n + 1)}
          className="shrink-0 text-[9px] font-mono text-shift5-muted hover:text-shift5-orange active:text-shift5-orange uppercase tracking-widest transition-colors touch-manipulation flex items-center gap-1.5 px-2 py-1 border border-white/10 hover:border-shift5-orange"
          aria-label="Reshuffle"
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3" />
          </svg>
          Reshuffle
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
        {display.map((artist) => {
          const isActive =
            isPlaying && (currentTrack?.id === artist.name || currentTrack?.artist === artist.name);
          return (
            <div
              key={`${artist.id}-${rotationKey}`}
              onClick={() => router.push(`/artist/${encodeURIComponent(artist.name)}`)}
              className="shrink-0 w-[150px] sm:w-[170px] cursor-pointer group snap-start touch-manipulation"
            >
              <div
                className={`relative aspect-square bg-shift5-surface overflow-hidden mb-3 border transition-all duration-300 ${
                  isActive
                    ? "border-shift5-orange shadow-[0_0_20px_rgba(255,88,65,0.25)]"
                    : "border-white/[0.06] group-hover:border-white/20 group-active:border-white/30"
                }`}
              >
                {artist.image ? (
                  <Image
                    src={artist.image}
                    alt={artist.name}
                    fill
                    sizes="(max-width: 640px) 150px, 170px"
                    className={`object-cover transition-all duration-700 ${
                      isActive
                        ? ""
                        : "grayscale group-hover:grayscale-0 group-active:grayscale-0 scale-105 group-hover:scale-100 group-active:scale-100"
                    }`}
                    unoptimized
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ArtistInitials name={artist.name} size={56} />
                  </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-shift5-dark/60 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />

                {isAtlas && (
                  <div className="absolute top-2 left-2 px-2 py-0.5 bg-shift5-orange/90 text-white text-[8px] font-mono font-bold uppercase tracking-widest">
                    Saved
                  </div>
                )}

                {isActive && (
                  <div className="absolute top-2 right-2 px-2 py-0.5 bg-white text-shift5-dark text-[8px] font-mono font-bold uppercase tracking-widest flex items-center gap-1">
                    <span className="w-1 h-1 bg-shift5-orange animate-pulse rounded-full" />
                    Playing
                  </div>
                )}

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePlay(artist);
                  }}
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
                    isActive ? "text-shift5-orange" : "text-white group-hover:text-shift5-orange"
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
        })}
      </div>
    </div>
  );
}
