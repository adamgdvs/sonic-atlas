"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useAudio } from "@/contexts/AudioContext";

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

interface CuratedMoodCard {
  title: string;
  params: string;
  section: string;
  representativePlaylist: CuratedPlaylist | null;
}

function MoodCard({
  mood,
  isActive,
  onOpen,
}: {
  mood: CuratedMoodCard;
  isActive: boolean;
  onOpen: () => void;
}) {
  const playlist = mood.representativePlaylist;
  if (!playlist) return null;

  return (
    <button
      onClick={onOpen}
      className={`group shrink-0 w-[220px] sm:w-[260px] text-left border transition-all duration-300 ${
        isActive
          ? "border-shift5-orange bg-white/[0.04]"
          : "border-white/10 bg-white/[0.02] hover:border-white/25 active:border-shift5-orange"
      }`}
    >
      <div className="relative aspect-[1.4/1] overflow-hidden bg-white/[0.04]">
        {playlist.coverUrl ? (
          <Image
            src={playlist.coverUrl}
            alt={playlist.title}
            fill
            sizes="(max-width: 640px) 220px, 260px"
            className="object-cover opacity-70 group-hover:opacity-90 transition-opacity duration-300"
            unoptimized
          />
        ) : (
          <div className="w-full h-full bg-white/[0.04]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-shift5-dark via-shift5-dark/35 to-transparent" />
        <div className="absolute left-3 top-3 text-[8px] font-mono font-bold uppercase tracking-[0.24em] text-shift5-orange">
          {mood.title}
        </div>
      </div>

      <div className="p-3 sm:p-4">
        <div className="text-[12px] sm:text-[13px] font-mono font-bold uppercase tracking-tight text-white truncate">
          {playlist.title}
        </div>
        <div className="text-[10px] font-mono uppercase tracking-wider text-shift5-muted truncate mt-1">
          {playlist.description || "Curated from YouTube Music"}
        </div>
      </div>
    </button>
  );
}

export default function CuratedMoodsRow() {
  const { playQueue, setRadioMode } = useAudio();
  const [moods, setMoods] = useState<CuratedMoodCard[]>([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState<CuratedPlaylist | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPlayingPlaylist, setIsPlayingPlaylist] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadMoods() {
      try {
        const res = await fetch("/api/playlists/moods");
        if (!res.ok) return;
        const data = await res.json();
        if (!active || !Array.isArray(data.moods)) return;

        const validMoods = data.moods.filter(
          (item: CuratedMoodCard) => item.representativePlaylist?.id
        );
        setMoods(validMoods);
      } catch {
        setMoods([]);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadMoods();

    return () => {
      active = false;
    };
  }, []);

  async function handleOpenPlaylist(mood: CuratedMoodCard) {
    const playlist = mood.representativePlaylist;
    if (!playlist?.id) return;

    try {
      const res = await fetch(`/api/playlists/curated/${encodeURIComponent(playlist.id)}/tracks`);
      if (!res.ok) return;

      const data = await res.json();
      if (!Array.isArray(data.tracks) || data.tracks.length === 0) return;

      setSelectedPlaylist({
        ...playlist,
        tracks: data.tracks,
      });
    } catch {
      // fail soft
    }
  }

  function handlePlayPlaylist() {
    if (!selectedPlaylist?.tracks || selectedPlaylist.tracks.length === 0 || isPlayingPlaylist) {
      return;
    }

    setIsPlayingPlaylist(true);
    try {
      setRadioMode(false);
      playQueue(
        selectedPlaylist.tracks.map((track, index) => ({
          id: `${selectedPlaylist.id}-${track.videoId}-${index}`,
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
      setIsPlayingPlaylist(false);
    }
  }

  if (loading || moods.length === 0) return null;

  return (
    <div className="w-full max-w-[900px] mt-14 sm:mt-20">
      <div className="mb-5 sm:mb-6 border-b border-white/[0.06] pb-3">
        <div className="text-[10px] font-mono text-shift5-orange/80 uppercase tracking-[0.2em]">
          Curated_Moods
        </div>
        <div className="text-[11px] sm:text-[12px] font-mono text-shift5-muted uppercase tracking-wider mt-1">
          YouTube Music mood lanes routed through the current player
        </div>
      </div>

      <div className="flex gap-3 sm:gap-4 overflow-x-auto no-scrollbar pb-2 -mx-5 sm:mx-0 px-5 sm:px-0 snap-x snap-mandatory sm:snap-none scroll-smooth">
        {moods.map((mood) => (
          <MoodCard
            key={mood.params}
            mood={mood}
            isActive={selectedPlaylist?.id === mood.representativePlaylist?.id}
            onOpen={() => handleOpenPlaylist(mood)}
          />
        ))}
      </div>

      {selectedPlaylist && selectedPlaylist.tracks && selectedPlaylist.tracks.length > 0 && (
        <div className="mt-6 border border-white/[0.08] bg-white/[0.02]">
          <div className="px-4 sm:px-5 py-4 border-b border-white/[0.06] flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[10px] font-mono text-shift5-orange uppercase tracking-[0.2em]">
                Mood_Playlist
              </div>
              <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tighter text-white mt-1 truncate">
                {selectedPlaylist.title}
              </h3>
              <p className="text-[10px] sm:text-[11px] font-mono text-shift5-muted uppercase tracking-wider mt-1">
                {selectedPlaylist.tracks.length} playable tracks
              </p>
            </div>

            <button
              onClick={handlePlayPlaylist}
              disabled={isPlayingPlaylist}
              className="px-5 py-3 bg-shift5-orange text-white border-2 border-shift5-orange font-mono text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-white hover:text-shift5-orange active:bg-white active:text-shift5-orange transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPlayingPlaylist ? "Loading..." : "Play_Mood_Set"}
            </button>
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
                  YT
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
