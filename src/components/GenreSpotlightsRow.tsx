"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useAudio } from "@/contexts/AudioContext";
import SaveCuratedButton from "./SaveCuratedButton";

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
  tracks?: CuratedPlaylistTrack[];
}

interface SpotlightItem {
  query: string;
  playlist: CuratedPlaylist | null;
}

function SpotlightCard({
  item,
  isActive,
  onOpen,
}: {
  item: SpotlightItem;
  isActive: boolean;
  onOpen: () => void;
}) {
  if (!item.playlist) return null;

  return (
    <button
      onClick={onOpen}
      className={`group shrink-0 w-[200px] sm:w-[220px] text-left border transition-all duration-300 ${
        isActive
          ? "border-shift5-orange bg-white/[0.04]"
          : "border-white/10 bg-white/[0.02] hover:border-white/25 active:border-shift5-orange"
      }`}
    >
      <div className="relative aspect-square overflow-hidden bg-white/[0.04]">
        {item.playlist.coverUrl ? (
          <Image
            src={item.playlist.coverUrl}
            alt={item.playlist.title}
            fill
            sizes="220px"
            className="object-cover opacity-75 group-hover:opacity-90 transition-opacity duration-300"
            unoptimized
          />
        ) : (
          <div className="w-full h-full bg-white/[0.04]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-shift5-dark via-shift5-dark/35 to-transparent" />
        <div className="absolute left-3 top-3 text-[8px] font-mono font-bold uppercase tracking-[0.24em] text-shift5-orange">
          {item.query.replace(" playlist", "")}
        </div>
      </div>

      <div className="p-3">
        <div className="text-[12px] font-mono font-bold uppercase tracking-tight text-white truncate">
          {item.playlist.title}
        </div>
        <div className="text-[10px] font-mono uppercase tracking-wider text-shift5-muted truncate mt-1">
          {item.playlist.description || "Curated from YouTube Music"}
        </div>
      </div>
    </button>
  );
}

export default function GenreSpotlightsRow() {
  const { playQueue, setRadioMode } = useAudio();
  const [spotlights, setSpotlights] = useState<SpotlightItem[]>([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState<CuratedPlaylist | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadSpotlights() {
      try {
        const res = await fetch("/api/playlists/genre-spotlights");
        if (!res.ok) return;
        const data = await res.json();
        if (!active || !Array.isArray(data.spotlights)) return;
        setSpotlights(data.spotlights.filter((item: SpotlightItem) => item.playlist?.id));
      } catch {
        setSpotlights([]);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadSpotlights();
    return () => {
      active = false;
    };
  }, []);

  async function handleOpen(item: SpotlightItem) {
    if (!item.playlist?.id) return;

    try {
      const res = await fetch(`/api/playlists/curated/${encodeURIComponent(item.playlist.id)}/tracks`);
      if (!res.ok) return;
      const data = await res.json();
      if (!Array.isArray(data.tracks) || data.tracks.length === 0) return;

      setSelectedPlaylist({
        ...item.playlist,
        tracks: data.tracks,
      });
    } catch {
      // fail soft
    }
  }

  function handlePlay() {
    if (!selectedPlaylist?.tracks || selectedPlaylist.tracks.length === 0 || isPlaying) return;

    setIsPlaying(true);
    try {
      setRadioMode(false);
      playQueue(
        selectedPlaylist.tracks.slice(0, 12).map((track, index) => ({
          id: `spotlight-${selectedPlaylist.id}-${track.videoId}-${index}`,
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

  if (loading || spotlights.length === 0) return null;

  return (
    <div className="w-full max-w-[900px] mt-14 sm:mt-20">
      <div className="mb-5 sm:mb-6 border-b border-white/[0.06] pb-3">
        <div className="text-[10px] font-mono text-shift5-orange/80 uppercase tracking-[0.2em]">
          Genre_Spotlights
        </div>
        <div className="text-[11px] sm:text-[12px] font-mono text-shift5-muted uppercase tracking-wider mt-1">
          Targeted playlist lanes for scenes adjacent to your atlas
        </div>
      </div>

      <div className="flex gap-3 sm:gap-4 overflow-x-auto no-scrollbar pb-2 -mx-5 sm:mx-0 px-5 sm:px-0 snap-x snap-mandatory sm:snap-none scroll-smooth">
        {spotlights.map((item) => (
          <SpotlightCard
            key={item.query}
            item={item}
            isActive={selectedPlaylist?.id === item.playlist?.id}
            onOpen={() => handleOpen(item)}
          />
        ))}
      </div>

      {selectedPlaylist && selectedPlaylist.tracks && selectedPlaylist.tracks.length > 0 && (
        <div className="mt-6 border border-white/[0.08] bg-white/[0.02]">
          <div className="px-4 sm:px-5 py-4 border-b border-white/[0.06] flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[10px] font-mono text-shift5-orange uppercase tracking-[0.2em]">
                Spotlight_Playlist
              </div>
              <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tighter text-white mt-1 truncate">
                {selectedPlaylist.title}
              </h3>
              <p className="text-[10px] sm:text-[11px] font-mono text-shift5-muted uppercase tracking-wider mt-1">
                {selectedPlaylist.tracks.length} playable tracks
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={handlePlay}
                disabled={isPlaying}
                className="px-5 py-3 bg-shift5-orange text-white border-2 border-shift5-orange font-mono text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-white hover:text-shift5-orange active:bg-white active:text-shift5-orange transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isPlaying ? "Loading..." : "Play_Spotlight"}
              </button>
              <SaveCuratedButton
                name={selectedPlaylist.title}
                description={selectedPlaylist.description || "Genre spotlight from Sonic Atlas"}
                coverUrl={selectedPlaylist.coverUrl}
                tracks={selectedPlaylist.tracks}
              />
            </div>
          </div>

          <div className="px-4 sm:px-5 py-4 grid gap-2">
            {selectedPlaylist.tracks.slice(0, 8).map((track, index) => (
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
                  Scene
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
