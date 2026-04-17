"use client";

import Image from "next/image";
import { useAudio } from "@/contexts/AudioContext";
import ArtistInitials from "./ArtistInitials";

export default function RecentlyPlayed() {
  const { history, playTrack, currentTrack, isPlaying } = useAudio();

  if (history.length === 0) return null;

  const recent = history.slice(0, 8);

  return (
    <div className="w-full max-w-[800px] mt-14 sm:mt-16">
      <div className="flex items-center justify-between mb-4 sm:mb-5 border-b border-white/5 pb-2">
        <div className="text-[10px] font-mono text-white/30 uppercase tracking-[0.2em]">
          Recent_Signals
        </div>
        <span className="text-[9px] font-mono text-white/10 uppercase tracking-widest">
          {recent.length.toString().padStart(2, "0")}_Entries
        </span>
      </div>
      <div
        className="flex gap-2.5 sm:gap-3 overflow-x-auto no-scrollbar pb-2 -mx-5 sm:mx-0 px-5 sm:px-0 snap-x snap-mandatory sm:snap-none scroll-smooth"
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
              className={`shrink-0 w-[128px] sm:w-[110px] cursor-pointer group border transition-all duration-300 snap-start touch-manipulation active:scale-[0.97] ${
                isActive
                  ? "border-shift5-orange shadow-[0_0_12px_rgba(255,88,65,0.2)]"
                  : "border-white/5 hover:border-white/20 active:border-white/30"
              }`}
            >
              <div className="relative aspect-square bg-white/5 overflow-hidden">
                {entry.track.coverUrl ? (
                  <Image
                    src={entry.track.coverUrl}
                    alt={entry.track.title}
                    fill
                    sizes="128px"
                    className={`object-cover transition-all duration-500 ${isActive ? "" : "grayscale group-hover:grayscale-0"}`}
                    unoptimized
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ArtistInitials name={entry.track.artist} size={40} />
                  </div>
                )}
                <div
                  className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${
                    isActive
                      ? "bg-shift5-orange/10 opacity-100"
                      : "bg-shift5-dark/60 opacity-0 group-hover:opacity-100 group-active:opacity-100"
                  }`}
                >
                  {isActive ? (
                    <span className="text-shift5-orange text-[11px] font-mono animate-pulse">▶▶</span>
                  ) : (
                    <span className="text-white text-[12px] font-mono">▶</span>
                  )}
                </div>
              </div>
              <div className="p-2 sm:p-2 border-t border-white/5">
                <div className="text-[9px] font-mono text-white/20 uppercase truncate">
                  {entry.track.artist}
                </div>
                <div
                  className={`text-[10px] sm:text-[9px] font-mono uppercase truncate mt-0.5 transition-colors ${
                    isActive ? "text-shift5-orange" : "text-white/50 group-hover:text-white"
                  }`}
                >
                  {entry.track.title}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
