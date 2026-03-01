"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import SearchBar from "@/components/SearchBar";
import GenreTag from "@/components/GenreTag";
import { getTopGenres, getGenreArtists, getArtistPreviewData, type GenreInfo } from "@/lib/api";
import { useAudio } from "@/contexts/AudioContext";
import Footer from "@/components/Footer";

export default function Home() {
  const router = useRouter();
  const [trendingGenres, setTrendingGenres] = useState<GenreInfo[]>([]);
  const { playTrack, currentTrack, isPlaying } = useAudio();

  useEffect(() => {
    getTopGenres(30).then(setTrendingGenres);
  }, []);

  const handlePlayGenre = async (genreName: string) => {
    // Determine if this genre is already playing
    const isThisGenrePlaying = currentTrack?.id === genreName;
    if (isThisGenrePlaying) {
      // Defer to the Context toggle logic
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

  const handleSelect = (artistName: string) => {
    router.push(`/artist/${encodeURIComponent(artistName)}`);
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <div
        className="flex flex-col items-center justify-center px-5 pt-20 pb-16 sm:px-10 sm:pt-[120px] sm:pb-20"
        style={{ animation: "fadeIn 0.5s ease" }}
      >
        <h1
          className="text-3xl sm:text-5xl font-light text-[#1D1D1F] mb-3 text-center"
          style={{ letterSpacing: "-0.04em" }}
        >
          Discover similar artists
        </h1>
        <p
          className="text-sm sm:text-base text-[#9CA3AF] mb-8 sm:mb-12 font-normal text-center"
          style={{ letterSpacing: "-0.01em" }}
        >
          Search an artist. Explore the constellation.
        </p>
        <div className="w-full max-w-[480px]">
          <SearchBar
            onSelectArtist={handleSelect}
            onSelectGenre={(name) => router.push(`/genre/${encodeURIComponent(name)}`)}
          />
        </div>

        {/* Surprise Me Feature */}
        <button
          onClick={() => {
            if (trendingGenres.length > 0) {
              const random = trendingGenres[Math.floor(Math.random() * trendingGenres.length)];
              router.push(`/genre/${encodeURIComponent(random.name)}`);
            }
          }}
          className="mt-6 flex items-center gap-2 px-6 py-2.5 bg-[#FAFAFA] border border-[#E5E5E5] hover:border-[#1D1D1F] hover:bg-[#1D1D1F] hover:text-white transition-all duration-300 rounded-full text-sm font-semibold text-[#1D1D1F] cursor-pointer"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3" />
          </svg>
          Surprise Me
        </button>

        {/* Trending Genres */}
        {trendingGenres.length > 0 && (
          <div className="mt-12 sm:mt-16 w-full max-w-[600px]">
            <div className="flex items-center justify-between mb-4">
              <div
                className="text-[11px] font-semibold text-[#9CA3AF] uppercase"
                style={{ letterSpacing: "0.08em" }}
              >
                Trending Genres
              </div>
              <Link
                href="/genres"
                className="text-[11px] font-semibold text-[#9CA3AF] hover:text-[#1D1D1F] transition-colors no-underline"
              >
                Browse all genres →
              </Link>
            </div>
            <div className="flex flex-wrap justify-center">
              {trendingGenres.map((g) => (
                <GenreTag
                  key={g.name}
                  genre={g.name}
                  onPlayClick={handlePlayGenre}
                  isPlaying={isPlaying && currentTrack?.id === g.name}
                />
              ))}
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
