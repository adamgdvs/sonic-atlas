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

  const bg = isHighlighted ? "#F8F8FA" : hovered ? "#FCFCFC" : "#FFF";

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
      className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-3.5 border-b border-[#F0F0F0] cursor-default p-4 sm:px-5 sm:py-4"
      style={{
        backgroundColor: bg,
        transition: "background-color 0.15s ease",
        animation: `fadeSlideIn 0.3s ease ${index * 0.04}s both`,
      }}
    >
      <div className="flex items-center gap-3 sm:gap-3.5 flex-1 min-w-0">
        <ArtistInitials name={artist.name} size={44} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5 mb-1 flex-wrap">
            <span
              onClick={() => onExplore(artist.id)}
              className="text-[15px] font-semibold text-[#1D1D1F] cursor-pointer hover:underline"
              style={{ letterSpacing: "-0.01em" }}
            >
              {artist.name}
            </span>
            <SimilarityBar value={artist.similarity} />
          </div>
          <div className="mb-1.5">
            {artist.genres.slice(0, 5).map((g) => (
              <GenreTag key={g} genre={g} />
            ))}
          </div>
          <p className="text-xs text-[#9CA3AF] m-0 leading-snug">
            {artist.reason}
          </p>
        </div>
      </div>
      <div className="flex gap-1.5 items-center sm:items-start sm:pt-0.5 ml-[58px] sm:ml-0">
        <PlayButton small />
        <button
          onClick={() => onExplore(artist.id)}
          className="text-[11px] font-semibold border border-[#E5E5E5] bg-[#FAFAFA] text-[#1D1D1F] cursor-pointer whitespace-nowrap transition-all duration-150 hover:bg-[#1D1D1F] hover:text-white hover:border-[#1D1D1F]"
          style={{
            padding: "5px 12px",
            letterSpacing: "0.03em",
          }}
        >
          Explore →
        </button>
      </div>
    </div>
  );
}
