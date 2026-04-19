"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useAudio } from "@/contexts/AudioContext";
import SaveCuratedButton from "./SaveCuratedButton";

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

  return (
    <button
      onClick={onOpen}
      className={`group border text-left transition-all duration-300 ${
        active
          ? "border-shift5-orange bg-white/[0.04]"
          : "border-white/10 bg-white/[0.02] hover:border-white/25 active:border-shift5-orange"
      }`}
    >
      <div className="relative aspect-[1.25/1] overflow-hidden bg-white/[0.04]">
        {item.playlist.coverUrl ? (
          <Image
            src={item.playlist.coverUrl}
            alt={item.playlist.title}
            fill
            sizes="(max-width: 640px) 50vw, 25vw"
            className="object-cover opacity-75 group-hover:opacity-90 transition-opacity duration-300"
            unoptimized
          />
        ) : (
          <div className="w-full h-full bg-white/[0.04]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-shift5-dark via-shift5-dark/40 to-transparent" />
        <div className="absolute top-3 left-3 text-[8px] font-mono font-bold uppercase tracking-[0.2em] text-shift5-orange">
          {item.label}
        </div>
        <div className="absolute bottom-3 right-3 text-[8px] font-mono uppercase tracking-widest text-white/70">
          {item.category}
        </div>
      </div>

      <div className="p-3 sm:p-4">
        <div className="text-[13px] sm:text-[14px] font-mono font-bold uppercase tracking-tight text-white truncate">
          {item.playlist.title}
        </div>
        <div className="text-[10px] font-mono uppercase tracking-wider text-shift5-muted truncate mt-1">
          {item.tone}
        </div>
        <div className="text-[10px] text-white/45 mt-3 line-clamp-2 min-h-[2.5rem]">
          {item.playlist.description || "Curated playlist routed through the Sonic Atlas player"}
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
  const [selectedPlaylist, setSelectedPlaylist] = useState<CuratedPlaylist | null>(null);
  const [loadingSelection, setLoadingSelection] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadCollection() {
      setLoadingCollection(true);
      try {
        const res = await fetch(`/api/playlists/collections?collection=${collection}`);
        if (!res.ok) return;
        const data = await res.json();
        if (!active || !Array.isArray(data.collections)) return;
        const nextItems = data.collections.filter((item: CollectionItem) => item.playlist?.id);
        setCollections(nextItems);
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
    return () => {
      active = false;
    };
  }, [collection]);

  useEffect(() => {
    if (searchTerm.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    let active = true;
    const timer = window.setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/playlists/search?q=${encodeURIComponent(searchTerm.trim())}`);
        if (!res.ok) return;
        const data = await res.json();
        if (!active || !Array.isArray(data.playlists)) return;
        setSearchResults(data.playlists);
        if (data.playlists[0]?.id) {
          await openPlaylist(data.playlists[0], {
            label: searchTerm.trim(),
            query: searchTerm.trim(),
            category: collection,
            tone: "search result",
            playlist: data.playlists[0],
          });
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
  }, [collection, searchTerm]);

  async function openPlaylist(playlist: CuratedPlaylist, sourceItem?: CollectionItem | null) {
    if (!playlist.id) return;
    setLoadingSelection(true);
    try {
      const res = await fetch(`/api/playlists/curated/${encodeURIComponent(playlist.id)}/tracks`);
      if (!res.ok) return;
      const data = await res.json();
      if (!Array.isArray(data.tracks) || data.tracks.length === 0) return;

      setSelectedPlaylist({
        ...playlist,
        tracks: data.tracks,
      });
      if (sourceItem) {
        setSelectedItem(sourceItem);
      }
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
        label: searchTerm.trim(),
        query: searchTerm.trim(),
        category: collection,
        tone: "search result",
        playlist,
      }));
    }
    return collections;
  }, [collection, collections, searchResults, searchTerm]);

  const panelTitle = searchTerm.trim().length >= 2
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
                  onClick={() => {
                    setCollection(key);
                    setSearchTerm("");
                    setSearchResults([]);
                  }}
                  className={`px-3 py-2 border text-[10px] font-mono font-bold uppercase tracking-[0.16em] transition-colors ${
                    collection === key && searchTerm.trim().length < 2
                      ? "border-shift5-orange text-shift5-orange bg-shift5-orange/10"
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
                <span className="text-[9px] font-mono uppercase tracking-widest text-white/35">
                  searching
                </span>
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
                {displayItems.length} playlists
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
          </div>

          <div className="border-t lg:border-t-0 lg:border-l border-white/[0.06] bg-white/[0.015]">
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
                    <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                      {selectedPlaylist.tracks.slice(0, 12).map((track, index) => (
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
