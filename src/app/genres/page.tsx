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
        coverUrl: previewData.image || undefined,
        genres: [genreName],
      });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-shift5-dark text-white selection:bg-shift5-orange/30">
      <Header />

      {/* Background Decorative Grid */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.02] overflow-hidden z-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#888_1px,transparent_1px),linear-gradient(to_bottom,#888_1px,transparent_1px)] bg-[size:40px_40px]" />
      </div>

      <main className="relative z-10 p-5 md:p-10 max-w-[1000px] mx-auto">
        <div className="mb-12 border-b border-white/5 pb-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-[10px] font-mono text-shift5-orange uppercase tracking-[0.2em] bg-shift5-orange/10 px-2 py-0.5 border border-shift5-orange/20">Sector_Catalog</span>
            <span className="text-[10px] font-mono text-white/20 uppercase tracking-widest whitespace-nowrap">Source: MULTI_SOURCE_INTELLIGENCE (LAST_FM + DISCOGS)</span>
          </div>


          <h1 className="text-4xl md:text-5xl font-bold uppercase tracking-tighter leading-none mb-4">Browse Genres</h1>
          <p className="text-[11px] text-white/40 font-mono uppercase tracking-[0.1em]">
            Cataloged_Artifacts // {genres.length.toString().padStart(3, '0')}
          </p>
        </div>

        {/* Filter input */}
        <div className="mb-12">
          <div className="text-[10px] font-mono text-white/20 uppercase mb-2 tracking-widest">Query_Filter</div>
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Search sector signature..."
            className="w-full max-w-[400px] text-[11px] font-mono border border-white/10 bg-white/[0.02] text-white px-4 py-3 outline-none focus:border-shift5-orange/50 transition-all uppercase placeholder:text-white/10"
          />
        </div>

        {loading ? (
          <div className="py-20 text-center">
            <div className="inline-block w-8 h-8 border-2 border-shift5-orange/20 border-t-shift5-orange rounded-full animate-spin mb-4" />
            <div className="text-[10px] font-mono text-white/20 uppercase tracking-widest">Compiling_List...</div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center border border-dashed border-white/10">
            <div className="text-[10px] font-mono text-white/20 uppercase tracking-widest">Zero_Matches_Found</div>
          </div>
        ) : (
          <div className="space-y-12">
            {grouped.map(([letter, items]) => (
              <div key={letter} className="relative">
                <div className="flex items-center gap-4 mb-6">
                  <div className="text-xl font-bold text-shift5-orange font-mono bg-shift5-orange/5 w-10 h-10 flex items-center justify-center border border-shift5-orange/10">{letter}</div>
                  <div className="h-[1px] flex-1 bg-white/5" />
                </div>
                <div className="flex flex-wrap gap-1">
                  {items.map((g) => (
                    <GenreTag
                      key={g.name}
                      genre={g.name}
                      onPlayClick={handlePlayGenre}
                      isPlaying={isPlaying && currentTrack?.id === g.name}
                      isAuthoritative={g.isAuthoritative}
                    />

                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
