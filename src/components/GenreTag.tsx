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
}: {
  genre: string;
  onClick?: (genre: string) => void;
  active?: boolean;
  href?: string;
  onPlayClick?: (genre: string) => void;
  isPlaying?: boolean;
}) {
  const color = getGenreColor(genre);

  const resolvedHref = href || `/genre/${encodeURIComponent(genre)}`;

  const style = {
    padding: "4px 10px",
    color: active || isPlaying ? "#FFF" : color,
    border: `1px solid ${active || isPlaying ? color : `${color}33`}`,
    backgroundColor: active || isPlaying ? color : `${color}0A`,
  };

  const wrapperClass = `group inline-flex items-center text-[11px] font-medium tracking-wide mr-2 mb-2 transition-all duration-150 rounded-full ${onClick || onPlayClick ? "hover:opacity-80" : ""}`;

  // If we have an onPlayClick handler, we split the button into a "play" text region and a "navigate" icon
  if (onPlayClick) {
    return (
      <div className={wrapperClass} style={style}>
        <span
          onClick={() => onPlayClick(genre)}
          className="cursor-pointer flex items-center gap-1"
        >
          {isPlaying ? (
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
          ) : null}
          {genre}
        </span>
        {resolvedHref && (
          <Link
            href={resolvedHref}
            className="w-0 opacity-0 overflow-hidden transition-all duration-200 group-hover:w-5 group-hover:opacity-70 hover:!opacity-100 group-hover:ml-1 group-hover:pl-1 group-hover:border-l border-current cursor-pointer no-underline flex items-center justify-center whitespace-nowrap"
            title="Explore Genre"
          >
            →
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
      className={`${wrapperClass} ${onClick ? 'cursor-pointer' : ''}`}
      style={style}
    >
      {genre}
    </span>
  );
}
