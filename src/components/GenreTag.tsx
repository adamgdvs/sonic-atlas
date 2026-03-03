"use client";

import Link from "next/link";
import { getGenreColor } from "@/lib/utils";

export default function GenreTag({
  genre,
  onClick,
  active,
  href,
  onPlayClick,
  isPlaying,
  isAuthoritative,
}: {
  genre: string;
  onClick?: (genre: string) => void;
  active?: boolean;
  href?: string;
  onPlayClick?: (genre: string) => void;
  isPlaying?: boolean;
  isAuthoritative?: boolean;
}) {
  const resolvedHref = href || `/genre/${encodeURIComponent(genre)}`;

  const style = {
    padding: "6px 12px",
    color: active || isPlaying || isAuthoritative ? "#FFF" : "rgba(255, 255, 255, 0.5)",
    border: isAuthoritative ? "1px solid rgba(255, 88, 65, 0.5)" : (active || isPlaying ? "1px solid #ff5841" : "1px solid #444"),
    backgroundColor: active || isPlaying ? "#ff5841" : (isAuthoritative ? "rgba(255, 88, 65, 0.05)" : "rgba(255, 255, 255, 0.02)"),
    fontSize: "10px",
    letterSpacing: "0.1em",
    fontWeight: "600",
  };


  const wrapperClass = `group inline-flex items-center font-mono mr-2 mb-2 transition-all duration-300 uppercase ${onClick || onPlayClick ? "cursor-pointer hover:border-white/50 hover:bg-white/5 hover:text-white" : ""} ${active || isPlaying ? "shadow-[0_0_20px_rgba(255,88,65,0.3)] contrast-125" : ""}`;


  // If we have an onPlayClick handler, we split the button into a "play" text region and a "navigate" icon
  if (onPlayClick) {
    return (
      <div className={wrapperClass} style={style}>
        <span
          onClick={() => onPlayClick(genre)}
          className="flex items-center gap-2"
        >
          {isPlaying ? (
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
          ) : isAuthoritative ? (
            <span className="w-1.5 h-1.5 rounded-full bg-shift5-orange shadow-[0_0_8px_rgba(255,88,65,0.8)]" />
          ) : (
            <span className="w-1 h-1 bg-white/20 rounded-full group-hover:bg-shift5-orange transition-colors" />
          )}
          {genre}
        </span>

        {resolvedHref && (
          <Link
            href={resolvedHref}
            className="opacity-40 hover:opacity-100 ml-2 pl-2 border-l border-white/10 cursor-pointer no-underline flex items-center justify-center whitespace-nowrap transition-all"
            title="Explore Genre"
          >
            [DIVE]
          </Link>
        )}
      </div>
    );
  }

  // Fallback to standard link or click behavior
  if (resolvedHref) {
    return (
      <Link href={resolvedHref} className={wrapperClass} style={style}>
        {genre}
      </Link>
    );
  }

  return (
    <span
      onClick={() => onClick && onClick(genre)}
      className={wrapperClass}
      style={style}
    >
      {genre}
    </span>
  );
}
