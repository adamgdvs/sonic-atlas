"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { getTopGenres, getGenreArtists, getArtistPreviewData, type GenreInfo } from "@/lib/api";
import Header from "@/components/Header";
import GenreTag from "@/components/GenreTag";
import { useAudio } from "@/contexts/AudioContext";

export default function GenresPage() {
  const [genres, setGenres] = useState<GenreInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const { playTrack, currentTrack, isPlaying } = useAudio();

  useEffect(() => {
    getTopGenres()
      .then(setGenres)
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (!filter) return genres;
    const q = filter.toLowerCase();
    return genres.filter((g) => g.name.includes(q));
  }, [genres, filter]);

  // Group alphabetically
  const grouped = useMemo(() => {
    const groups: Record<string, GenreInfo[]> = {};
    for (const g of filtered) {
      const letter = g.name[0]?.toUpperCase() || "#";
      if (!groups[letter]) groups[letter] = [];
      groups[letter].push(g);
    }
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  const handlePlayGenre = async (genreName: string) => {
    // If same genre, stop
    const isThisGenrePlaying = currentTrack?.id === genreName;
    if (isThisGenrePlaying) {
      playTrack(currentTrack);
      return;
    }

    try {
      const artists = await getGenreArtists(genreName, 5);
      if (!artists || artists.length === 0) return;

      const randomArtist = artists[Math.floor(Math.random() * artists.length)];
      const previewData = await getArtistPreviewData(randomArtist.name);
      const trackWithPreview = previewData.tracks.find(t => t.preview);

      if (!trackWithPreview) return;

      playTrack({
        id: genreName,
        url: trackWithPreview.preview,
        title: trackWithPreview.title,
        artist: randomArtist.name,
      });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <div
        className="max-w-[900px] mx-auto px-4 sm:px-10 py-8"
        style={{ animation: "fadeIn 0.3s ease" }}
      >
        <h1
          className="text-2xl sm:text-3xl font-semibold text-[#1D1D1F] mb-1"
          style={{ letterSpacing: "-0.03em" }}
        >
          Browse Genres
        </h1>
        <p className="text-sm text-[#9CA3AF] mb-6">
          {genres.length} genres from Last.fm charts
        </p>

        {/* Filter input */}
        <div className="mb-8">
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter genres..."
            className="w-full max-w-[320px] text-sm border border-[#E5E5E5] bg-[#FAFAFA] px-3 py-2 outline-none focus:border-[#1D1D1F] transition-colors"
            style={{ letterSpacing: "-0.01em" }}
          />
        </div>

        {loading ? (
          <div className="text-sm text-[#9CA3AF] py-12 text-center">
            Loading genres...
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-sm text-[#9CA3AF] py-12 text-center">
            No genres found
          </div>
        ) : (
          <div className="space-y-6">
            {grouped.map(([letter, items]) => (
              <div key={letter}>
                <div
                  className="text-[11px] font-semibold text-[#C4C4C4] uppercase mb-2"
                  style={{ letterSpacing: "0.08em" }}
                >
                  {letter}
                </div>
                <div className="flex flex-wrap">
                  {items.map((g) => (
                    <GenreTag
                      key={g.name}
                      genre={g.name}
                      onPlayClick={handlePlayGenre}
                      isPlaying={isPlaying && currentTrack?.id === g.name}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
