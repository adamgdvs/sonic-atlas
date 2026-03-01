"use client";

import { useState, useEffect, useRef, use } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  getSimilarArtists,
  getArtistPreviewData,
  getArtistInfo,
  getDiscography,
  getAlbumTracks,
  type SimilarArtistResult,
  type ArtistInfo,
  type Album,
  type PreviewTrack,
  type Discography,
  type AlbumTrack,
} from "@/lib/api";
import { getGenreColor, truncateBio } from "@/lib/utils";
import Header from "@/components/Header";
import SearchBar from "@/components/SearchBar";
import ArtistInitials from "@/components/ArtistInitials";
import GenreTag from "@/components/GenreTag";
import FilterPill from "@/components/FilterPill";
import GraphSwitch, {
  GRAPH_MODES,
  type GraphMode,
} from "@/components/GraphSwitch";
import SimilarityBar from "@/components/SimilarityBar";
import Toast from "@/components/Toast";
import { useAudio } from "@/contexts/AudioContext";
import { Skeleton } from "@/components/Skeleton";
import { useSession, signIn } from "next-auth/react";
import { Heart } from "lucide-react";
import StreamingLinks from "@/components/StreamingLinks";
import Breadcrumbs from "@/components/Breadcrumbs";
import { useJourney } from "@/contexts/JourneyContext";

// ─── Sub-components ──────────────────────────────────────────────

function GraphModeDropdown({
  value,
  onChange,
}: {
  value: GraphMode;
  onChange: (mode: GraphMode) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const current = GRAPH_MODES.find((m) => m.key === value)!;

  return (
    <div ref={ref} className="relative inline-block">
      <button
        onClick={() => setOpen((v) => !v)}
        className="text-[11px] font-semibold text-[#9CA3AF] uppercase flex items-center gap-1.5 cursor-pointer hover:text-[#1D1D1F] transition-colors"
        style={{ letterSpacing: "0.08em", background: "none", border: "none", padding: 0 }}
      >
        {current.label}
        <svg width={8} height={8} viewBox="0 0 8 8" fill="currentColor" style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.15s ease" }}>
          <polygon points="0,2 4,6 8,2" />
        </svg>
      </button>
      {open && (
        <div
          className="absolute top-full left-0 mt-1.5 bg-white border border-[#E5E5E5] shadow-sm z-50 min-w-[180px]"
          style={{ animation: "fadeIn 0.1s ease" }}
        >
          {GRAPH_MODES.map((m) => (
            <button
              key={m.key}
              onClick={() => { onChange(m.key); setOpen(false); }}
              className={`w-full text-left px-3 py-2 cursor-pointer transition-colors border-none ${m.key === value ? "bg-[#F8F8FA]" : "bg-white hover:bg-[#FAFAFA]"
                }`}
              style={{ display: "block" }}
            >
              <span className={`text-xs font-semibold block ${m.key === value ? "text-[#1D1D1F]" : "text-[#6B7280]"}`}>
                {m.label}
              </span>
              <span className="text-[10px] text-[#9CA3AF] block">
                {m.description}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}


function ArtistAvatar({
  name,
  image,
  size = 44,
}: {
  name: string;
  image?: string | null;
  size?: number;
}) {
  if (image) {
    return (
      <Image
        src={image}
        alt={name}
        width={size}
        height={size}
        className="object-cover shrink-0"
        style={{ width: size, height: size }}
        unoptimized
      />
    );
  }
  return <ArtistInitials name={name} size={size} />;
}

function GenreMap({
  genreList,
  similar,
}: {
  genreList: string[];
  similar: { genres: string[] }[];
}) {
  return (
    <div>
      <div
        className="text-[11px] font-semibold text-[#9CA3AF] uppercase mb-3"
        style={{ letterSpacing: "0.08em" }}
      >
        Genre Map
      </div>
      {genreList.map((genre) => {
        const count = similar.filter((a) => a.genres.includes(genre)).length;
        return (
          <div key={genre} className="flex items-center gap-2 mb-1.5">
            <div
              className="w-1.5 h-1.5 shrink-0"
              style={{ backgroundColor: getGenreColor(genre) }}
            />
            <span className="text-xs text-[#6B7280] flex-1">{genre}</span>
            <span className="text-[11px] text-[#C4C4C4] font-[family-name:var(--font-dm-mono)]">
              {count}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function DiscographyPanel({
  albums,
  topTracks,
  playingUrl,
  onPlay,
  onStop,
  albumTracksCache,
  onAlbumClick,
  expandedAlbum,
  bio,
}: {
  albums: Album[];
  topTracks: PreviewTrack[];
  playingUrl: string | null;
  onPlay: (url: string, title?: string) => void;
  onStop: () => void;
  albumTracksCache: Record<number, AlbumTrack[]>;
  onAlbumClick: (albumId: number) => void;
  expandedAlbum: number | null;
  bio?: string;
}) {
  return (
    <div>
      {/* Bio snippet */}
      {bio && (
        <p className="text-xs text-[#6B7280] leading-relaxed mb-4">
          {truncateBio(bio)}
        </p>
      )}

      {/* Top tracks */}
      {topTracks.length > 0 && (
        <div className="mb-4">
          <div
            className="text-[11px] font-semibold text-[#9CA3AF] uppercase mb-2"
            style={{ letterSpacing: "0.08em" }}
          >
            Popular Tracks
          </div>
          <div className="max-w-[500px]">
            {topTracks.slice(0, 5).map((t, i) => {
              const isPlaying = playingUrl === t.preview;
              const mins = Math.floor(t.duration / 60);
              const secs = t.duration % 60;
              return (
                <div
                  key={t.id}
                  className="flex items-center gap-3 py-2 px-1 hover:bg-[#F8F8FA] transition-colors cursor-pointer"
                  onClick={() =>
                    isPlaying ? onStop() : onPlay(t.preview, t.title)
                  }
                >
                  <span
                    className={`w-6 text-center text-[11px] font-[family-name:var(--font-dm-mono)] ${isPlaying ? "text-[#1D1D1F] font-bold" : "text-[#C4C4C4]"}`}
                  >
                    {isPlaying ? "▪▪" : i + 1}
                  </span>
                  <span
                    className={`text-sm flex-1 truncate ${isPlaying ? "text-[#1D1D1F] font-medium" : "text-[#1D1D1F]"}`}
                  >
                    {t.title}
                  </span>
                  <span className="text-[11px] text-[#C4C4C4] font-[family-name:var(--font-dm-mono)]">
                    {mins}:{secs.toString().padStart(2, "0")}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Albums — vertical list with expandable track lists */}
      {albums.length > 0 && (
        <div>
          <div
            className="text-[11px] font-semibold text-[#9CA3AF] uppercase mb-3"
            style={{ letterSpacing: "0.08em" }}
          >
            Discography
          </div>
          <div className="space-y-0">
            {albums.map((a) => {
              const year = a.release_date?.slice(0, 4);
              const isExpanded = expandedAlbum === a.id;
              const tracks = albumTracksCache[a.id];
              return (
                <div key={a.id}>
                  <div
                    className="flex items-center gap-3 py-2.5 px-1 hover:bg-[#F8F8FA] transition-colors cursor-pointer"
                    onClick={() => onAlbumClick(a.id)}
                  >
                    <div className="w-[56px] h-[56px] bg-[#F0F0F0] shrink-0 overflow-hidden">
                      {a.cover_medium ? (
                        <Image
                          src={a.cover_medium}
                          alt={a.title}
                          width={56}
                          height={56}
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[#C4C4C4] text-[10px]">
                          No art
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#1D1D1F] truncate">
                        {a.title}
                      </p>
                      <p className="text-[11px] text-[#9CA3AF]">
                        {year}
                        {a.nb_tracks > 0 && ` · ${a.nb_tracks} tracks`}
                      </p>
                    </div>
                    <span className="text-[11px] text-[#C4C4C4] shrink-0">
                      {isExpanded ? "▲" : "▼"}
                    </span>
                  </div>
                  {/* Track list */}
                  <div
                    className="transition-all duration-200 ease-in-out"
                    style={{
                      display: "grid",
                      gridTemplateRows: isExpanded ? "1fr" : "0fr",
                      opacity: isExpanded ? 1 : 0,
                    }}
                  >
                    <div className="overflow-hidden">
                      <div className="pl-[72px] pr-2 pb-3">
                        {!tracks ? (
                          <p className="text-[11px] text-[#9CA3AF] py-2">
                            Loading tracks...
                          </p>
                        ) : tracks.length === 0 ? (
                          <p className="text-[11px] text-[#9CA3AF] py-2">
                            No tracks available
                          </p>
                        ) : (
                          tracks.map((t, i) => {
                            const isPlaying = playingUrl === t.preview;
                            const mins = Math.floor(t.duration / 60);
                            const secs = t.duration % 60;
                            return (
                              <div
                                key={t.id}
                                className="flex items-center gap-3 py-1.5 hover:bg-[#F8F8FA] transition-colors cursor-pointer"
                                onClick={() => {
                                  if (t.preview) {
                                    isPlaying ? onStop() : onPlay(t.preview, t.title);
                                  }
                                }}
                              >
                                <span
                                  className={`w-5 text-center text-[11px] font-[family-name:var(--font-dm-mono)] ${isPlaying ? "text-[#1D1D1F] font-bold" : "text-[#C4C4C4]"}`}
                                >
                                  {isPlaying ? "▪▪" : i + 1}
                                </span>
                                <span
                                  className={`text-xs flex-1 truncate ${isPlaying ? "text-[#1D1D1F] font-medium" : "text-[#6B7280]"}`}
                                >
                                  {t.title}
                                </span>
                                {t.preview && (
                                  <span className="text-[10px] text-[#C4C4C4]">
                                    {isPlaying ? "■" : "▶"}
                                  </span>
                                )}
                                <span className="text-[11px] text-[#C4C4C4] font-[family-name:var(--font-dm-mono)]">
                                  {mins}:{secs.toString().padStart(2, "0")}
                                </span>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function SimilarCard({
  artist,
  index,
  onExplore,
  isHighlighted,
  onHover,
  previewUrl,
  isPlaying,
  onPlay,
  onStop,
  onGenreClick,
  discography,
  discographyOpen,
  onToggleDiscography,
  playingUrl,
  bio,
  albumTracksCache,
  onAlbumClick,
  expandedAlbum,
  bookmarkedArtists,
  bookmarkingIds,
  onToggleBookmark,
}: {
  artist: SimilarArtistResult;
  index: number;
  onExplore: (name: string) => void;
  isHighlighted: boolean;
  onHover: (id: string | null) => void;
  previewUrl?: string;
  isPlaying: boolean;
  onPlay: (url: string, title?: string, artist?: string, image?: string | null) => void;
  onStop: () => void;
  onGenreClick: (genre: string) => void;
  discography: Discography | null;
  discographyOpen: boolean;
  onToggleDiscography: (name: string) => void;
  playingUrl: string | null;
  bio?: string;
  albumTracksCache: Record<number, AlbumTrack[]>;
  onAlbumClick: (albumId: number) => void;
  expandedAlbum: number | null;
  bookmarkedArtists: Set<string>;
  bookmarkingIds: Set<string>;
  onToggleBookmark: (id: string, name: string, img?: string | null, genres?: string[]) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const accordionRef = useRef<HTMLDivElement>(null);
  const bg = isHighlighted ? "#F8F8FA" : hovered ? "#FCFCFC" : "#FFF";
  const cardId = artist.mbid || artist.name;
  const isBookmarked = bookmarkedArtists.has(artist.name);
  const isBookmarking = bookmarkingIds.has(cardId);

  return (
    <div
      style={{
        animation: `fadeSlideIn 0.3s ease ${index * 0.04}s both`,
      }}
    >
      <div
        onMouseEnter={() => {
          setHovered(true);
          onHover(cardId);
        }}
        onMouseLeave={() => {
          setHovered(false);
          onHover(null);
        }}
        className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-3.5 border-b border-[#F0F0F0] cursor-default p-4 sm:px-5 sm:py-4"
        style={{
          backgroundColor: bg,
          transition: "background-color 0.15s ease",
        }}
      >
        <div className="flex items-center gap-3 sm:gap-3.5 flex-1 min-w-0">
          <ArtistAvatar
            name={artist.name}
            image={artist.image}
            size={44}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5 mb-1 flex-wrap">
              <span
                onClick={() => onExplore(artist.name)}
                className="text-[15px] font-semibold text-[#1D1D1F] cursor-pointer hover:underline"
                style={{ letterSpacing: "-0.01em" }}
              >
                {artist.name}
              </span>
              <StreamingLinks artistName={artist.name} size={18} />
              <SimilarityBar value={artist.match} />
            </div>
            {artist.genres.length > 0 && (
              <div className="mb-1.5">
                {artist.genres.slice(0, 5).map((g) => (
                  <GenreTag key={g} genre={g} onClick={onGenreClick} />
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-1.5 items-center sm:items-start sm:pt-0.5 ml-[58px] sm:ml-0">
          {previewUrl && (
            <button
              onClick={() => (isPlaying ? onStop() : onPlay(previewUrl, "Preview", artist.name, artist.image))}
              className={`flex items-center justify-center border cursor-pointer transition-all duration-150 shrink-0 ${isPlaying
                ? "border-[#1D1D1F] bg-[#1D1D1F] text-white"
                : "border-[#E5E5E5] bg-[#FAFAFA] text-[#1D1D1F] hover:bg-[#1D1D1F] hover:text-white hover:border-[#1D1D1F]"
                }`}
              style={{ width: 28, height: 28 }}
              title={isPlaying ? "Stop" : "Play"}
            >
              {isPlaying ? (
                <svg
                  width={10}
                  height={10}
                  viewBox="0 0 12 12"
                  fill="currentColor"
                >
                  <rect x="1" y="1" width="4" height="10" />
                  <rect x="7" y="1" width="4" height="10" />
                </svg>
              ) : (
                <svg
                  width={10}
                  height={10}
                  viewBox="0 0 12 12"
                  fill="currentColor"
                >
                  <polygon points="2,0 12,6 2,12" />
                </svg>
              )}
            </button>
          )}
          <button
            onClick={() => onToggleBookmark(cardId, artist.name, artist.image, artist.genres)}
            disabled={isBookmarking}
            className={`flex items-center justify-center border transition-all duration-150 rounded-sm cursor-pointer ${isBookmarked
              ? "border-[#FF4B4B] bg-[#FFF0F0] text-[#FF4B4B]"
              : "border-[#E5E5E5] bg-[#FAFAFA] text-[#9CA3AF] hover:text-[#1D1D1F] hover:border-[#D1D5DB]"
              }`}
            style={{ width: 32, height: 32 }}
            title={isBookmarked ? "Remove bookmark" : "Bookmark artist"}
          >
            <Heart
              size={14}
              className={isBookmarked ? "fill-current" : ""}
              strokeWidth={isBookmarked ? 2.5 : 2}
            />
          </button>
          <button
            onClick={() => onToggleDiscography(artist.name)}
            className={`text-[11px] font-semibold border cursor-pointer whitespace-nowrap transition-all duration-150 ${discographyOpen
              ? "border-[#1D1D1F] bg-[#1D1D1F] text-white"
              : "border-[#E5E5E5] bg-[#FAFAFA] text-[#1D1D1F] hover:bg-[#1D1D1F] hover:text-white hover:border-[#1D1D1F]"
              }`}
            style={{ padding: "5px 12px", letterSpacing: "0.03em" }}
          >
            {discographyOpen ? "Close ↑" : "Explore ↓"}
          </button>
        </div>
      </div>

      {/* Accordion discography */}
      <div
        ref={accordionRef}
        className="transition-all duration-300 ease-in-out"
        style={{
          display: "grid",
          gridTemplateRows: discographyOpen ? "1fr" : "0fr",
          opacity: discographyOpen ? 1 : 0,
        }}
      >
        <div className="overflow-hidden">
          <div className="px-5 py-4 bg-[#FAFAFA] border-b border-[#F0F0F0]">
            {discography ? (
              <DiscographyPanel
                albums={discography.albums}
                topTracks={discography.topTracks}
                playingUrl={playingUrl}
                onPlay={onPlay}
                onStop={onStop}
                albumTracksCache={albumTracksCache}
                onAlbumClick={onAlbumClick}
                expandedAlbum={expandedAlbum}
                bio={bio}
              />
            ) : (
              <div className="text-xs text-[#9CA3AF] py-4">
                Loading discography...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────

const FILTERS = [
  { key: "all", label: "All" },
  { key: "sound", label: "Sound (Sonic)" },
  { key: "genre", label: "Genre Overlap" },
  { key: "audience", label: "Audience" },
] as const;

export default function ArtistPage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name: rawName } = use(params);
  const artistName = decodeURIComponent(rawName);
  const router = useRouter();
  const { pushNode } = useJourney();

  useEffect(() => {
    pushNode({
      name: artistName,
      type: "artist",
      url: `/artist/${encodeURIComponent(artistName)}`,
    });
  }, [artistName, pushNode]);

  // Data state
  const [similar, setSimilar] = useState<SimilarArtistResult[]>([]);
  const [artistInfo, setArtistInfo] = useState<ArtistInfo | null>(null);
  const [primaryDisco, setPrimaryDisco] = useState<Discography | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI state
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState("all");
  const [genreFilter, setGenreFilter] = useState<string | null>(null);
  const [constellationExpanded, setConstellationExpanded] = useState(false);
  const [graphMode, setGraphMode] = useState<GraphMode>("cloud");
  const { playTrack, currentTrack, isPlaying, togglePlayPause } = useAudio();
  const playingUrl = isPlaying ? (currentTrack?.url ?? null) : null;
  const [previewMap, setPreviewMap] = useState<Record<string, string>>({});
  const [primaryDiscoOpen, setPrimaryDiscoOpen] = useState(false);
  const [openDisco, setOpenDisco] = useState<string | null>(null);

  const { data: session } = useSession();
  const [bookmarkedArtists, setBookmarkedArtists] = useState<Set<string>>(new Set());
  const [bookmarkingIds, setBookmarkingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (session?.user) {
      fetch("/api/bookmarks")
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setBookmarkedArtists(
              new Set(data.map((b: any) => b.name))
            );
          }
        })
        .catch((err) => console.error("Failed to load bookmarks", err));
    }
  }, [session]);

  const handleToggleBookmark = async (id: string, name: string, img?: string | null, genres?: string[]) => {
    if (!session?.user) {
      signIn();
      return;
    }

    setBookmarkingIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });

    const isCurrentlyBookmarked = bookmarkedArtists.has(name);

    try {
      const url = isCurrentlyBookmarked ? `/api/bookmarks?artistId=${id}` : "/api/bookmarks";
      const res = await fetch(url, {
        method: isCurrentlyBookmarked ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: isCurrentlyBookmarked ? null : JSON.stringify({
          name,
          artistId: id,
          imageUrl: img,
          genres: genres || []
        }),
      });
      if (res.ok) {
        setBookmarkedArtists((prev) => {
          const next = new Set(prev);
          if (isCurrentlyBookmarked) next.delete(name);
          else next.add(name);
          return next;
        });
      }
    } finally {
      setBookmarkingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };
  const [discoCache, setDiscoCache] = useState<Record<string, Discography>>(
    {}
  );
  const [infoCache, setInfoCache] = useState<Record<string, ArtistInfo>>({});
  const [albumTracksCache, setAlbumTracksCache] = useState<
    Record<number, AlbumTrack[]>
  >({});
  const [expandedAlbum, setExpandedAlbum] = useState<number | null>(null);
  const [expandedAlbumPrimary, setExpandedAlbumPrimary] = useState<
    number | null
  >(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const primaryAccordionRef = useRef<HTMLDivElement>(null);

  // Fetch data
  useEffect(() => {
    setLoading(true);
    setError(null);
    setSimilar([]);
    setArtistInfo(null);
    setPrimaryDisco(null);
    setActiveFilter("all");
    setGenreFilter(null);
    setHighlightedId(null);
    setPreviewMap({});
    setPrimaryDiscoOpen(false);
    setOpenDisco(null);
    setDiscoCache({});
    setInfoCache({});
    setAlbumTracksCache({});
    setExpandedAlbum(null);
    setExpandedAlbumPrimary(null);
    handleStop();

    Promise.all([
      getSimilarArtists(artistName, 30),
      getArtistInfo(artistName),
      getDiscography(artistName),
    ])
      .then(([simData, infoData, discoData]) => {
        if (simData.length === 0) setError("No similar artists found");
        setSimilar(simData);
        setArtistInfo(infoData);
        if (discoData) setPrimaryDisco(discoData);
      })
      .catch(() => setError("Failed to load artist data"))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [artistName]);

  // Fetch previews for similar artists in batches to respect Deezer rate limits
  useEffect(() => {
    if (similar.length === 0) return;
    let cancelled = false;

    async function fetchPreviews() {
      for (let i = 0; i < similar.length; i += 3) {
        if (cancelled) return;
        if (i > 0) await new Promise((r) => setTimeout(r, 800));
        if (cancelled) return;
        const batch = similar.slice(i, i + 3);
        const results = await Promise.allSettled(
          batch.map(async (a) => {
            const data = await getArtistPreviewData(a.name);
            return { key: a.mbid || a.name, url: data.tracks[0]?.preview || null };
          })
        );
        if (cancelled) return;
        setPreviewMap((prev) => {
          const next = { ...prev };
          for (const r of results) {
            if (r.status === "fulfilled" && r.value.url) {
              next[r.value.key] = r.value.url;
            }
          }
          return next;
        });
      }
    }

    fetchPreviews();
    return () => { cancelled = true; };
  }, [similar]);

  // Filter
  const filteredSimilar = similar.filter((a) => {
    if (genreFilter) return a.genres.includes(genreFilter);
    if (activeFilter === "all") return true;

    if (activeFilter === "sound") return a.match > 0.4;

    if (activeFilter === "genre") {
      const centerGenres = artistInfo?.genres || [];
      return a.genres.some(g => centerGenres.includes(g));
    }

    if (activeFilter === "audience") return a.match <= 0.4;

    return true;
  });

  const constellationData = similar.map((a) => ({
    id: a.mbid || a.name,
    name: a.name,
    genres: a.genres,
    similarity: a.match,
  }));

  const genreList = [
    ...new Set(similar.flatMap((a) => a.genres)),
  ].slice(0, 12);

  // Handlers
  const handleExplore = (name: string) => {
    router.push(`/artist/${encodeURIComponent(name)}`);
  };

  const handleGenreClick = (genre: string) => {
    if (genreFilter === genre) {
      setGenreFilter(null);
      setActiveFilter("all");
    } else {
      setGenreFilter(genre);
      setActiveFilter("all");
    }
  };

  const handlePlay = (url: string, title?: string, artist?: string, coverUrl?: string | null) => {
    if (currentTrack?.url === url) {
      togglePlayPause();
      return;
    }
    playTrack({
      url,
      title: title || "Top Track",
      artist: artist || artistName,
      coverUrl: coverUrl || artistInfo?.image || null
    });
  };

  const handleStop = () => {
    togglePlayPause();
  };

  const handleToggleDisco = async (name: string) => {
    if (openDisco === name) {
      setOpenDisco(null);
      return;
    }
    setOpenDisco(name);
    setExpandedAlbum(null);
    if (!discoCache[name]) {
      const disco = await getDiscography(name);
      if (disco) {
        setDiscoCache((prev) => ({ ...prev, [name]: disco }));
      }
    }
    if (!infoCache[name]) {
      const info = await getArtistInfo(name);
      if (info) {
        setInfoCache((prev) => ({ ...prev, [name]: info }));
      }
    }
  };

  const handleAlbumClick = async (albumId: number) => {
    if (expandedAlbum === albumId) {
      setExpandedAlbum(null);
      return;
    }
    setExpandedAlbum(albumId);
    if (!albumTracksCache[albumId]) {
      const tracks = await getAlbumTracks(albumId);
      setAlbumTracksCache((prev) => ({ ...prev, [albumId]: tracks }));
    }
  };

  const handleAlbumClickPrimary = async (albumId: number) => {
    if (expandedAlbumPrimary === albumId) {
      setExpandedAlbumPrimary(null);
      return;
    }
    setExpandedAlbumPrimary(albumId);
    if (!albumTracksCache[albumId]) {
      const tracks = await getAlbumTracks(albumId);
      setAlbumTracksCache((prev) => ({ ...prev, [albumId]: tracks }));
    }
  };

  // Removed auto-teardown of audio since it's global now!

  // Primary artist preview (first top track)
  const primaryPreview = primaryDisco?.topTracks?.[0]?.preview || null;

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <Breadcrumbs />

      {/* Search bar */}
      <div className="flex items-center gap-3 border-b border-[#F0F0F0] px-4 sm:px-10 py-4">
        <button
          onClick={() => router.push("/")}
          className="border-none bg-none cursor-pointer text-lg text-[#9CA3AF] p-1 hover:text-[#1D1D1F] transition-colors"
        >
          ←
        </button>
        <div className="flex-1 max-w-[360px]">
          <SearchBar
            onSelectArtist={handleExplore}
            onSelectGenre={(name) => router.push(`/genre/${encodeURIComponent(name)}`)}
            compact
          />
        </div>
      </div>

      <div
        className={`mx-auto transition-all duration-300 ${genreFilter ? "max-w-[1600px]" : "max-w-[1200px]"}`}
        style={{ animation: "fadeIn 0.3s ease" }}
      >
        {/* ─── Artist Header ─────────────────────────────── */}
        <div className="border-b border-[#F0F0F0] px-4 sm:px-10 py-6 sm:pt-8 sm:pb-6">
          <div className="flex items-start gap-4 sm:gap-5">
            <ArtistAvatar
              name={artistName}
              image={artistInfo?.image}
              size={72}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <h2
                  className="text-xl sm:text-[28px] font-semibold text-[#1D1D1F] leading-none"
                  style={{ letterSpacing: "-0.03em" }}
                >
                  {artistName}
                </h2>
                <StreamingLinks artistName={artistName} size={24} className="mt-0.5" />
              </div>
              {artistInfo && artistInfo.genres.length > 0 && (
                <div className="mb-2">
                  {artistInfo.genres.map((g) => (
                    <GenreTag
                      key={g}
                      genre={g}
                      onClick={handleGenreClick}
                      active={genreFilter === g}
                    />
                  ))}
                </div>
              )}
              {artistInfo && (
                <div className="flex flex-wrap gap-4 text-[11px] text-[#9CA3AF]">
                  {artistInfo.listeners > 0 && (
                    <span>
                      <span className="font-semibold text-[#6B7280]">
                        {(artistInfo.listeners / 1000).toFixed(0)}K
                      </span>{" "}
                      listeners
                    </span>
                  )}
                  {artistInfo.nbAlbums > 0 && (
                    <span>
                      <span className="font-semibold text-[#6B7280]">
                        {artistInfo.nbAlbums}
                      </span>{" "}
                      albums
                    </span>
                  )}
                  {similar.length > 0 && (
                    <span>
                      <span className="font-semibold text-[#6B7280]">
                        {similar.length}
                      </span>{" "}
                      similar
                    </span>
                  )}
                </div>
              )}
              {artistInfo?.bio && (
                <p className="text-xs text-[#6B7280] leading-relaxed mt-2 max-w-[600px]">
                  {truncateBio(artistInfo.bio)}
                </p>
              )}
            </div>
            {/* Play + Explore buttons for primary artist */}
            <div className="flex gap-1.5 shrink-0">
              {primaryPreview && (
                <button
                  onClick={() =>
                    playingUrl === primaryPreview
                      ? handleStop()
                      : handlePlay(primaryPreview, primaryDisco?.topTracks?.[0]?.title, artistName, artistInfo?.image)
                  }
                  className={`flex items-center justify-center border cursor-pointer transition-all duration-150 ${playingUrl === primaryPreview
                    ? "border-[#1D1D1F] bg-[#1D1D1F] text-white"
                    : "border-[#E5E5E5] bg-[#FAFAFA] text-[#1D1D1F] hover:bg-[#1D1D1F] hover:text-white hover:border-[#1D1D1F]"
                    }`}
                  style={{ width: 36, height: 36 }}
                  title={
                    playingUrl === primaryPreview ? "Stop" : "Play preview"
                  }
                >
                  {playingUrl === primaryPreview ? (
                    <svg
                      width={12}
                      height={12}
                      viewBox="0 0 12 12"
                      fill="currentColor"
                    >
                      <rect x="1" y="1" width="4" height="10" />
                      <rect x="7" y="1" width="4" height="10" />
                    </svg>
                  ) : (
                    <svg
                      width={12}
                      height={12}
                      viewBox="0 0 12 12"
                      fill="currentColor"
                    >
                      <polygon points="2,0 12,6 2,12" />
                    </svg>
                  )}
                </button>
              )}
              <button
                onClick={() => setPrimaryDiscoOpen((v) => !v)}
                className={`text-[11px] font-semibold border cursor-pointer whitespace-nowrap transition-all duration-150 ${primaryDiscoOpen
                  ? "border-[#1D1D1F] bg-[#1D1D1F] text-white"
                  : "border-[#E5E5E5] bg-[#FAFAFA] text-[#1D1D1F] hover:bg-[#1D1D1F] hover:text-white hover:border-[#1D1D1F]"
                  }`}
                style={{
                  padding: "8px 14px",
                  letterSpacing: "0.03em",
                  height: 36,
                }}
              >
                {primaryDiscoOpen ? "Close ↑" : "Explore ↓"}
              </button>
              {artistInfo && (
                <button
                  onClick={() => handleToggleBookmark(artistInfo.deezerId?.toString() || artistName, artistName, artistInfo.image, artistInfo.genres)}
                  disabled={bookmarkingIds.has(artistInfo.deezerId?.toString() || "primary")}
                  className={`flex items-center justify-center border cursor-pointer transition-all duration-150 rounded-sm ${bookmarkedArtists.has(artistName)
                    ? "border-[#FF4B4B] bg-[#FFF0F0] text-[#FF4B4B]"
                    : "border-[#E5E5E5] bg-[#FAFAFA] text-[#9CA3AF] hover:text-[#1D1D1F] hover:border-[#D1D5DB]"
                    }`}
                  style={{ width: 36, height: 36 }}
                  title={bookmarkedArtists.has(artistName) ? "Remove bookmark" : "Bookmark artist"}
                >
                  <Heart
                    size={16}
                    className={bookmarkedArtists.has(artistName) ? "fill-current" : ""}
                    strokeWidth={bookmarkedArtists.has(artistName) ? 2.5 : 2}
                  />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Primary artist discography accordion */}
        <div
          ref={primaryAccordionRef}
          className="transition-all duration-300 ease-in-out"
          style={{
            display: "grid",
            gridTemplateRows: primaryDiscoOpen ? "1fr" : "0fr",
            opacity: primaryDiscoOpen ? 1 : 0,
          }}
        >
          <div className="overflow-hidden">
            <div className="px-4 sm:px-10 py-5 bg-[#FAFAFA] border-b border-[#F0F0F0]">
              {primaryDisco ? (
                <DiscographyPanel
                  albums={primaryDisco.albums}
                  topTracks={primaryDisco.topTracks}
                  playingUrl={playingUrl}
                  onPlay={handlePlay}
                  onStop={handleStop}
                  albumTracksCache={albumTracksCache}
                  onAlbumClick={handleAlbumClickPrimary}
                  expandedAlbum={expandedAlbumPrimary}
                />
              ) : (
                <div className="text-xs text-[#9CA3AF] py-4">
                  Loading discography...
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Loading Skeleton */}
        {loading && (
          <div className="animate-pulse">
            {/* Header Skeleton */}
            <div className="border-b border-[#F0F0F0] px-4 sm:px-10 py-6 sm:pt-8 sm:pb-6 flex items-start gap-4 sm:gap-5">
              <Skeleton className="w-[72px] h-[72px] rounded-full shrink-0" />
              <div className="flex-1">
                <Skeleton className="w-1/3 h-8 max-w-[200px] mb-3" />
                <div className="flex gap-2 mb-3">
                  <Skeleton className="w-16 h-6 rounded-full" />
                  <Skeleton className="w-20 h-6 rounded-full" />
                </div>
                <Skeleton className="w-2/3 max-w-[400px] h-3 mb-1.5" />
                <Skeleton className="w-1/2 max-w-[300px] h-3" />
              </div>
              <div className="flex gap-1.5 shrink-0">
                <Skeleton className="w-[36px] h-[36px] rounded-sm" />
                <Skeleton className="w-[84px] h-[36px] rounded-sm" />
              </div>
            </div>

            <div className="flex flex-col lg:flex-row">
              {/* Cards Skeleton */}
              <div className="flex-1 border-r border-[#F0F0F0]">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-3.5 border-b border-[#F0F0F0] p-4 sm:px-5 sm:py-4">
                    <div className="flex items-center gap-3 sm:gap-3.5 flex-1 w-full">
                      <Skeleton className="w-[44px] h-[44px] rounded-full shrink-0" />
                      <div className="flex-1 w-full">
                        <div className="flex items-center gap-2 mb-2.5">
                          <Skeleton className="w-1/3 h-4 max-w-[120px]" />
                          <Skeleton className="w-8 h-1.5 rounded-full" />
                        </div>
                        <div className="flex gap-1.5">
                          <Skeleton className="w-14 h-5 rounded-full" />
                          <Skeleton className="w-16 h-5 rounded-full" />
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1.5 items-center sm:items-start ml-[58px] sm:ml-0">
                      <Skeleton className="w-[28px] h-[28px] rounded-sm" />
                      <Skeleton className="w-[72px] h-[28px] rounded-sm" />
                    </div>
                  </div>
                ))}
              </div>

              {/* Sidebar Skeleton (desktop) */}
              <div className="hidden lg:block w-[360px] shrink-0 p-5">
                <div className="flex items-center justify-between mb-4">
                  <Skeleton className="w-24 h-4" />
                  <Skeleton className="w-16 h-6 rounded-sm" />
                </div>
                <Skeleton className="w-full aspect-square rounded-full mb-6" />
                <Skeleton className="w-full h-24 rounded-sm mb-4" />
                <Skeleton className="w-full h-32 rounded-sm" />
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="flex flex-col items-center justify-center py-20 px-5">
            <p className="text-sm text-[#9CA3AF] mb-4">{error}</p>
            <button
              onClick={() => router.push("/")}
              className="text-sm font-semibold border border-[#1D1D1F] bg-[#1D1D1F] text-white px-6 py-2 cursor-pointer hover:bg-white hover:text-[#1D1D1F] transition-all duration-150"
            >
              ← Back to search
            </button>
          </div>
        )}

        {/* ─── Similar Artists ────────────────────────────── */}
        {!loading && similar.length > 0 && (
          <>
            {/* Expanded constellation */}
            {constellationExpanded && (
              <div
                className="border-b border-[#F0F0F0] bg-[#FAFAFA]"
                style={{ animation: "fadeIn 0.2s ease" }}
              >
                <div className="flex items-center justify-between px-4 sm:px-10 pt-5 pb-2">
                  <GraphModeDropdown value={graphMode} onChange={setGraphMode} />
                  <button
                    onClick={() => setConstellationExpanded(false)}
                    className="text-[11px] font-semibold text-[#9CA3AF] cursor-pointer border border-[#E5E5E5] bg-white transition-all duration-150 hover:text-[#1D1D1F] hover:border-[#1D1D1F]"
                    style={{ padding: "4px 12px", letterSpacing: "0.03em" }}
                  >
                    Collapse ↑
                  </button>
                </div>
                <div className="flex flex-col items-center lg:flex-row lg:items-start lg:justify-center gap-6 lg:gap-12 px-4 sm:px-10 pb-6">
                  <div className="lg:hidden flex justify-center">
                    <GraphSwitch
                      center={artistName}
                      centerGenres={artistInfo?.genres}
                      similar={constellationData}
                      highlightedId={highlightedId}
                      onHover={setHighlightedId}
                      onExplore={handleExplore}
                      size={280}
                      mode={graphMode}
                    />
                  </div>
                  <div className="hidden lg:block">
                    <GraphSwitch
                      center={artistName}
                      centerGenres={artistInfo?.genres}
                      similar={constellationData}
                      highlightedId={highlightedId}
                      onHover={setHighlightedId}
                      onExplore={handleExplore}
                      size={520}
                      mode={graphMode}
                    />
                  </div>
                  <div className="pt-0 lg:pt-4 min-w-[180px] w-full lg:w-auto">
                    <div className="text-[11px] text-[#C4C4C4] leading-relaxed mb-5">
                      Inner ring = top matches.
                      <br />
                      Outer ring = extended network.
                      <br />
                      Colors = primary genre. Click to explore.
                    </div>
                    {genreList.length > 0 && (
                      <GenreMap genreList={genreList} similar={similar} />
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Mobile constellation toggle */}
            {!constellationExpanded && (
              <div className="lg:hidden border-b border-[#F0F0F0] px-4 sm:px-10 py-3">
                <button
                  onClick={() => setConstellationExpanded(true)}
                  className="w-full flex items-center justify-between text-[11px] font-semibold text-[#9CA3AF] cursor-pointer border border-[#E5E5E5] bg-white transition-all duration-150 hover:text-[#1D1D1F] hover:border-[#1D1D1F]"
                  style={{ padding: "8px 14px", letterSpacing: "0.03em" }}
                >
                  <span
                    className="uppercase"
                    style={{ letterSpacing: "0.08em" }}
                  >
                    {GRAPH_MODES.find((m) => m.key === graphMode)?.label || "Constellation"}
                  </span>
                  <span>Show ↓</span>
                </button>
              </div>
            )}

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2 border-b border-[#F0F0F0] px-4 sm:px-10 py-3 sm:py-4">
              <span className="text-xs text-[#9CA3AF] mr-2 font-medium">
                {genreFilter ? "Filtered by:" : "Filter:"}
              </span>
              {genreFilter ? (
                <>
                  <GenreTag
                    genre={genreFilter}
                    onClick={handleGenreClick}
                    active
                  />
                  <button
                    onClick={() => setGenreFilter(null)}
                    className="text-[11px] text-[#9CA3AF] cursor-pointer hover:text-[#1D1D1F] transition-colors"
                    style={{ background: "none", border: "none" }}
                  >
                    Clear
                  </button>
                </>
              ) : (
                FILTERS.map((f) => (
                  <FilterPill
                    key={f.key}
                    label={f.label}
                    active={activeFilter === f.key}
                    onClick={() => setActiveFilter(f.key)}
                  />
                ))
              )}
              <span className="ml-auto text-xs text-[#C4C4C4]">
                {filteredSimilar.length} results
              </span>
            </div>

            <div className="flex">
              {/* Results list */}
              <div className="flex-1 min-w-0">
                {filteredSimilar.map((a, i) => (
                  <SimilarCard
                    key={a.mbid || a.name}
                    artist={a}
                    index={i}
                    onExplore={handleExplore}
                    isHighlighted={
                      highlightedId === (a.mbid || a.name)
                    }
                    onHover={setHighlightedId}
                    previewUrl={previewMap[a.mbid || a.name]}
                    isPlaying={
                      playingUrl === previewMap[a.mbid || a.name] &&
                      playingUrl !== null
                    }
                    onPlay={handlePlay}
                    onStop={handleStop}
                    onGenreClick={handleGenreClick}
                    discography={discoCache[a.name] || null}
                    discographyOpen={openDisco === a.name}
                    onToggleDiscography={handleToggleDisco}
                    playingUrl={playingUrl}
                    bio={infoCache[a.name]?.bio}
                    albumTracksCache={albumTracksCache}
                    onAlbumClick={handleAlbumClick}
                    expandedAlbum={expandedAlbum}
                    bookmarkedArtists={bookmarkedArtists}
                    bookmarkingIds={bookmarkingIds}
                    onToggleBookmark={handleToggleBookmark}
                  />
                ))}
              </div>

              {/* Sidebar (desktop) */}
              {(!constellationExpanded && !genreFilter) && (
                <div className="hidden lg:block w-[360px] border-l border-[#F0F0F0] shrink-0 sticky top-0 h-fit p-5">
                  <div className="flex items-center justify-between mb-4">
                    <GraphModeDropdown value={graphMode} onChange={setGraphMode} />
                    <button
                      onClick={() => setConstellationExpanded(true)}
                      className="text-[11px] font-semibold text-[#9CA3AF] cursor-pointer border border-[#E5E5E5] bg-white transition-all duration-150 hover:text-[#1D1D1F] hover:border-[#1D1D1F]"
                      style={{
                        padding: "4px 12px",
                        letterSpacing: "0.03em",
                      }}
                    >
                      Expand ↓
                    </button>
                  </div>
                  <GraphSwitch
                    center={artistName}
                    centerGenres={artistInfo?.genres}
                    similar={constellationData}
                    highlightedId={highlightedId}
                    onHover={setHighlightedId}
                    onExplore={handleExplore}
                    mode={graphMode}
                  />
                  <div className="mt-4 pt-3 border-t border-[#F0F0F0]">
                    <div className="text-[11px] text-[#C4C4C4] leading-relaxed">
                      Inner = top matches. Outer = extended.
                      <br />
                      Colors = primary genre. Click to explore.
                    </div>
                  </div>
                  {genreList.length > 0 && (
                    <div className="mt-5">
                      <GenreMap genreList={genreList} similar={similar} />
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
      <Toast message={toastMessage} onDone={() => setToastMessage(null)} />
    </div>
  );
}
