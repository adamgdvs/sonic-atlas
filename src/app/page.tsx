"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import SearchBar from "@/components/SearchBar";
import RecentlyPlayed from "@/components/RecentlyPlayed";
import DiscoverFeed from "@/components/DiscoverFeed";
import RotatingBanners from "@/components/RotatingBanners";
import YourAtlasRotation from "@/components/YourAtlasRotation";
import GenreCards from "@/components/GenreCards";
import { getTopGenres, type GenreInfo } from "@/lib/api";
import Footer from "@/components/Footer";

export default function Home() {
  const router = useRouter();
  const [trendingGenres, setTrendingGenres] = useState<GenreInfo[]>([]);

  useEffect(() => {
    getTopGenres(30).then(setTrendingGenres);
  }, []);

  const handleSelect = (artistName: string) => {
    router.push(`/artist/${encodeURIComponent(artistName)}`);
  };

  return (
    <div className="min-h-screen bg-shift5-dark text-white selection:bg-shift5-orange/30">
      <Header />

      {/* Background Decorative Grid */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#888_1px,transparent_1px),linear-gradient(to_bottom,#888_1px,transparent_1px)] bg-[size:40px_40px]" />
      </div>

      <div className="relative z-10 flex flex-col items-center pt-24 sm:pt-32 px-5 sm:px-10 pb-20">
        <div className="mb-10 animate-fade-in">
          <span className="text-[11px] font-mono text-white px-3 py-1 bg-shift5-orange border-2 border-shift5-orange uppercase tracking-[0.4em] font-bold shadow-[0_0_15px_rgba(255,88,65,0.4)]">
            ATLAS_INTEL // ACTIVE_SCAN
          </span>
        </div>

        <h1
          className="text-4xl sm:text-7xl md:text-8xl font-black text-white mb-6 uppercase tracking-[-0.05em] leading-[0.85] text-center max-w-[900px] selection:bg-shift5-orange"
        >
          Discover similar artists & sonic neighborhoods.
        </h1>
        <p
          className="text-sm sm:text-base text-shift5-muted mb-10 sm:mb-16 font-mono text-center max-w-xl"
          style={{ letterSpacing: "-0.01em" }}
        >
          Operational reconnaissance for music discovery. <br className="hidden sm:block" />
          Map the constellation. ID the signal.
        </p>

        <div className="w-full max-w-[540px]">
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
          className="mt-12 flex items-center gap-4 px-10 py-4 bg-white/5 border-2 border-white/20 hover:border-shift5-orange hover:bg-shift5-orange hover:text-shift5-dark transition-all duration-300 text-[12px] font-bold font-mono tracking-[0.2em] text-white uppercase cursor-pointer group"
        >
          <svg className="group-hover:rotate-180 transition-transform duration-500" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3" />
          </svg>
          [ RANDOM_SURGE_PROTOCOL ]
        </button>

        {/* Rotating Featured Banners — mood / era / genre / region */}
        <RotatingBanners />

        {/* Recently Played */}
        <RecentlyPlayed />

        {/* Your Atlas — On Rotation (bookmarks shuffled; trending fallback) */}
        <YourAtlasRotation />

        {/* Personalized Discovery — Because You Saved X */}
        <DiscoverFeed />

        {/* Hot Genre Signals — card grid */}
        <GenreCards limit={16} />
      </div>
      <Footer />
    </div>
  );
}
