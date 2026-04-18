"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAudio } from "@/contexts/AudioContext";
import {
  getTopGenres,
  getGenreArtists,
  getArtistPreviewData,
  type GenreInfo,
} from "@/lib/api";
import { getGenreColor } from "@/lib/utils";

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace("#", "");
  const bigint = parseInt(clean.length === 3
    ? clean.split("").map((c) => c + c).join("")
    : clean, 16);
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255,
  };
}

export default function GenreCards({ limit = 16 }: { limit?: number }) {
  const router = useRouter();
  const [genres, setGenres] = useState<GenreInfo[]>([]);
  const [loadingPlay, setLoadingPlay] = useState<string | null>(null);
  const { playTrack, currentTrack, isPlaying } = useAudio();

  useEffect(() => {
    getTopGenres(limit).then(setGenres);
  }, [limit]);

  const handlePlay = async (genreName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    const isThisPlaying = currentTrack?.id === genreName;
    if (isThisPlaying) {
      playTrack(currentTrack);
      return;
    }

    setLoadingPlay(genreName);
    try {
      const artists = await getGenreArtists(genreName, 6);
      if (!artists || artists.length === 0) return;
      const pick = artists[Math.floor(Math.random() * artists.length)];
      const data = await getArtistPreviewData(pick.name);
      const track = data.tracks.find((t) => t.videoId || t.preview);
      if (!track) return;
      playTrack({
        id: genreName,
        url: track.preview || "",
        title: track.title,
        artist: pick.name,
        coverUrl: data.image || undefined,
        genres: [genreName],
        videoId: track.videoId || undefined,
      });
    } catch {
      // non-critical
    } finally {
      setLoadingPlay(null);
    }
  };

  if (genres.length === 0) return null;

  return (
    <div className="w-full max-w-[900px] mt-16 sm:mt-24">
      <div className="flex items-end justify-between mb-6 sm:mb-8 border-b border-white/[0.06] pb-3 gap-3">
        <div className="min-w-0">
          <div className="text-[10px] font-mono text-shift5-orange/80 uppercase tracking-[0.2em]">
            Hot_Genre_Signals
          </div>
          <div className="text-[11px] sm:text-[12px] font-mono text-shift5-muted uppercase tracking-wider mt-1">
            Cross-pollinated frequencies — tap to enter
          </div>
        </div>
        <Link
          href="/genres"
          className="shrink-0 text-[10px] font-mono text-shift5-muted hover:text-shift5-orange active:text-shift5-orange transition-colors no-underline uppercase tracking-[0.1em] flex items-center gap-1"
        >
          Full_Nexus <span>→</span>
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
        {genres.slice(0, limit).map((genre) => {
          const color = getGenreColor(genre.name);
          const { r, g, b } = hexToRgb(color);
          const isThisPlaying = isPlaying && currentTrack?.id === genre.name;
          const isLoading = loadingPlay === genre.name;

          return (
            <div
              key={genre.name}
              onClick={() => router.push(`/genre/${encodeURIComponent(genre.name)}`)}
              className="group relative aspect-[4/3] overflow-hidden cursor-pointer border-2 border-white/[0.06] hover:border-white/30 transition-all duration-300 bg-shift5-surface touch-manipulation"
              style={{
                background: `linear-gradient(135deg, rgba(${r}, ${g}, ${b}, 0.85) 0%, rgba(${r}, ${g}, ${b}, 0.35) 50%, rgba(18, 18, 18, 1) 100%)`,
              }}
            >
              {/* Halftone texture */}
              <div
                className="absolute inset-0 opacity-[0.08] mix-blend-overlay"
                style={{
                  backgroundImage: `radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)`,
                  backgroundSize: "12px 12px",
                }}
              />

              {/* Corner accent bracket */}
              <div
                className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 transition-all duration-300 group-hover:w-4 group-hover:h-4"
                style={{ borderColor: color }}
              />

              {/* Content */}
              <div className="relative z-10 h-full flex flex-col justify-between p-3 sm:p-4">
                <div>
                  <div className="text-[8px] sm:text-[9px] font-mono text-white/50 uppercase tracking-[0.2em]">
                    Channel
                  </div>
                  <div className="text-[8px] font-mono text-white/30 uppercase mt-0.5 tracking-widest">
                    {genre.count ? `${genre.count} signals` : "Live_Scan"}
                  </div>
                </div>

                <div>
                  <div className="text-lg sm:text-2xl font-black uppercase tracking-tighter leading-[0.9] text-white line-clamp-2">
                    {genre.name}
                  </div>
                </div>
              </div>

              {/* Play button */}
              <button
                onClick={(e) => handlePlay(genre.name, e)}
                disabled={isLoading}
                className={`absolute bottom-2.5 right-2.5 w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center transition-all duration-300 touch-manipulation z-20 ${
                  isThisPlaying
                    ? "opacity-100 bg-white text-shift5-orange"
                    : "opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 group-active:opacity-100 group-active:translate-y-0 bg-shift5-orange text-white hover:bg-white hover:text-shift5-orange"
                } shadow-[0_4px_14px_rgba(0,0,0,0.4)] disabled:opacity-60`}
                aria-label={`Play ${genre.name}`}
              >
                {isLoading ? (
                  <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : isThisPlaying ? (
                  <svg width="11" height="11" viewBox="0 0 12 12" fill="currentColor">
                    <rect x="2" y="1" width="3" height="10" />
                    <rect x="7" y="1" width="3" height="10" />
                  </svg>
                ) : (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                    <polygon points="3,0 12,6 3,12" />
                  </svg>
                )}
              </button>

              {/* Playing pulse indicator */}
              {isThisPlaying && (
                <div
                  className="absolute top-2 left-2 px-2 py-0.5 text-[8px] font-mono font-bold uppercase tracking-widest flex items-center gap-1 bg-white text-shift5-dark"
                >
                  <span className="w-1 h-1 bg-shift5-orange animate-pulse rounded-full" />
                  Live
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
