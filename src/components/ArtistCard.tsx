"use client";

import { useState } from "react";
import type { SimilarArtist } from "@/data/mock";
import ArtistInitials from "./ArtistInitials";
import GenreTag from "./GenreTag";
import SimilarityBar from "./SimilarityBar";
import PlayButton from "./PlayButton";

export default function ArtistCard({
  artist,
  index,
  onExplore,
  isHighlighted,
  onHover,
}: {
  artist: SimilarArtist;
  index: number;
  onExplore: (id: string) => void;
  isHighlighted: boolean;
  onHover: (id: string | null) => void;
}) {
  const [hovered, setHovered] = useState(false);

  const bg = isHighlighted ? "rgba(255, 88, 65, 0.05)" : hovered ? "rgba(255, 255, 255, 0.02)" : "transparent";
  const borderColor = isHighlighted ? "#ff5841" : hovered ? "rgba(255, 255, 255, 0.2)" : "rgba(255, 255, 255, 0.05)";

  return (
    <div
      onMouseEnter={() => {
        setHovered(true);
        onHover(artist.id);
      }}
      onMouseLeave={() => {
        setHovered(false);
        onHover(null);
      }}
      className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-6 border border-b border-transparent transition-all duration-300 cursor-default p-4 sm:px-6 sm:py-5 group"
      style={{
        backgroundColor: bg,
        borderColor: borderColor,
        animation: `fadeSlideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) ${index * 0.03}s both`,
      }}
    >
      <div className="flex items-start gap-4 sm:gap-6 flex-1 min-w-0">
        <div className={`relative transition-all duration-500 ${hovered ? 'scale-105 contrast-125' : 'grayscale contrast-75 opacity-60'}`}>
          <ArtistInitials name={artist.name} size={52} />
          {isHighlighted && (
            <div className="absolute -inset-1 border border-shift5-orange/50 animate-pulse pointer-events-none" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <span
              onClick={() => onExplore(artist.id)}
              className="text-[14px] font-bold text-white cursor-pointer hover:text-shift5-orange font-mono uppercase tracking-wider transition-colors"
            >
              {artist.name}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-white/20 uppercase tracking-widest">Confidence:</span>
              <SimilarityBar value={artist.similarity} />
            </div>
          </div>
          <div className="mb-3 flex flex-wrap gap-1">
            {artist.genres.slice(0, 3).map((g) => (
              <GenreTag key={g} genre={g} />
            ))}
          </div>
          <p className="text-[11px] font-mono text-white/40 m-0 leading-relaxed uppercase tracking-tight max-w-2xl">
            <span className="text-shift5-orange/40 mr-2 select-none">// REASON:</span>
            {artist.reason}
          </p>
        </div>
      </div>
      <div className="flex gap-2 items-center sm:items-start sm:pt-1 ml-[68px] sm:ml-0">
        <PlayButton small />
        <button
          onClick={() => onExplore(artist.id)}
          className="text-[10px] font-mono font-bold border border-white/10 bg-white/5 text-white/70 cursor-pointer whitespace-nowrap transition-all duration-200 hover:bg-shift5-orange hover:text-white hover:border-shift5-orange uppercase tracking-[0.2em] px-4 py-2"
        >
          Explore_Node
        </button>
      </div>
    </div>
  );
}
