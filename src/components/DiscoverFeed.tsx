"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  getSimilarArtists,
  getArtistPreviewData,
  type SimilarArtistResult,
} from "@/lib/api";
import { useAudio } from "@/contexts/AudioContext";
import ArtistInitials from "./ArtistInitials";

interface RecoGroup {
  source: string;
  sourceImage?: string;
  artists: SimilarArtistResult[];
}

function DiscoveryCard({
  artist,
  onOpen,
  onPlay,
  isActive,
}: {
  artist: SimilarArtistResult;
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

        {/* Gradient base overlay (always subtle) */}
        <div className="absolute inset-0 bg-gradient-to-t from-shift5-dark/60 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />

        {/* Active indicator ribbon */}
        {isActive && (
          <div className="absolute top-2 left-2 px-2 py-0.5 bg-shift5-orange text-white text-[8px] font-mono font-bold uppercase tracking-widest">
            ● Signal
          </div>
        )}

        {/* Play button */}
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
      {/* 2x2 image collage */}
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

      {/* Orange accent gradient + dark veil */}
      <div className="absolute inset-0 bg-gradient-to-br from-shift5-orange/25 via-shift5-dark/80 to-shift5-dark/95" />
      <div className="absolute inset-0 bg-gradient-to-t from-shift5-dark via-shift5-dark/60 to-transparent" />

      {/* Subtle grid texture */}
      <div className="absolute inset-0 opacity-[0.04] bg-[linear-gradient(to_right,#888_1px,transparent_1px),linear-gradient(to_bottom,#888_1px,transparent_1px)] bg-[size:32px_32px]" />

      {/* Content */}
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
            Tuned for {seedNames.slice(0, 2).join(" · ")}
            {seedNames.length > 2 && " · +more"}
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
  const { history, currentTrack, isPlaying, playTrack, setRadioMode } = useAudio();
  const router = useRouter();
  const [recoGroups, setRecoGroups] = useState<RecoGroup[]>([]);
  const [collageImages, setCollageImages] = useState<string[]>([]);
  const [seedNames, setSeedNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const initialized = useRef(false);

  useEffect(() => {
    if (status === "loading") return;
    if (initialized.current) return;
    initialized.current = true;

    async function loadRecos() {
      const historyArtists = [
        ...new Set(history.slice(0, 15).map((h) => h.track.artist)),
      ].slice(0, 2);

      let bookmarkArtists: string[] = [];
      if (session?.user) {
        try {
          const res = await fetch("/api/bookmarks");
          const data = await res.json();
          if (Array.isArray(data)) {
            bookmarkArtists = (data as { name: string }[])
              .slice(0, 3)
              .map((b) => b.name);
          }
        } catch {
          // non-critical
        }
      }

      const allSeeds = [
        ...new Set([...bookmarkArtists, ...historyArtists]),
      ].slice(0, 3);

      if (allSeeds.length === 0) return;
      setSeedNames(allSeeds);

      setLoading(true);
      try {
        const groups = await Promise.all(
          allSeeds.map(async (source) => {
            const similar = await getSimilarArtists(source, 10, 60);
            const filtered = similar
              .filter((a) => !allSeeds.includes(a.name))
              .slice(0, 8);
            return { source, artists: filtered };
          })
        );
        const validGroups = groups.filter((g) => g.artists.length > 0);
        setRecoGroups(validGroups);

        // Build collage from first image of each row + extras
        const images: string[] = [];
        for (const g of validGroups) {
          for (const a of g.artists) {
            if (a.image && !images.includes(a.image)) {
              images.push(a.image);
              if (images.length >= 4) break;
            }
          }
          if (images.length >= 4) break;
        }
        setCollageImages(images);
      } finally {
        setLoading(false);
      }
    }

    if (history.length > 0 || session?.user) {
      loadRecos();
    }
  }, [status]);

  const handleStartMix = async () => {
    if (recoGroups.length === 0 || isStarting) return;
    setIsStarting(true);
    try {
      // Flatten all recommendations and pick a track-playable one
      const pool = recoGroups.flatMap((g) => g.artists);
      const pick = pool[Math.floor(Math.random() * Math.min(pool.length, 6))];
      if (!pick) return;
      const data = await getArtistPreviewData(pick.name);
      const track = data.tracks.find((t) => t.videoId || t.preview);
      if (!track) return;
      setRadioMode(true);
      playTrack({
        id: pick.name,
        url: track.preview || "",
        title: track.title,
        artist: pick.name,
        coverUrl: data.image || pick.image || undefined,
        genres: pick.genres,
        videoId: track.videoId || undefined,
      });
    } finally {
      setIsStarting(false);
    }
  };

  const handlePlayArtist = async (a: SimilarArtistResult) => {
    try {
      const data = await getArtistPreviewData(a.name);
      const track = data.tracks.find((t) => t.videoId || t.preview);
      if (!track) return;
      playTrack({
        id: a.name,
        url: track.preview || "",
        title: track.title,
        artist: a.name,
        coverUrl: data.image || a.image || undefined,
        genres: a.genres,
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
          {[1, 2].map((r) => (
            <div key={r}>
              <div className="h-4 w-48 bg-white/5 animate-pulse mb-3" />
              <div className="flex gap-3 -mx-5 sm:mx-0 px-5 sm:px-0 overflow-hidden">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="shrink-0 w-[150px] sm:w-[170px]">
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

  if (recoGroups.length === 0) return null;

  return (
    <div className="w-full max-w-[900px] mt-14 sm:mt-20">
      <div className="mb-5 sm:mb-6 border-b border-white/[0.06] pb-3">
        <div className="text-[10px] font-mono text-shift5-orange/80 uppercase tracking-[0.2em]">
          Discover_For_You
        </div>
        <div className="text-[11px] sm:text-[12px] font-mono text-shift5-muted uppercase tracking-wider mt-1">
          Tuned to your signal profile
        </div>
      </div>

      {/* Hero Daily Scan */}
      <DailyScanHero
        collageImages={collageImages}
        seedNames={seedNames}
        onStart={handleStartMix}
        isStarting={isStarting}
      />

      {/* Recommendation rows */}
      <div className="space-y-8 sm:space-y-10">
        {recoGroups.map((group) => (
          <div key={group.source}>
            <div className="flex items-end justify-between gap-3 mb-3 sm:mb-4">
              <div className="min-w-0 flex-1">
                <div className="text-[10px] font-mono text-shift5-muted uppercase tracking-widest flex items-center gap-1.5">
                  <span className="text-shift5-orange">›</span>
                  Because_You_Explored
                </div>
                <h3
                  onClick={() =>
                    router.push(`/artist/${encodeURIComponent(group.source)}`)
                  }
                  className="text-lg sm:text-2xl font-black uppercase tracking-tighter truncate text-white hover:text-shift5-orange active:text-shift5-orange transition-colors cursor-pointer mt-1 touch-manipulation"
                >
                  {group.source}
                </h3>
              </div>
              <button
                onClick={() =>
                  router.push(`/artist/${encodeURIComponent(group.source)}`)
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
              {group.artists.map((a) => {
                const isActive = isPlaying && currentTrack?.artist === a.name;
                return (
                  <DiscoveryCard
                    key={a.name}
                    artist={a}
                    onOpen={() =>
                      router.push(`/artist/${encodeURIComponent(a.name)}`)
                    }
                    onPlay={(e) => {
                      e.stopPropagation();
                      handlePlayArtist(a);
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
