"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAudio } from "@/contexts/AudioContext";
import SaveCuratedButton from "./SaveCuratedButton";
import type { CatalogEntry } from "@/lib/curated-catalog";

interface CuratedPlaylistTrack {
  title: string;
  artist: string;
  videoId: string;
  coverUrl: string | null;
}

interface CuratedPlaylist {
  id: string;
  title: string;
  description: string;
  coverUrl: string | null;
  source: "ytmusic" | "atlas";
  category: string;
  trackCount?: number | null;
  tracks?: CuratedPlaylistTrack[];
}

interface CatalogItem {
  entry: CatalogEntry;
  playlist: CuratedPlaylist | null;
  isPriority?: boolean;
}

function CatalogCard({
  item,
  active,
  onOpen,
}: {
  item: CatalogItem;
  active: boolean;
  onOpen: () => void;
}) {
  if (!item.playlist) return null;

  return (
    <button
      onClick={onOpen}
      className={`group shrink-0 w-[220px] sm:w-[240px] text-left border transition-all duration-300 ${
        active
          ? "border-shift5-orange bg-white/[0.04]"
          : "border-white/10 bg-white/[0.02] hover:border-white/25 active:border-shift5-orange"
      }`}
    >
      <div className="relative aspect-square overflow-hidden bg-white/[0.04]">
        {item.playlist.coverUrl ? (
          <Image
            src={item.playlist.coverUrl}
            alt={item.entry.title}
            fill
            sizes="240px"
            className="object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-300"
            unoptimized
          />
        ) : (
          <div className="w-full h-full bg-white/[0.04]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-shift5-dark via-shift5-dark/40 to-transparent" />
        <div className="absolute left-3 top-3 text-[8px] font-mono font-bold uppercase tracking-[0.24em] text-shift5-orange">
          {item.isPriority ? "priority" : item.entry.category}
        </div>
        {item.playlist.trackCount ? (
          <div className="absolute right-3 top-3 text-[8px] font-mono font-bold uppercase tracking-[0.2em] text-white/80 bg-black/50 px-2 py-1">
            {item.playlist.trackCount} tracks
          </div>
        ) : null}
      </div>
      <div className="p-3">
        <div className="text-[12px] font-mono font-bold uppercase tracking-tight text-white truncate">
          {item.entry.title}
        </div>
        <div className="text-[10px] font-mono uppercase tracking-wider text-shift5-muted truncate mt-1">
          {item.entry.subtitle}
        </div>
      </div>
    </button>
  );
}

export default function CuratedCatalogRow() {
  const { playQueue, setRadioMode } = useAudio();
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<CatalogItem | null>(null);
  const [tracks, setTracks] = useState<CuratedPlaylistTrack[] | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/playlists/catalog?priority=1&limit=12");
        if (!res.ok) return;
        const data = await res.json();
        if (!active || !Array.isArray(data.catalog)) return;
        setItems(data.catalog);
      } catch {
        setItems([]);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  async function handleOpen(item: CatalogItem) {
    if (!item.playlist?.id) return;
    setSelected(item);
    setTracks(null);
    try {
      const res = await fetch(
        `/api/playlists/curated/${encodeURIComponent(item.playlist.id)}/tracks`
      );
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data.tracks)) setTracks(data.tracks);
    } catch {
      setTracks([]);
    }
  }

  function handlePlay() {
    if (!selected?.playlist || !tracks || tracks.length === 0 || isPlaying) return;
    setIsPlaying(true);
    try {
      setRadioMode(false);
      playQueue(
        tracks.map((track, index) => ({
          id: `catalog-${selected.playlist!.id}-${track.videoId}-${index}`,
          url: "",
          title: track.title,
          artist: track.artist,
          coverUrl: track.coverUrl || undefined,
          videoId: track.videoId,
          genres: [],
        })),
        0
      );
    } finally {
      setIsPlaying(false);
    }
  }

  if (loading || items.length === 0) return null;

  return (
    <div className="w-full max-w-[900px] mt-14 sm:mt-20">
      <div className="mb-5 sm:mb-6 border-b border-white/[0.06] pb-3 flex items-end justify-between gap-4">
        <div>
          <div className="text-[10px] font-mono text-shift5-orange/80 uppercase tracking-[0.2em]">
            Editorial_Picks
          </div>
          <div className="text-[11px] sm:text-[12px] font-mono text-shift5-muted uppercase tracking-wider mt-1">
            Highest-priority curated lanes — first stop for deep listening
          </div>
        </div>
        <Link
          href="/playlists"
          className="shrink-0 text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-white/70 hover:text-shift5-orange transition-colors border-b border-white/20 hover:border-shift5-orange pb-0.5"
        >
          Browse_All →
        </Link>
      </div>

      <div className="flex gap-3 sm:gap-4 overflow-x-auto no-scrollbar pb-2 -mx-5 sm:mx-0 px-5 sm:px-0 snap-x snap-mandatory sm:snap-none scroll-smooth">
        {items.map((item) => (
          <CatalogCard
            key={item.entry.slug}
            item={item}
            active={selected?.entry.slug === item.entry.slug}
            onOpen={() => handleOpen(item)}
          />
        ))}
      </div>

      {selected?.playlist && (
        <div className="mt-6 border border-white/[0.08] bg-white/[0.02]">
          <div className="px-4 sm:px-5 py-4 border-b border-white/[0.06] flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[10px] font-mono text-shift5-orange uppercase tracking-[0.2em]">
                {selected.entry.category}_set
              </div>
              <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tighter text-white mt-1 truncate">
                {selected.entry.title}
              </h3>
              <p className="text-[10px] sm:text-[11px] font-mono text-shift5-muted uppercase tracking-wider mt-1">
                {selected.entry.subtitle}
                {selected.playlist.trackCount
                  ? ` · ${selected.playlist.trackCount} tracks`
                  : ""}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={handlePlay}
                disabled={!tracks || tracks.length === 0 || isPlaying}
                className="px-5 py-3 bg-shift5-orange text-white border-2 border-shift5-orange font-mono text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-white hover:text-shift5-orange active:bg-white active:text-shift5-orange transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {!tracks ? "Loading..." : isPlaying ? "Loading..." : "Play_Set"}
              </button>
              <SaveCuratedButton
                name={selected.entry.title}
                description={selected.entry.subtitle}
                coverUrl={selected.playlist.coverUrl}
                tracks={tracks || []}
              />
            </div>
          </div>

          {tracks && tracks.length > 0 && (
            <div className="px-4 sm:px-5 py-4 grid gap-2">
              {tracks.slice(0, 8).map((track, index) => (
                <div
                  key={`${track.videoId}-${index}`}
                  className="flex items-start justify-between gap-3 border-b border-white/[0.04] pb-2 last:border-b-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <div className="text-[11px] sm:text-[12px] font-mono uppercase tracking-wide text-white truncate">
                      {index + 1}. {track.title}
                    </div>
                    <div className="text-[10px] font-mono uppercase tracking-wider text-shift5-muted truncate mt-1">
                      {track.artist}
                    </div>
                  </div>
                  <div className="shrink-0 text-[9px] font-mono uppercase tracking-widest text-white/30">
                    Track
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
