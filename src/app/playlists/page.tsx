"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SaveCuratedButton from "@/components/SaveCuratedButton";
import { useAudio } from "@/contexts/AudioContext";
import {
  CATALOG_CATEGORIES,
  MIN_TRACKS,
  type CatalogCategory,
  type CatalogEntry,
} from "@/lib/curated-catalog";

const QUICK_THEMES = [
  "90's HipHop",
  "Midnight Roadtrip",
  "Indie Rock",
  "Garage Bands",
  "Happy Days",
  "Focus Flow",
  "Rainy Day",
  "House Party",
  "Dream Pop",
  "Bossa Nights",
  "Soul Revival",
  "Afro House",
];

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
}

type Filter = "all" | CatalogCategory;

export default function PlaylistsPage() {
  const { playQueue, setRadioMode } = useAudio();
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<CuratedPlaylist[]>([]);
  const [searching, setSearching] = useState(false);

  // Hydrate ?q= from the URL once on mount — avoids Suspense deopt from
  // useSearchParams while still letting banners / deep links pre-fill search.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const q = new URLSearchParams(window.location.search).get("q");
    if (q) setQuery(q);
  }, []);

  // Debounced live YT Music search when the query looks meaningful. Backs
  // deep-links from banners and queries that aren't covered by the catalog.
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setSearchResults([]);
      setSearching(false);
      return;
    }
    let active = true;
    setSearching(true);
    const timer = window.setTimeout(async () => {
      try {
        const res = await fetch(`/api/playlists/search?q=${encodeURIComponent(q)}`);
        if (!res.ok) return;
        const data = await res.json();
        if (!active || !Array.isArray(data.playlists)) return;
        setSearchResults(data.playlists);
      } catch {
        if (active) setSearchResults([]);
      } finally {
        if (active) setSearching(false);
      }
    }, 300);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [query]);
  const [selected, setSelected] = useState<CatalogItem | null>(null);
  const [tracks, setTracks] = useState<CuratedPlaylistTrack[] | null>(null);
  const [tracksLoading, setTracksLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/playlists/catalog");
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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const catalogMatches = items.filter((item) => {
      if (!item.playlist) return false;
      if (filter !== "all" && item.entry.category !== filter) return false;
      if (!q) return true;
      const hay = [
        item.entry.title,
        item.entry.subtitle,
        item.playlist.title,
        ...(item.entry.tags || []),
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });

    // When the user is actively searching, merge live YT Music results in so
    // queries that don't map to a catalog slug still return playlists. Dedupe
    // by playlist id and drop results that don't fit the active category chip.
    if (q.length < 2 || searchResults.length === 0) return catalogMatches;

    const seen = new Set(catalogMatches.map((i) => i.playlist?.id).filter(Boolean));
    const synthetic: CatalogItem[] = searchResults
      .filter((p) => p.id && !seen.has(p.id))
      .map((p) => ({
        entry: {
          slug: `search-${p.id}`,
          title: p.title,
          subtitle: p.description || "Live result from YouTube Music",
          category: (filter === "all" ? "genre" : filter) as CatalogCategory,
          searchQuery: query.trim(),
          tags: [query.trim().toLowerCase()],
        },
        playlist: p,
      }));

    return [...catalogMatches, ...synthetic];
  }, [items, filter, query, searchResults]);

  async function handleOpen(item: CatalogItem) {
    if (!item.playlist?.id) return;
    setSelected(item);
    setTracks(null);
    setTracksLoading(true);
    try {
      const res = await fetch(
        `/api/playlists/curated/${encodeURIComponent(item.playlist.id)}/tracks`
      );
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data.tracks)) setTracks(data.tracks);
    } catch {
      setTracks([]);
    } finally {
      setTracksLoading(false);
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

  return (
    <div className="min-h-screen bg-shift5-dark text-white selection:bg-shift5-orange/30">
      <Header />

      <div className="fixed inset-0 pointer-events-none opacity-[0.03] overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#888_1px,transparent_1px),linear-gradient(to_bottom,#888_1px,transparent_1px)] bg-[size:40px_40px]" />
      </div>

      <div className="relative z-10 max-w-[1200px] mx-auto pt-24 sm:pt-28 px-5 sm:px-10 pb-20">
        <div className="mb-8 border-b border-white/[0.06] pb-5">
          <div className="text-[10px] font-mono text-shift5-orange/80 uppercase tracking-[0.2em]">
            Curated_Catalog
          </div>
          <h1
            className="mt-2 text-4xl sm:text-5xl md:text-6xl"
            style={{
              fontFamily: "var(--font-editorial)",
              fontWeight: 300,
              letterSpacing: "-0.035em",
              lineHeight: 0.98,
            }}
          >
            Playlists built to <em className="italic text-shift5-orange">move with you</em>.
          </h1>
          <p className="mt-3 text-[12px] sm:text-[13px] font-mono text-shift5-muted uppercase tracking-wider max-w-2xl">
            Mood, era, vibe, and genre — every set is {MIN_TRACKS}+ tracks sourced from YouTube Music.
            Play inline or save into My_Atlas.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="search playlists, moods, eras, genres..."
            className="flex-1 bg-white/[0.03] border border-white/10 focus:border-shift5-orange/70 outline-none px-4 py-3 text-[12px] font-mono uppercase tracking-wider placeholder:text-white/25 text-white transition-colors"
          />
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            <FilterChip label="All" active={filter === "all"} onClick={() => setFilter("all")} />
            {CATALOG_CATEGORIES.map((c) => (
              <FilterChip
                key={c.id}
                label={c.label}
                active={filter === c.id}
                onClick={() => setFilter(c.id)}
              />
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-8">
          {QUICK_THEMES.map((theme) => (
            <button
              key={theme}
              onClick={() => setQuery(theme)}
              className="px-2.5 py-1 border border-white/10 text-[9px] font-mono uppercase tracking-widest text-white/45 hover:text-white hover:border-white/25 transition-colors cursor-pointer"
            >
              {theme}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="py-20 text-center text-[11px] font-mono text-shift5-muted uppercase tracking-widest">
            Scanning catalog…
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center text-[11px] font-mono text-shift5-muted uppercase tracking-widest">
            {searching ? "Searching…" : "No matches. Try a different keyword or category."}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {filtered.map((item) => (
              <CatalogCard
                key={item.entry.slug}
                item={item}
                active={selected?.entry.slug === item.entry.slug}
                onOpen={() => handleOpen(item)}
              />
            ))}
          </div>
        )}

        {selected?.playlist && (
          <div className="mt-10 border border-white/[0.08] bg-white/[0.02]">
            <div className="px-5 py-5 border-b border-white/[0.06] flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div className="min-w-0">
                <div className="text-[10px] font-mono text-shift5-orange uppercase tracking-[0.2em]">
                  {selected.entry.category}_set
                </div>
                <h2 className="mt-1 text-2xl sm:text-3xl font-black uppercase tracking-tighter text-white truncate">
                  {selected.entry.title}
                </h2>
                <p className="mt-1 text-[11px] font-mono text-shift5-muted uppercase tracking-wider">
                  {selected.entry.subtitle}
                </p>
                {selected.playlist.trackCount ? (
                  <p className="mt-1 text-[10px] font-mono text-white/40 uppercase tracking-wider">
                    {selected.playlist.trackCount} tracks · source: {selected.playlist.title}
                  </p>
                ) : null}
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handlePlay}
                  disabled={!tracks || tracks.length === 0 || isPlaying}
                  className="px-5 py-3 bg-shift5-orange text-white border-2 border-shift5-orange font-mono text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-white hover:text-shift5-orange active:bg-white active:text-shift5-orange transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isPlaying ? "Loading..." : "Play_Set"}
                </button>
                <SaveCuratedButton
                  name={selected.entry.title}
                  description={selected.entry.subtitle}
                  coverUrl={selected.playlist.coverUrl}
                  tracks={tracks || []}
                />
              </div>
            </div>

            <div className="px-5 py-5">
              {tracksLoading ? (
                <div className="text-[11px] font-mono text-shift5-muted uppercase tracking-widest py-6 text-center">
                  Resolving tracks…
                </div>
              ) : !tracks || tracks.length === 0 ? (
                <div className="text-[11px] font-mono text-shift5-muted uppercase tracking-widest py-6 text-center">
                  No playable tracks returned.
                </div>
              ) : (
                <div className="grid gap-2">
                  {tracks.slice(0, 20).map((track, index) => (
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
                  {tracks.length > 20 && (
                    <div className="text-[10px] font-mono text-white/30 uppercase tracking-widest pt-1">
                      +{tracks.length - 20} more · play to queue them all
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 px-4 py-3 border-2 font-mono text-[10px] font-bold uppercase tracking-[0.2em] transition-colors cursor-pointer ${
        active
          ? "border-shift5-orange bg-shift5-orange text-white"
          : "border-white/15 text-white/70 hover:border-white/40 hover:text-white"
      }`}
    >
      {label}
    </button>
  );
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
      className={`group text-left border transition-all duration-300 ${
        active
          ? "border-shift5-orange bg-white/[0.04]"
          : "border-white/10 bg-white/[0.02] hover:border-white/30"
      }`}
    >
      <div className="relative aspect-square overflow-hidden bg-white/[0.04]">
        {item.playlist.coverUrl ? (
          <Image
            src={item.playlist.coverUrl}
            alt={item.entry.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-300"
            unoptimized
          />
        ) : (
          <div className="w-full h-full bg-white/[0.04]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-shift5-dark via-shift5-dark/40 to-transparent" />
        <div className="absolute left-3 top-3 text-[8px] font-mono font-bold uppercase tracking-[0.24em] text-shift5-orange">
          {item.entry.category}
        </div>
        {item.playlist.trackCount ? (
          <div className="absolute right-3 top-3 text-[8px] font-mono font-bold uppercase tracking-[0.2em] text-white/80 bg-black/50 px-2 py-1">
            {item.playlist.trackCount} tracks
          </div>
        ) : null}
      </div>
      <div className="p-3">
        <div className="text-[12px] sm:text-[13px] font-mono font-bold uppercase tracking-tight text-white truncate">
          {item.entry.title}
        </div>
        <div className="text-[10px] font-mono uppercase tracking-wider text-shift5-muted truncate mt-1">
          {item.entry.subtitle}
        </div>
      </div>
    </button>
  );
}
