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
import CuratedMoodsRow from "@/components/CuratedMoodsRow";
import ChartsRow from "@/components/ChartsRow";
import CuratedPlaylistsHub from "@/components/CuratedPlaylistsHub";
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

      <div className="v2 relative z-10 flex flex-col items-center pt-20 sm:pt-28 px-5 sm:px-10 pb-20">
        <div
          className="mb-8 animate-fade-in inline-flex items-center gap-2 text-[10px] uppercase"
          style={{
            fontFamily: "var(--font-editorial-mono)",
            letterSpacing: "0.2em",
            color: "var(--color-edit-ink-mute)",
          }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: "var(--color-edit-accent)" }}
          />
          <span>ATLAS_INTEL · ACTIVE_SCAN</span>
        </div>

        <h1
          className="mb-5 text-center max-w-[900px] text-[40px] sm:text-[56px] md:text-[72px]"
          style={{
            fontFamily: "var(--font-editorial)",
            fontWeight: 300,
            letterSpacing: "-0.035em",
            lineHeight: 0.98,
            color: "var(--color-edit-ink)",
          }}
        >
          Discover similar artists
          <br />
          &amp;{" "}
          <em
            style={{
              fontStyle: "italic",
              fontWeight: 400,
              color: "var(--color-edit-accent)",
            }}
          >
            sonic neighborhoods.
          </em>
        </h1>
        <p
          className="mb-10 sm:mb-12 text-center max-w-xl text-sm sm:text-[15px]"
          style={{
            fontFamily: "var(--font-editorial-body)",
            color: "var(--color-edit-ink-dim)",
            letterSpacing: "-0.005em",
            lineHeight: 1.5,
          }}
        >
          Operational reconnaissance for music discovery.
          <br className="hidden sm:block" />
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
          className="mt-10 flex items-center gap-3 px-6 py-3 text-[11px] uppercase cursor-pointer group transition-colors"
          style={{
            fontFamily: "var(--font-editorial-mono)",
            letterSpacing: "0.14em",
            color: "var(--color-edit-ink-dim)",
            background: "transparent",
            border: "1px solid var(--color-edit-line-2)",
            borderRadius: "var(--radius)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "var(--color-edit-accent)";
            e.currentTarget.style.color = "var(--color-edit-ink)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--color-edit-line-2)";
            e.currentTarget.style.color = "var(--color-edit-ink-dim)";
          }}
        >
          <svg
            className="group-hover:rotate-180 transition-transform duration-500"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3" />
          </svg>
          random_surge_protocol
        </button>

        {/* Rotating Featured Banners — mood / era / genre / region */}
        <RotatingBanners />

        {/* Recently Played */}
        <RecentlyPlayed />

        {/* Your Atlas — On Rotation (bookmarks shuffled; trending fallback) */}
        <YourAtlasRotation />

        {/* Curated Moods — YT Music bridge playlists */}
        <CuratedMoodsRow />

        {/* Charts — current region motion */}
        <ChartsRow />

        {/* Curated Playlists — recognizable named mixes + search */}
        <CuratedPlaylistsHub />

        {/* Personalized Discovery — Because You Saved X */}
        <DiscoverFeed />

        {/* Hot Genre Signals — card grid */}
        <GenreCards limit={16} />
      </div>
      <Footer />
    </div>
  );
}
