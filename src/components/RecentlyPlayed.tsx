"use client";

import Image from "next/image";
import { useAudio } from "@/contexts/AudioContext";
import ArtistInitials from "./ArtistInitials";

export default function RecentlyPlayed() {
  const { history, playTrack, currentTrack, isPlaying } = useAudio();

  if (history.length === 0) return null;

  const recent = history.slice(0, 8);

  return (
    <div className="w-full max-w-[900px] mt-14 sm:mt-20">
      <div className="mb-5 sm:mb-6 border-b border-white/[0.06] pb-3 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[10px] font-mono text-shift5-orange/80 uppercase tracking-[0.2em]">
            Recent_Signals
          </div>
          <div className="text-[11px] sm:text-[12px] font-mono text-shift5-muted uppercase tracking-wider mt-1">
            Jump back in
          </div>
        </div>
        <span className="shrink-0 text-[9px] font-mono text-shift5-subtle uppercase tracking-widest">
          {recent.length.toString().padStart(2, "0")}_Entries
        </span>
      </div>

      <div
        className="flex gap-3 sm:gap-4 overflow-x-auto no-scrollbar pb-2 -mx-5 sm:mx-0 px-5 sm:px-0 snap-x snap-mandatory sm:snap-none scroll-smooth"
        style={{
          WebkitOverflowScrolling: "touch",
          touchAction: "pan-x",
          scrollPaddingLeft: "20px",
        }}
      >
        {recent.map((entry, i) => {
          const isActive =
            isPlaying &&
            (entry.track.videoId
              ? currentTrack?.videoId === entry.track.videoId
              : currentTrack?.url === entry.track.url);
          return (
            <div
              key={i}
              onClick={() => playTrack(entry.track)}
              className="shrink-0 w-[150px] sm:w-[170px] cursor-pointer group snap-start touch-manipulation"
            >
              <div
                className={`relative aspect-square bg-shift5-surface overflow-hidden mb-3 border transition-all duration-300 ${
                  isActive
                    ? "border-shift5-orange shadow-[0_0_20px_rgba(255,88,65,0.25)]"
                    : "border-white/[0.06] group-hover:border-white/20 group-active:border-white/30"
                }`}
              >
                {entry.track.coverUrl ? (
                  <Image
                    src={entry.track.coverUrl}
                    alt={entry.track.title}
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
                    <ArtistInitials name={entry.track.artist} size={56} />
                  </div>
                )}

                {/* Subtle base gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-shift5-dark/60 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />

                {/* Playing indicator */}
                {isActive && (
                  <div className="absolute top-2 left-2 px-2 py-0.5 bg-shift5-orange text-white text-[8px] font-mono font-bold uppercase tracking-widest flex items-center gap-1">
                    <span className="w-1 h-1 bg-white animate-pulse rounded-full" />
                    Playing
                  </div>
                )}

                {/* Play button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    playTrack(entry.track);
                  }}
                  className="absolute bottom-2.5 right-2.5 w-11 h-11 bg-shift5-orange text-white border-2 border-shift5-orange flex items-center justify-center opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 group-active:opacity-100 group-active:translate-y-0 transition-all duration-300 shadow-[0_4px_20px_rgba(255,88,65,0.5)] hover:bg-white hover:text-shift5-orange touch-manipulation"
                  aria-label={`Play ${entry.track.title}`}
                >
                  {isActive ? (
                    <svg width={11} height={11} viewBox="0 0 12 12" fill="currentColor">
                      <rect x="2" y="1" width="3" height="10" />
                      <rect x="7" y="1" width="3" height="10" />
                    </svg>
                  ) : (
                    <svg width={12} height={12} viewBox="0 0 12 12" fill="currentColor">
                      <polygon points="3,0 12,6 3,12" />
                    </svg>
                  )}
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
                  {entry.track.title}
                </div>
                <div className="text-[10px] font-mono text-shift5-muted uppercase truncate mt-1 tracking-wider">
                  {entry.track.artist}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
