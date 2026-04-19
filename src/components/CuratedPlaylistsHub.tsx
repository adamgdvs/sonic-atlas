"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useAudio } from "@/contexts/AudioContext";
import SaveCuratedButton from "./SaveCuratedButton";
import { getGenreColor } from "@/lib/utils";

function hexToRgb(hex: string) {
  const clean = hex.replace("#", "");
  const n = parseInt(clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

type CollectionKey = "featured" | "genre" | "mood" | "activity" | "era";

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

interface CollectionItem {
  label: string;
  query: string;
  category: CollectionKey;
  tone: string;
  playlist: CuratedPlaylist | null;
}

const COLLECTION_LABELS: Record<CollectionKey, string> = {
  featured: "Recognizable_Mixes",
  genre: "Genre_Lanes",
  mood: "Mood_Lanes",
  activity: "Activity_Sets",
  era: "Era_Collections",
};

const QUICK_QUERIES = [
  "90s hip hop",
  "midnight roadtrip",
  "indie rock",
  "garage bands",
  "happy days",
  "late night drive",
  "2000s indie",
  "neo soul",
  "dream pop",
  "afro house",
  "bossa nova",
  "post punk",
];

function CollectionCard({
  item,
  active,
  onOpen,
}: {
  item: CollectionItem;
  active: boolean;
  onOpen: () => void;
}) {
  if (!item.playlist) return null;

  const color = getGenreColor(item.playlist.title);
  const { r, g, b } = hexToRgb(color);
  const trackCount = item.playlist.trackCount;

  return (
    <button
      onClick={onOpen}
      className="group relative aspect-[4/3] overflow-hidden cursor-pointer border text-left transition-all duration-300 w-full"
      style={{
        background: item.playlist.coverUrl
          ? undefined
          : `linear-gradient(135deg, rgba(${r},${g},${b},0.72) 0%, rgba(${r},${g},${b},0.28) 55%, rgba(18,18,18,1) 100%)`,
        borderColor: active ? "#ff5841" : "rgba(255,255,255,0.08)",
        borderRadius: "2px",
        outline: active ? "1px solid #ff5841" : undefined,
      }}
    >
      {/* Cover art or gradient background */}
      {item.playlist.coverUrl ? (
        <>
          <Image
            src={item.playlist.coverUrl}
            alt={item.playlist.title}
            fill
            sizes="(max-width: 640px) 50vw, 25vw"
            className="object-cover opacity-70 group-hover:opacity-85 transition-opacity duration-300"
            unoptimized
          />
          {/* Color tint over cover art */}
          <div
            className="absolute inset-0 mix-blend-multiply opacity-50"
            style={{ background: `linear-gradient(135deg, rgba(${r},${g},${b},0.6) 0%, transparent 60%)` }}
          />
        </>
      ) : null}

      {/* Halftone texture */}
      <div
        className="absolute inset-0 opacity-[0.07] mix-blend-overlay"
        style={{ backgroundImage: "radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)", backgroundSize: "12px 12px" }}
      />

      {/* Bottom scrim */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

      {/* Corner accent bracket */}
      <div
        className="absolute top-2.5 right-2.5 w-3 h-3 border-t-2 border-r-2 transition-all duration-300 group-hover:w-4 group-hover:h-4"
        style={{ borderColor: color }}
      />

      {/* Top-left meta */}
      <div className="absolute top-2.5 left-3 z-10">
        <div className="text-[8px] font-mono uppercase tracking-[0.18em]" style={{ color }}>
          PLAYLIST
        </div>
        {trackCount ? (
          <div className="text-[8px] font-mono text-white/50 uppercase tracking-wider mt-0.5">
            {trackCount} tracks
          </div>
        ) : null}
      </div>

      {/* Bottom content */}
      <div className="absolute bottom-0 left-0 right-0 z-10 p-3">
        <div className="text-[13px] sm:text-[15px] font-mono font-bold uppercase tracking-tight text-white leading-tight">
          {item.playlist.title}
        </div>
        <div className="text-[9px] sm:text-[10px] font-mono uppercase tracking-wider mt-1 truncate" style={{ color: `rgba(${r},${g},${b},0.9)` }}>
          {item.tone}
        </div>
      </div>
    </button>
  );
}

export default function CuratedPlaylistsHub() {
  const { playQueue, setRadioMode } = useAudio();
  const [collection, setCollection] = useState<CollectionKey>("featured");
  const [collections, setCollections] = useState<CollectionItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<CollectionItem | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<CuratedPlaylist[]>([]);
  const [searching, setSearching] = useState(false);
  const [loadingCollection, setLoadingCollection] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedPlaylist, setSelectedPlaylist] = useState<CuratedPlaylist | null>(null);
  const [loadingSelection, setLoadingSelection] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const detailPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;

    async function loadCollection() {
      setLoadingCollection(true);
      setCollections([]);
      setHasMore(false);
      try {
        const res = await fetch(`/api/playlists/collections?collection=${collection}&limit=12&offset=0`);
        if (!res.ok) return;
        const data = await res.json();
        if (!active || !Array.isArray(data.collections)) return;
        const nextItems = data.collections.filter((item: CollectionItem) => item.playlist?.id);
        setCollections(nextItems);
        setHasMore(data.hasMore ?? false);
        setTotalCount(data.total ?? nextItems.length);
        if (nextItems.length > 0) {
          await openPlaylist(nextItems[0].playlist!, nextItems[0]);
        } else {
          setSelectedItem(null);
          setSelectedPlaylist(null);
        }
      } catch {
        if (active) {
          setCollections([]);
          setSelectedItem(null);
          setSelectedPlaylist(null);
        }
      } finally {
        if (active) setLoadingCollection(false);
      }
    }

    loadCollection();
    return () => { active = false; };
  }, [collection]);

  async function loadMore() {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const res = await fetch(
        `/api/playlists/collections?collection=${collection}&limit=12&offset=${collections.length}`
      );
      if (!res.ok) return;
      const data = await res.json();
      if (!Array.isArray(data.collections)) return;
      const nextItems = data.collections.filter((item: CollectionItem) => item.playlist?.id);
      setCollections((prev) => [...prev, ...nextItems]);
      setHasMore(data.hasMore ?? false);
    } catch {
      // non-critical
    } finally {
      setLoadingMore(false);
    }
  }

  useEffect(() => {
    const q = searchTerm.trim();
    if (q.length < 2) {
      setSearchResults([]);
      return;
    }

    let active = true;
    const timer = window.setTimeout(async () => {
      setSearching(true);
      try {
        // Search all catalog entries by title — independent of active collection tab
        const res = await fetch(`/api/playlists/collections?collection=all&q=${encodeURIComponent(q)}&limit=60&offset=0`);
        if (!res.ok) return;
        const data = await res.json();
        if (!active || !Array.isArray(data.collections)) return;
        const items: CollectionItem[] = data.collections.filter((item: CollectionItem) => item.playlist?.id);
        setSearchResults(items.map((item) => item.playlist!));
        if (items.length > 0) {
          await openPlaylist(items[0].playlist!, items[0]);
        } else {
          setSelectedPlaylist(null);
        }
      } catch {
        if (active) {
          setSearchResults([]);
          setSelectedPlaylist(null);
        }
      } finally {
        if (active) setSearching(false);
      }
    }, 250);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [searchTerm]);

  async function openPlaylist(playlist: CuratedPlaylist, sourceItem?: CollectionItem | null) {
    if (!playlist.id) return;
    setLoadingSelection(true);
    if (sourceItem) setSelectedItem(sourceItem);
    // On mobile, scroll to the detail panel immediately so user sees loading state
    if (window.innerWidth < 1024 && detailPanelRef.current) {
      detailPanelRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
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
    } finally {
      setLoadingSelection(false);
    }
  }

  function handlePlaySelected() {
    if (!selectedPlaylist?.tracks || selectedPlaylist.tracks.length === 0 || isPlaying) return;
    setIsPlaying(true);
    try {
      setRadioMode(false);
      playQueue(
        selectedPlaylist.tracks.map((track, index) => ({
          id: `curated-hub-${selectedPlaylist.id}-${track.videoId}-${index}`,
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

  const displayItems = useMemo(() => {
    if (searchTerm.trim().length >= 2) {
      return searchResults.map((playlist) => ({
        label: playlist.title,
        query: playlist.title,
        category: playlist.category as CollectionKey,
        tone: playlist.description,
        playlist,
      }));
    }
    return collections;
  }, [collections, searchResults, searchTerm]);

  const isSearching = searchTerm.trim().length >= 2;
  const panelTitle = isSearching
    ? `Search_Results // ${searchTerm.trim()}`
    : COLLECTION_LABELS[collection];

  const selectionTitle = selectedItem?.label || selectedPlaylist?.title || "Curated Set";
  const selectionTone = selectedItem?.tone || selectedPlaylist?.description || "Curated signal";

  if (loadingCollection && collections.length === 0) return null;

  return (
    <div className="w-full max-w-[1080px] mt-14 sm:mt-20">
      <div className="mb-5 sm:mb-6 border-b border-white/[0.06] pb-3">
        <div className="text-[10px] font-mono text-shift5-orange/80 uppercase tracking-[0.2em]">
          Curated_Playlists
        </div>
        <div className="text-[11px] sm:text-[12px] font-mono text-shift5-muted uppercase tracking-wider mt-1">
          Searchable curated sets — mood, era, scene, activity
        </div>
      </div>

      <div className="border border-white/[0.08] bg-white/[0.02] mb-6">
        <div className="p-4 sm:p-5 border-b border-white/[0.06]">
          <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="flex flex-wrap gap-2">
              {(Object.keys(COLLECTION_LABELS) as CollectionKey[]).map((key) => (
                <button
                  key={key}
                  onClick={() => setCollection(key)}
                  className={`px-3 py-2 border text-[10px] font-mono font-bold uppercase tracking-[0.16em] transition-colors ${
                    collection === key && !isSearching
                      ? "border-shift5-orange text-shift5-orange bg-shift5-orange/10"
                      : isSearching
                        ? "border-white/06 text-white/30"
                        : "border-white/10 text-white/60 hover:text-white hover:border-white/25"
                  }`}
                >
                  {COLLECTION_LABELS[key]}
                </button>
              ))}
            </div>

            <div className="border border-white/10 bg-white/[0.02] px-3 py-2 flex items-center gap-3">
              <svg width={12} height={12} viewBox="0 0 16 16" fill="none" className="text-white/40">
                <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
                <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search curated playlists..."
                className="bg-transparent border-0 outline-0 text-[12px] sm:text-[13px] text-white w-full min-w-[220px]"
              />
              {searching && (
                <span className="text-[9px] font-mono uppercase tracking-widest text-white/35 shrink-0">
                  searching
                </span>
              )}
              {isSearching && !searching && (
                <button
                  onClick={() => { setSearchTerm(""); setSearchResults([]); }}
                  className="text-[9px] font-mono uppercase tracking-widest text-white/35 hover:text-shift5-orange shrink-0"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-3">
            {QUICK_QUERIES.map((query) => (
              <button
                key={query}
                onClick={() => setSearchTerm(query)}
                className="px-2.5 py-1 border border-white/10 text-[9px] font-mono uppercase tracking-widest text-white/45 hover:text-white hover:border-white/25 transition-colors"
              >
                {query}
              </button>
            ))}
          </div>
        </div>

        <div className="lg:grid lg:grid-cols-[minmax(0,1.15fr)_380px]">
          <div className="min-w-0">
            <div className="px-4 sm:px-5 py-4 border-b border-white/[0.06] flex items-center justify-between gap-3">
              <div className="text-[10px] font-mono uppercase tracking-[0.16em] text-white/45">
                {panelTitle}
              </div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-shift5-muted">
                {displayItems.length}{totalCount > displayItems.length ? ` / ${totalCount}` : ""} playlists
              </div>
            </div>

            <div className="p-4 sm:p-5 grid gap-4 sm:grid-cols-2">
              {displayItems.map((item) => (
                <CollectionCard
                  key={`${item.category}-${item.playlist?.id || item.query}`}
                  item={item}
                  active={selectedPlaylist?.id === item.playlist?.id}
                  onOpen={() => item.playlist && openPlaylist(item.playlist, item)}
                />
              ))}
            </div>

            {hasMore && searchTerm.trim().length < 2 && (
              <div className="px-4 sm:px-5 pb-5">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="w-full py-3 border border-white/[0.12] text-[10px] font-mono uppercase tracking-[0.18em] text-white/50 hover:border-shift5-orange hover:text-shift5-orange transition-colors disabled:opacity-40"
                >
                  {loadingMore ? "Loading..." : `Load More — ${totalCount - collections.length} remaining`}
                </button>
              </div>
            )}
          </div>

          <div ref={detailPanelRef} className="border-t lg:border-t-0 lg:border-l border-white/[0.06] bg-white/[0.015]">
            <div className="px-4 sm:px-5 py-4 border-b border-white/[0.06]">
              <div className="text-[10px] font-mono text-shift5-orange uppercase tracking-[0.2em]">
                Curated_Set
              </div>
              <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tighter text-white mt-1 truncate">
                {selectionTitle}
              </h3>
              <p className="text-[10px] sm:text-[11px] font-mono text-shift5-muted uppercase tracking-wider mt-1">
                {loadingSelection
                  ? "Resolving playable set..."
                  : selectedPlaylist?.tracks?.length
                    ? `${selectedPlaylist.tracks.length} playable tracks`
                    : "Choose a playlist to inspect"}
              </p>
            </div>

            <div className="px-4 sm:px-5 py-4">
              {selectedPlaylist?.coverUrl ? (
                <div className="relative aspect-[1.3/1] overflow-hidden bg-white/[0.04] border border-white/[0.06] mb-4">
                  <Image
                    src={selectedPlaylist.coverUrl}
                    alt={selectedPlaylist.title}
                    fill
                    sizes="380px"
                    className="object-cover opacity-80"
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-shift5-dark via-shift5-dark/30 to-transparent" />
                </div>
              ) : null}

              <div className="space-y-4">
                <div>
                  <div className="text-[10px] font-mono text-white/35 uppercase tracking-widest mb-2">
                    Why_This_Set
                  </div>
                  <div className="space-y-2">
                    <p className="text-[11px] sm:text-[12px] font-mono uppercase tracking-wide text-shift5-muted">
                      {selectedPlaylist?.description || "Curated around a recognizable mood, era, scene, or activity."}
                    </p>
                    <p className="text-[11px] sm:text-[12px] font-mono uppercase tracking-wide text-shift5-muted">
                      Signal: {selectionTone}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={handlePlaySelected}
                    disabled={!selectedPlaylist?.tracks?.length || isPlaying || loadingSelection}
                    className="px-5 py-3 bg-shift5-orange text-white border-2 border-shift5-orange font-mono text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-white hover:text-shift5-orange active:bg-white active:text-shift5-orange transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isPlaying ? "Loading..." : "Play_Curated_Set"}
                  </button>
                  <SaveCuratedButton
                    name={selectedPlaylist?.title || selectionTitle}
                    description={selectedPlaylist?.description || "Curated playlist from Sonic Atlas"}
                    coverUrl={selectedPlaylist?.coverUrl || null}
                    tracks={selectedPlaylist?.tracks || []}
                  />
                </div>

                <div>
                  <div className="text-[10px] font-mono text-white/35 uppercase tracking-widest mb-2">
                    Queue_Preview
                  </div>
                  {!selectedPlaylist?.tracks?.length ? (
                    <div className="text-[11px] font-mono uppercase tracking-wide text-white/35">
                      {loadingSelection ? "Building the set..." : "Select a playlist to preview the run."}
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[560px] overflow-y-auto pr-1">
                      {selectedPlaylist.tracks.map((track, index) => (
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
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
