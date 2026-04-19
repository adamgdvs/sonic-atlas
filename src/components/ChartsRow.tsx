"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useAudio } from "@/contexts/AudioContext";
import SaveCuratedButton from "./SaveCuratedButton";

interface ChartTrack {
  title: string;
  artist: string;
  videoId: string;
  coverUrl: string | null;
}

interface ChartArtist {
  name: string;
  coverUrl: string | null;
}

interface ChartResponse {
  country: string;
  songs: ChartTrack[];
  videos: ChartTrack[];
  artists: ChartArtist[];
}

export default function ChartsRow() {
  const { playQueue, setRadioMode } = useAudio();
  const [charts, setCharts] = useState<ChartResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadCharts() {
      try {
        const res = await fetch("/api/playlists/charts?country=US");
        if (!res.ok) return;
        const data = await res.json();
        if (!active) return;

        if (Array.isArray(data.videos) && data.videos.length > 0) {
          setCharts(data);
        }
      } catch {
        setCharts(null);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadCharts();
    return () => {
      active = false;
    };
  }, []);

  function handlePlayCharts() {
    if (!charts || charts.videos.length === 0 || isPlaying) return;

    setIsPlaying(true);
    try {
      setRadioMode(false);
      playQueue(
        charts.videos.slice(0, 10).map((track, index) => ({
          id: `charts-${track.videoId}-${index}`,
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

  const chartSaveTracks = useMemo(() => {
    if (!charts) return [];
    return charts.videos.slice(0, 10).map((track) => ({
      title: track.title,
      artist: track.artist,
      videoId: track.videoId,
      coverUrl: track.coverUrl,
    }));
  }, [charts]);

  const chartPlaylistName = useMemo(() => {
    if (!charts) return "";
    const today = new Date().toISOString().slice(0, 10);
    return `${charts.country} Charts · ${today}`;
  }, [charts]);

  if (loading || !charts || charts.videos.length === 0) return null;

  const hero = charts.videos[0];

  return (
    <div className="w-full max-w-[900px] mt-14 sm:mt-20">
      <div className="mb-5 sm:mb-6 border-b border-white/[0.06] pb-3">
        <div className="text-[10px] font-mono text-shift5-orange/80 uppercase tracking-[0.2em]">
          Charts_By_Region
        </div>
        <div className="text-[11px] sm:text-[12px] font-mono text-shift5-muted uppercase tracking-wider mt-1">
          Current {charts.country} chart motion through YouTube Music
        </div>
      </div>

      <div className="border border-white/[0.08] bg-white/[0.02]">
        <div className="grid md:grid-cols-[1.2fr_0.8fr]">
          <div className="p-4 sm:p-5 border-b md:border-b-0 md:border-r border-white/[0.06]">
            <div className="text-[10px] font-mono text-shift5-orange uppercase tracking-[0.2em]">
              Frontline_Track
            </div>

            <div className="flex gap-4 mt-4">
              <div className="relative shrink-0 w-24 h-24 sm:w-28 sm:h-28 overflow-hidden bg-white/[0.04]">
                {hero.coverUrl ? (
                  <Image
                    src={hero.coverUrl}
                    alt={hero.title}
                    fill
                    sizes="112px"
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="w-full h-full bg-white/[0.04]" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="text-xl sm:text-2xl font-black uppercase tracking-tighter text-white truncate">
                  {hero.title}
                </div>
                <div className="text-[11px] sm:text-[12px] font-mono uppercase tracking-wider text-shift5-muted mt-2 truncate">
                  {hero.artist}
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    onClick={handlePlayCharts}
                    disabled={isPlaying}
                    className="px-5 py-3 bg-shift5-orange text-white border-2 border-shift5-orange font-mono text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-white hover:text-shift5-orange active:bg-white active:text-shift5-orange transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {isPlaying ? "Loading..." : "Play_Charts_Set"}
                  </button>
                  <SaveCuratedButton
                    name={chartPlaylistName}
                    description={`Top tracks captured from ${charts.country} charts`}
                    coverUrl={hero.coverUrl}
                    tracks={chartSaveTracks}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-5">
            <div className="text-[10px] font-mono text-white/40 uppercase tracking-widest mb-3">
              Top_Artists
            </div>
            <div className="grid grid-cols-2 gap-3">
              {charts.artists.slice(0, 4).map((artist) => (
                <div key={artist.name} className="border border-white/[0.06] bg-white/[0.02] p-3">
                  <div className="relative aspect-square overflow-hidden bg-white/[0.04] mb-2">
                    {artist.coverUrl ? (
                      <Image
                        src={artist.coverUrl}
                        alt={artist.name}
                        fill
                        sizes="140px"
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full bg-white/[0.04]" />
                    )}
                  </div>
                  <div className="text-[10px] sm:text-[11px] font-mono uppercase tracking-wide text-white truncate">
                    {artist.name}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="px-4 sm:px-5 py-4 border-t border-white/[0.06]">
          <div className="text-[10px] font-mono text-white/40 uppercase tracking-widest mb-2">
            Current_Run
          </div>
          <div className="grid gap-2">
            {charts.videos.slice(0, 5).map((track, index) => (
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
                  Chart
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
