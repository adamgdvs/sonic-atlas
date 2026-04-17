"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { getSimilarArtists, type SimilarArtistResult } from "@/lib/api";
import { useAudio } from "@/contexts/AudioContext";
import ArtistInitials from "./ArtistInitials";

interface RecoGroup {
  source: string;
  artists: SimilarArtistResult[];
}

export default function DiscoverFeed() {
  const { data: session, status } = useSession();
  const { history, currentTrack, isPlaying } = useAudio();
  const router = useRouter();
  const [recoGroups, setRecoGroups] = useState<RecoGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const initialized = useRef(false);

  useEffect(() => {
    if (status === "loading") return;
    if (initialized.current) return;
    initialized.current = true;

    async function loadRecos() {
      const historyArtists = [
        ...new Set(history.slice(0, 15).map((h) => h.track.artist)),
      ].slice(0, 2);

      let bookmarkArtists: string[] = [];
      if (session?.user) {
        try {
          const res = await fetch("/api/bookmarks");
          const data = await res.json();
          if (Array.isArray(data)) {
            bookmarkArtists = (data as { name: string }[])
              .slice(0, 3)
              .map((b) => b.name);
          }
        } catch {
          // non-critical
        }
      }

      const allSeeds = [
        ...new Set([...bookmarkArtists, ...historyArtists]),
      ].slice(0, 3);

      if (allSeeds.length === 0) return;

      setLoading(true);
      try {
        const groups = await Promise.all(
          allSeeds.map(async (source) => {
            const similar = await getSimilarArtists(source, 8, 60);
            const filtered = similar
              .filter((a) => !allSeeds.includes(a.name))
              .slice(0, 5);
            return { source, artists: filtered };
          })
        );
        setRecoGroups(groups.filter((g) => g.artists.length > 0));
      } finally {
        setLoading(false);
      }
    }

    if (history.length > 0 || session?.user) {
      loadRecos();
    }
  }, [status]);

  if (loading) {
    return (
      <div className="w-full max-w-[800px] mt-14 sm:mt-16">
        <div className="text-[10px] font-mono text-white/30 uppercase tracking-[0.2em] mb-4 sm:mb-5 border-b border-white/5 pb-2">
          Discover_For_You
        </div>
        <div className="flex gap-2.5 sm:gap-3 -mx-5 sm:mx-0 px-5 sm:px-0 overflow-hidden">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="shrink-0 w-[128px] sm:w-[110px]">
              <div className="aspect-square bg-white/5 animate-pulse" />
              <div className="h-9 bg-white/5 animate-pulse mt-px" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (recoGroups.length === 0) return null;

  return (
    <div className="w-full max-w-[800px] mt-14 sm:mt-16">
      <div className="flex items-center justify-between mb-4 sm:mb-5 border-b border-white/5 pb-2">
        <div className="text-[10px] font-mono text-white/30 uppercase tracking-[0.2em]">
          Discover_For_You
        </div>
      </div>

      <div className="space-y-7 sm:space-y-8">
        {recoGroups.map((group) => (
          <div key={group.source}>
            <div className="text-[9px] font-mono text-white/20 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <span className="text-shift5-orange/50">›</span>
              <span className="truncate">
                Because_You_Explored //{" "}
                <span
                  className="text-white/40 cursor-pointer hover:text-shift5-orange active:text-shift5-orange transition-colors touch-manipulation"
                  onClick={() =>
                    router.push(`/artist/${encodeURIComponent(group.source)}`)
                  }
                >
                  {group.source}
                </span>
              </span>
            </div>
            <div
              className="flex gap-2.5 sm:gap-3 overflow-x-auto no-scrollbar pb-2 -mx-5 sm:mx-0 px-5 sm:px-0 snap-x snap-mandatory sm:snap-none scroll-smooth"
              style={{
                WebkitOverflowScrolling: "touch",
                touchAction: "pan-x",
                scrollPaddingLeft: "20px",
              }}
            >
              {group.artists.map((a) => {
                const isActive = isPlaying && currentTrack?.artist === a.name;
                return (
                  <div
                    key={a.name}
                    onClick={() =>
                      router.push(`/artist/${encodeURIComponent(a.name)}`)
                    }
                    className={`shrink-0 w-[128px] sm:w-[110px] cursor-pointer group border transition-all duration-300 snap-start touch-manipulation active:scale-[0.97] ${
                      isActive
                        ? "border-shift5-orange"
                        : "border-white/5 hover:border-white/20 active:border-white/30"
                    }`}
                  >
                    <div className="relative aspect-square bg-white/5 overflow-hidden grayscale group-hover:grayscale-0 group-active:grayscale-0 transition-all duration-500">
                      {a.image ? (
                        <Image
                          src={a.image}
                          alt={a.name}
                          fill
                          sizes="128px"
                          className="object-cover scale-105 group-hover:scale-100 group-active:scale-100 transition-transform duration-500"
                          unoptimized
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ArtistInitials name={a.name} size={36} />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-shift5-dark/30 group-hover:bg-transparent group-active:bg-transparent transition-colors" />
                    </div>
                    <div className="p-2 border-t border-white/5">
                      <div
                        className={`text-[10px] font-mono uppercase tracking-tight truncate transition-colors ${
                          isActive
                            ? "text-shift5-orange"
                            : "text-white/60 group-hover:text-white"
                        }`}
                      >
                        {a.name}
                      </div>
                      {a.genres.length > 0 && (
                        <div className="text-[8px] font-mono text-white/20 uppercase truncate mt-0.5">
                          {a.genres[0]}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
