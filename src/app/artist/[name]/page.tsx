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
import Footer from "@/components/Footer";
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
import CollapsibleBio from "@/components/CollapsibleBio";

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
        className="text-[10px] font-mono text-white/40 uppercase flex items-center gap-2 cursor-pointer hover:text-shift5-orange transition-colors tracking-widest"
        style={{ background: "none", border: "none", padding: 0 }}
      >
        <span className="text-white/20 select-none">[ MODE:</span>
        {current.label}
        <span className="text-white/20 select-none">]</span>
        <svg width={8} height={8} viewBox="0 0 8 8" fill="currentColor" className="transition-transform duration-300" style={{ transform: open ? "rotate(180deg)" : "none" }}>
          <polygon points="0,2 4,6 8,2" />
        </svg>
      </button>
      {open && (
        <div
          className="absolute top-full left-0 mt-2 bg-shift5-gray border border-shift5-accent z-50 min-w-[200px] shadow-2xl backdrop-blur-md"
          style={{ animation: "fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)" }}
        >
          {GRAPH_MODES.map((m) => (
            <button
              key={m.key}
              onClick={() => { onChange(m.key); setOpen(false); }}
              className={`w-full text-left px-4 py-3 cursor-pointer transition-colors border-none group ${m.key === value ? "bg-shift5-orange/10" : "bg-transparent hover:bg-white/5"
                }`}
              style={{ display: "block" }}
            >
              <span className={`text-[11px] font-mono uppercase tracking-wider block mb-1 transition-colors ${m.key === value ? "text-shift5-orange" : "text-white/70 group-hover:text-white"}`}>
                {m.label}
              </span>
              <span className="text-[9px] font-mono text-white/30 block uppercase tracking-tight">
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
  className = "",
}: {
  name: string;
  image?: string | null;
  size?: number;
  className?: string;
}) {
  if (image) {
    return (
      <Image
        src={image}
        alt={name}
        width={size}
        height={size}
        className={`object-cover shrink-0 ${className}`}
        style={className ? {} : { width: size, height: size }}
        unoptimized
      />
    );
  }
  return <div className={className}><ArtistInitials name={name} size={size} /></div>;
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
        className="text-[10px] font-mono text-shift5-dark/40 uppercase mb-4 tracking-[0.15em] border-b border-shift5-dark/10 pb-1 font-bold"
      >
        Genre_Profile
      </div>
      <div className="space-y-2">
        {genreList.map((genre) => {
          const count = similar.filter((a) => a.genres.includes(genre)).length;
          return (
            <div key={genre} className="flex items-center gap-3">
              <div
                className="w-1.5 h-1.5 shrink-0"
                style={{ backgroundColor: getGenreColor(genre) }}
              />
              <span className="text-[11px] font-mono text-shift5-dark/70 flex-1 uppercase tracking-tight font-bold">{genre}</span>
              <span className="text-[10px] text-shift5-dark/20 font-mono font-bold">
                {count.toString().padStart(2, '0')}
              </span>
            </div>
          );
        })}
      </div>
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
  genres = [],
  isFocused = false,
  onResetFocus,
}: {
  albums: Album[];
  topTracks: PreviewTrack[];
  playingUrl: string | null;
  onPlay: (url: string, title?: string, artist?: string, coverUrl?: string | null, genres?: string[]) => void;
  onStop: () => void;
  albumTracksCache: Record<number, AlbumTrack[]>;
  onAlbumClick: (albumId: number) => void;
  expandedAlbum: number | null;
  bio?: string;
  genres?: string[];
  isFocused?: boolean;
  onResetFocus?: () => void;
}) {
  const focusedAlbum = isFocused ? albums.find(a => a.id === expandedAlbum) : null;

  return (
    <div>
      {/* Bio snippet */}
      {bio && (
        <div className="mb-8 border-l border-shift5-orange/20 pl-4">
          <CollapsibleBio bio={bio} maxLen={200} theme="dark" />
        </div>
      )}

      {/* Top tracks - Hidden in focused mode */}
      {topTracks.length > 0 && !isFocused && (
        <div className="mb-8">
          <div
            className="text-[10px] font-mono text-white/30 uppercase mb-4 tracking-[0.15em] border-b border-white/5 pb-1"
          >
            Popular_Tracks
          </div>
          <div className="max-w-[500px] border border-white/5 divide-y divide-white/5">
            {topTracks.slice(0, 5).map((t, i) => {
              const isPlaying = playingUrl === t.preview;
              const mins = Math.floor(t.duration / 60);
              const secs = t.duration % 60;
              return (
                <div
                  key={t.id}
                  className="flex items-center gap-4 py-3 px-3 hover:bg-white/5 transition-colors cursor-pointer group"
                  onClick={() =>
                    isPlaying ? onStop() : onPlay(t.preview, t.title, undefined, undefined, genres)
                  }
                >
                  <span
                    className={`w-4 text-center text-[10px] font-mono ${isPlaying ? "text-shift5-orange font-bold animate-pulse" : "text-white/20"}`}
                  >
                    {isPlaying ? ">>" : (i + 1).toString().padStart(2, '0')}
                  </span>
                  <span
                    className={`text-[13px] font-mono flex-1 truncate uppercase tracking-tight transition-colors ${isPlaying ? "text-shift5-orange" : "text-white/80 group-hover:text-white"}`}
                  >
                    {t.title}
                  </span>
                  <span className="text-[10px] text-white/20 font-mono">
                    {mins}:{secs.toString().padStart(2, "0")}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Focused Album View */}
      {isFocused && focusedAlbum && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-2">
            <div className="text-[10px] font-mono text-white/30 uppercase tracking-[0.15em]">
              Selected_Album_Focus // {focusedAlbum.title}
            </div>
            <button
              onClick={onResetFocus}
              className="text-[10px] font-mono text-shift5-orange hover:text-white uppercase tracking-widest transition-colors font-bold"
            >
              [ Show_All_Albums ]
            </button>
          </div>
        </div>
      )}

      {/* Albums — vertical list with expandable track lists */}
      {albums.length > 0 && (
        <div className="mt-8">
          {!isFocused && (
            <div
              className="text-[10px] font-mono text-white/30 uppercase mb-4 tracking-[0.15em] border-b border-white/5 pb-1"
            >
              Discography
            </div>
          )}
          <div className="space-y-1">
            {albums.filter(a => !isFocused || a.id === expandedAlbum).map((a) => {
              const year = a.release_date?.slice(0, 4);
              const isExpanded = expandedAlbum === a.id;
              const tracks = albumTracksCache[a.id];
              return (
                <div key={a.id} className={`border border-white/5 transition-all duration-300 ${isExpanded ? 'border-shift5-orange/30 bg-white/[0.02]' : 'hover:border-white/20'}`}>
                  <div
                    className="flex items-center gap-4 py-3 px-3 cursor-pointer group"
                    onClick={() => onAlbumClick(a.id)}
                  >
                    <div className="w-[48px] h-[48px] bg-white/5 shrink-0 overflow-hidden border border-white/5 group-hover:border-white/20 transition-colors">
                      {a.cover_medium ? (
                        <Image
                          src={a.cover_medium}
                          alt={a.title}
                          width={48}
                          height={48}
                          className={`object-cover transition-all duration-500 ${isExpanded ? 'contrast-125' : 'grayscale group-hover:grayscale-0'}`}
                          unoptimized
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white/10 text-[9px] font-mono uppercase">
                          No_Img
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-[13px] font-mono uppercase tracking-tight truncate transition-colors ${isExpanded ? 'text-white' : 'text-white/70 group-hover:text-white'}`}>
                        {a.title}
                      </p>
                      <p className="text-[10px] font-mono text-white/20 uppercase tracking-tighter">
                        REL_DATE_{year}
                        {a.nb_tracks > 0 && ` // ${a.nb_tracks.toString().padStart(2, '0')}_TRACKS`}
                      </p>
                    </div>
                    <span className={`text-[10px] font-mono transition-colors ${isExpanded ? 'text-shift5-orange' : 'text-white/20'}`}>
                      {isExpanded ? "[ CLOSE ]" : "[ DEPTH ]"}
                    </span>
                  </div>
                  {/* Track list */}
                  <div
                    className="transition-all duration-300 ease-in-out"
                    style={{
                      display: "grid",
                      gridTemplateRows: isExpanded ? "1fr" : "0fr",
                      opacity: isExpanded ? 1 : 0,
                    }}
                  >
                    <div className="overflow-hidden">
                      <div className="pl-3 pr-3 pb-4 pt-2 border-t border-white/5 divide-y divide-white/[0.02]">
                        {!tracks ? (
                          <p className="text-[10px] font-mono text-shift5-orange/40 py-4 text-center animate-pulse">
                            FETCHING_ASSETS...
                          </p>
                        ) : tracks.length === 0 ? (
                          <p className="text-[10px] font-mono text-white/20 py-4 text-center uppercase">
                            No_Signal_Detected
                          </p>
                        ) : (
                          tracks.map((t, i) => {
                            const isPlaying = playingUrl === t.preview;
                            const mins = Math.floor(t.duration / 60);
                            const secs = t.duration % 60;
                            return (
                              <div
                                key={t.id}
                                className="flex items-center gap-4 py-2 hover:bg-white/5 transition-colors cursor-pointer group/track"
                                onClick={() => {
                                  if (t.preview) {
                                    isPlaying ? onStop() : onPlay(t.preview, t.title, undefined, undefined, genres);
                                  }
                                }}
                              >
                                <span
                                  className={`w-5 text-center text-[10px] font-mono ${isPlaying ? "text-shift5-orange font-bold" : "text-white/10"}`}
                                >
                                  {isPlaying ? ">>" : (i + 1).toString().padStart(2, '0')}
                                </span>
                                <span
                                  className={`text-[12px] font-mono flex-1 truncate uppercase tracking-tight transition-colors ${isPlaying ? "text-shift5-orange" : "text-white/50 group-hover/track:text-white/80"}`}
                                >
                                  {t.title}
                                </span>
                                {t.preview && (
                                  <span className={`text-[10px] transition-colors ${isPlaying ? 'text-shift5-orange' : 'text-white/10 group-hover/track:text-shift5-orange/50'}`}>
                                    {isPlaying ? "■" : "▶"}
                                  </span>
                                )}
                                <span className="text-[10px] text-white/10 font-mono">
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
  info,
  albumTracksCache,
  onAlbumClick,
  expandedAlbum,
  bookmarkedArtists,
  bookmarkingIds,
  onToggleBookmark,
  previewTitle,
}: {
  artist: SimilarArtistResult;
  index: number;
  onExplore: (name: string) => void;
  isHighlighted: boolean;
  onHover: (id: string | null) => void;
  previewUrl?: string;
  isPlaying: boolean;
  onPlay: (url: string, title?: string, artist?: string, image?: string | null, genres?: string[]) => void;
  onStop: () => void;
  onGenreClick: (genre: string) => void;
  discography: Discography | null;
  discographyOpen: boolean;
  onToggleDiscography: (name: string) => void;
  playingUrl: string | null;
  info?: ArtistInfo | null;
  albumTracksCache: Record<number, AlbumTrack[]>;
  onAlbumClick: (albumId: number) => void;
  expandedAlbum: number | null;
  bookmarkedArtists: Set<string>;
  bookmarkingIds: Set<string>;
  onToggleBookmark: (id: string, name: string, img?: string | null, genres?: string[]) => void;
  previewTitle?: string;
}) {
  const [hovered, setHovered] = useState(false);
  const accordionRef = useRef<HTMLDivElement>(null);
  const bg = isHighlighted ? "rgba(255, 88, 65, 0.05)" : hovered ? "rgba(255, 255, 255, 0.03)" : "transparent";
  const cardId = artist.mbid || artist.name;
  const isBookmarked = bookmarkedArtists.has(artist.name);
  const isBookmarking = bookmarkingIds.has(cardId);

  return (
    <div
      className="border-b border-white/5"
      style={{
        animation: `fadeSlideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) ${index * 0.03}s both`,
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
        className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4 cursor-default p-4 sm:px-6 sm:py-5 group/card transition-all duration-300"
        style={{
          backgroundColor: bg,
        }}
      >
        <div className="flex items-center gap-4 sm:gap-6 flex-1 min-w-0">
          <div className={`relative transition-all duration-500 overflow-hidden border ${hovered ? 'scale-110 contrast-125 border-shift5-orange/50 shadow-[0_0_15px_rgba(255,88,65,0.2)]' : 'grayscale contrast-50 opacity-30 border-white/5'}`}>
            <ArtistAvatar
              name={artist.name}
              image={artist.image}
              size={60}
            />
            {isHighlighted && (
              <div className="absolute inset-0 border-2 border-shift5-orange animate-pulse pointer-events-none" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <span
                onClick={() => onExplore(artist.name)}
                className="text-[16px] font-bold text-white cursor-pointer hover:text-shift5-orange font-mono uppercase tracking-tighter transition-colors"
              >
                {artist.name}
              </span>
              <StreamingLinks artistName={artist.name} size={18} />
              <div className="flex items-center gap-3">
                <span className="text-[9px] font-mono text-white/30 uppercase tracking-[0.2em] hidden sm:inline font-bold">Confidence_Level:</span>
                <SimilarityBar value={artist.match} />
                <span className="text-[9px] font-mono text-shift5-orange font-bold">{(artist.match * 100).toFixed(0)}%</span>
              </div>
            </div>
            {artist.genres.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {artist.genres.slice(0, 3).map((g) => (
                  <GenreTag key={g} genre={g} onClick={onGenreClick} />
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-2 items-center sm:items-start sm:pt-1 ml-[68px] sm:ml-0">
          {previewUrl && (
            <button
              onClick={() => (isPlaying ? onStop() : onPlay(previewUrl, previewTitle || "Track Preview", artist.name, artist.image, artist.genres))}
              className={`flex items-center justify-center border cursor-pointer transition-all duration-300 shrink-0 ${isPlaying
                ? "border-shift5-orange bg-shift5-orange text-white"
                : "border-white/10 bg-white/5 text-white/50 hover:bg-white/10 hover:text-white hover:border-white/30"
                }`}
              style={{ width: 32, height: 32 }}
              title={isPlaying ? "Stop" : "Play"}
            >
              {isPlaying ? (
                <svg
                  width={12}
                  height={12}
                  viewBox="0 0 12 12"
                  fill="currentColor"
                >
                  <rect x="2" y="1" width="3" height="10" />
                  <rect x="7" y="1" width="3" height="10" />
                </svg>
              ) : (
                <svg
                  width={12}
                  height={12}
                  viewBox="0 0 12 12"
                  fill="currentColor"
                >
                  <polygon points="3,0 12,6 3,12" />
                </svg>
              )}
            </button>
          )}
          <button
            onClick={() => onToggleBookmark(cardId, artist.name, artist.image, artist.genres)}
            disabled={isBookmarking}
            className={`flex items-center justify-center border transition-all duration-300 cursor-pointer ${isBookmarked
              ? "border-shift5-orange/50 bg-shift5-orange/10 text-shift5-orange shadow-[0_0_10px_rgba(255,88,65,0.1)]"
              : "border-white/10 bg-white/5 text-white/30 hover:text-white/70 hover:border-white/30"
              }`}
            style={{ width: 34, height: 34 }}
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
            className={`text-[10px] font-mono font-bold border cursor-pointer whitespace-nowrap transition-all duration-300 flex items-center gap-2 uppercase tracking-[0.1em] ${discographyOpen
              ? "border-white bg-white text-shift5-dark"
              : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white hover:border-white/30"
              }`}
            style={{ padding: "8px 16px" }}
          >
            {discographyOpen ? "[ LESS_INF ]" : "[ MORE_INF ]"}
          </button>
        </div>
      </div>

      {/* Accordion discography */}
      <div
        ref={accordionRef}
        className="transition-all duration-500 ease-in-out"
        style={{
          display: "grid",
          gridTemplateRows: discographyOpen ? "1fr" : "0fr",
          opacity: discographyOpen ? 1 : 0,
        }}
      >
        <div className="overflow-hidden">
          {info && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8 p-4 bg-white/[0.03] border border-white/5 font-mono text-[10px] uppercase tracking-widest">
              <div className="space-y-1">
                <div className="text-white/20">Signal_Origin</div>
                <div className="text-white truncate">{info.location || "NULL_SECTOR"}</div>
              </div>
              <div className="space-y-1 border-l border-white/5 pl-4">
                <div className="text-white/20">Established</div>
                <div className="text-white">{info.yearStarted || "NULL_TIME"}</div>
              </div>
              <div className="space-y-1 sm:border-l border-t sm:border-t-0 border-white/5 pt-3 sm:pt-0 pl-0 sm:pl-4">
                <div className="text-white/20">Artifact_Count</div>
                <div className="text-white">{info.nbAlbums || 0} Records</div>
              </div>
              <div className="space-y-1 border-l border-t sm:border-t-0 border-white/5 pt-3 sm:pt-0 pl-4">
                <div className="text-white/20">Match_Confidence</div>
                <div className="text-shift5-orange">{(artist.match * 100).toFixed(0)}% (MATCH)</div>
              </div>
            </div>
          )}
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
              bio={info?.bio}
            />
          ) : (
            <div className="text-[10px] font-mono text-shift5-orange/40 py-8 text-center animate-pulse uppercase">
              Synchronizing_Discography_Data...
            </div>
          )}
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
  const [previewMap, setPreviewMap] = useState<Record<string, { url: string; title: string }>>({});
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
  const [isDiscoFocused, setIsDiscoFocused] = useState(false);
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
    setIsDiscoFocused(false);
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
            const track = data.tracks[0];
            return {
              key: a.mbid || a.name,
              url: track?.preview || null,
              title: track?.title || null
            };
          })
        );
        if (cancelled) return;
        setPreviewMap((prev) => {
          const next = { ...prev };
          for (const r of results) {
            if (r.status === "fulfilled" && r.value.url) {
              next[r.value.key] = {
                url: r.value.url,
                title: r.value.title || "Track Preview"
              };
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

  const handlePlay = (url: string, title?: string, artist?: string, coverUrl?: string | null, genres?: string[]) => {
    if (currentTrack?.url === url) {
      togglePlayPause();
      return;
    }
    const targetArtist = artist || artistName;
    playTrack({
      url,
      title: title || "Top Track",
      artist: targetArtist,
      coverUrl: coverUrl || artistInfo?.image || null,
      genres: genres && genres.length > 0 ? genres : (targetArtist === artistName ? artistInfo?.genres : [])
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
    <div className="min-h-screen bg-shift5-dark text-white selection:bg-shift5-orange/30">
      <Header />
      <Breadcrumbs />

      {/* Detail Background Decorative Grid */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.02] overflow-hidden z-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#888_1px,transparent_1px),linear-gradient(to_bottom,#888_1px,transparent_1px)] bg-[size:40px_40px]" />
      </div>

      <main className="relative z-10 p-4 sm:p-5 md:p-10 max-w-[1400px] mx-auto">
        {/* Hero Header section with high-contrast Shift5 Orange */}
        <div className="mb-12 border border-white/10 bg-shift5-orange text-shift5-dark px-5 py-10 md:p-12 relative overflow-hidden group">
          {/* Decorative Background Text (Shift5 vibe) */}
          <div className="absolute top-0 right-0 text-[80px] sm:text-[120px] font-bold text-shift5-dark/5 select-none leading-none pointer-events-none uppercase mr-[-10px] sm:mr-[-20px] mt-[-10px] sm:mt-[-20px]">
            {artistName.slice(0, 3)}
          </div>

          <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-8">
            <div className="flex flex-col sm:flex-row items-start gap-6 sm:gap-8">
              <div className="relative overflow-hidden border-2 border-shift5-dark p-1 bg-shift5-dark/10 backdrop-blur-sm mt-0 md:-mt-6 shrink-0 w-[100px] h-[100px] md:w-[150px] md:h-[150px]">
                <ArtistAvatar name={artistName} image={artistInfo?.image} size={150} className="w-full h-full" />
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>

              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-[10px] font-mono text-shift5-dark uppercase tracking-[0.3em] font-bold bg-white/20 px-2 py-0.5">Active_Node // {artistInfo?.deezerId || 'IDENT_PENDING'}</span>
                  <StreamingLinks artistName={artistName} size={20} isHero={true} />
                </div>
                <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold uppercase tracking-tighter leading-none mb-4 selection:bg-shift5-dark selection:text-white break-words">
                  {artistName}
                </h1>
                <div className="flex flex-wrap gap-2 mt-4 mb-8">
                  {artistInfo?.genres.map(g => (
                    <GenreTag key={g} genre={g} onClick={handleGenreClick} active={genreFilter === g} />
                  ))}
                </div>

                {/* Metadata Scans Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8 p-4 bg-shift5-dark/5 border border-shift5-dark/10 font-mono text-[10px] uppercase tracking-widest text-shift5-dark w-fit">
                  <div className="space-y-1">
                    <div className="text-shift5-dark/40">Signal_Origin</div>
                    <div className="font-bold truncate max-w-[120px]">{artistInfo?.location || "NULL_SECTOR"}</div>
                  </div>
                  <div className="space-y-1 border-l border-shift5-dark/10 pl-4">
                    <div className="text-shift5-dark/40">Established</div>
                    <div className="font-bold">{artistInfo?.yearStarted || "NULL_TIME"}</div>
                  </div>
                  <div className="space-y-1 sm:border-l border-t sm:border-t-0 border-shift5-dark/10 pt-3 sm:pt-0 pl-0 sm:pl-4">
                    <div className="text-shift5-dark/40">Artifact_Count</div>
                    <div className="font-bold">{artistInfo?.nbAlbums || 0} Records</div>
                  </div>
                  <div className="space-y-1 border-l border-t sm:border-t-0 border-shift5-dark/10 pt-3 sm:pt-0 pl-4">
                    <div className="text-shift5-dark/40">Match_Confidence</div>
                    <div className="font-bold">100% (PRIMARY)</div>
                  </div>
                </div>

                <div className="mt-8 space-y-4 max-w-2xl border-l-2 border-shift5-dark/10 pl-4 sm:pl-6">
                  <div className="text-[10px] font-mono text-shift5-dark/40 uppercase tracking-widest font-bold">Operational_Bio</div>
                  <CollapsibleBio
                    bio={artistInfo?.bio || ""}
                    maxLen={260}
                    theme="hero"
                  />

                  <div className="pt-6">
                    <div className="text-[10px] font-mono text-shift5-dark/40 uppercase tracking-widest font-bold mb-4">Signal_Discography // Select_To_Expand</div>

                    {/* Horizontal Scroll Discography */}
                    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide no-scrollbar -mx-2 px-2 mask-linear-right">
                      {primaryDisco ? (
                        primaryDisco.albums.map((a) => (
                          <div
                            key={a.id}
                            onClick={() => {
                              if (expandedAlbumPrimary === a.id && primaryDiscoOpen) {
                                setPrimaryDiscoOpen(false);
                                setIsDiscoFocused(false);
                                setExpandedAlbumPrimary(null);
                              } else {
                                setPrimaryDiscoOpen(true);
                                setIsDiscoFocused(true);
                                if (expandedAlbumPrimary !== a.id) {
                                  handleAlbumClickPrimary(a.id);
                                }
                                // Smooth scroll to the accordion if it opens below
                                setTimeout(() => {
                                  primaryAccordionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                                }, 100);
                              }
                            }}
                            className={`relative min-w-[120px] aspect-square bg-shift5-dark/10 border-2 transition-all cursor-pointer group/album ${expandedAlbumPrimary === a.id ? 'border-shift5-dark scale-105 z-10' : 'border-shift5-dark/20 hover:border-shift5-dark/40'}`}
                          >
                            {a.cover_medium ? (
                              <Image
                                src={a.cover_medium}
                                alt={a.title}
                                fill
                                className={`object-cover transition-all duration-500 ${expandedAlbumPrimary === a.id ? 'contrast-125 brightness-110' : 'grayscale group-hover/album:grayscale-0 contrast-110'}`}
                                unoptimized
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[10px] font-mono text-shift5-dark/20 uppercase">No_Signal</div>
                            )}
                            <div className="absolute inset-0 bg-shift5-dark/40 opacity-0 group-hover/album:opacity-100 transition-opacity flex items-end p-2">
                              <span className="text-[8px] font-mono text-white uppercase leading-tight truncate w-full">{a.title}</span>
                            </div>
                            {expandedAlbumPrimary === a.id && (
                              <div className="absolute -top-2 -right-2 w-5 h-5 bg-shift5-dark border-2 border-shift5-orange flex items-center justify-center">
                                <span className="text-[10px] text-shift5-orange animate-pulse">■</span>
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="flex gap-4">
                          {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="min-w-[120px] aspect-square bg-shift5-dark/5 animate-pulse border border-shift5-dark/10" />
                          ))}
                        </div>
                      )}
                    </div>

                    <div
                      ref={primaryAccordionRef}
                      className="transition-all duration-500 ease-in-out"
                      style={{
                        display: "grid",
                        gridTemplateRows: primaryDiscoOpen ? "1fr" : "0fr",
                        opacity: primaryDiscoOpen ? 1 : 0,
                      }}
                    >
                      <div className="overflow-hidden">
                        <div className="pt-8">
                          {primaryDisco ? (
                            <div className="bg-shift5-dark/5 p-6 border-2 border-shift5-dark/10 relative">
                              <div className="absolute top-0 right-0 p-3">
                                <button
                                  onClick={() => setPrimaryDiscoOpen(false)}
                                  className="text-[10px] font-mono text-shift5-dark/40 hover:text-shift5-dark font-bold uppercase transition-colors"
                                >
                                  [ Terminate_Sync ]
                                </button>
                              </div>
                              <DiscographyPanel
                                albums={primaryDisco.albums}
                                topTracks={primaryDisco.topTracks}
                                playingUrl={playingUrl}
                                onPlay={handlePlay}
                                onStop={handleStop}
                                albumTracksCache={albumTracksCache}
                                onAlbumClick={handleAlbumClickPrimary}
                                expandedAlbum={expandedAlbumPrimary}
                                bio={artistInfo?.bio}
                                genres={artistInfo?.genres}
                                isFocused={isDiscoFocused}
                                onResetFocus={() => {
                                  setIsDiscoFocused(false);
                                  setExpandedAlbumPrimary(null);
                                  setPrimaryDiscoOpen(false);
                                }}
                              />
                            </div>
                          ) : (
                            <div className="p-10 text-center text-[10px] font-mono text-shift5-dark/20 animate-pulse">INIT_DISCO_SYNC...</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-row md:flex-col items-center md:items-end gap-3 sm:gap-6 h-full justify-between pb-4 w-full md:w-auto">
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => {
                    if (primaryDisco && primaryDisco.topTracks.length > 0) {
                      const top = primaryDisco.topTracks[0];
                      playingUrl === top.preview ? handleStop() : handlePlay(top.preview, top.title);
                    }
                  }}
                  className={`flex-1 md:flex-none flex items-center justify-center gap-3 px-6 sm:px-8 py-4 border-2 font-mono text-[11px] font-bold uppercase tracking-[0.2em] transition-all ${playingUrl && primaryDisco?.topTracks.some(t => t.preview === playingUrl) ? 'bg-shift5-dark border-shift5-dark text-shift5-orange' : 'bg-white/10 border-shift5-dark/40 hover:border-shift5-dark hover:bg-white/20 text-shift5-dark'}`}
                >
                  {playingUrl && primaryDisco?.topTracks.some(t => t.preview === playingUrl) ? (
                    <>
                      <span className="w-2 h-2 rounded-full bg-shift5-orange animate-pulse" />
                      ENGAGED
                    </>
                  ) : (
                    <>
                      <span className="text-[14px]">▶</span>
                      PLAY_SIGNAL
                    </>
                  )}
                </button>

                <button
                  onClick={() => handleToggleBookmark(artistInfo?.deezerId?.toString() || artistName, artistName, artistInfo?.image, artistInfo?.genres)}
                  className={`flex-1 md:flex-none flex items-center justify-center gap-3 px-6 sm:px-8 py-4 border-2 font-mono text-[11px] font-bold uppercase tracking-[0.2em] transition-all ${bookmarkedArtists.has(artistName) ? 'bg-shift5-dark border-shift5-dark text-white' : 'border-shift5-dark/30 hover:border-shift5-dark text-shift5-dark/70 hover:text-shift5-dark'}`}
                >
                  <Heart size={16} className={bookmarkedArtists.has(artistName) ? 'fill-current' : ''} />
                  {bookmarkedArtists.has(artistName) ? 'SAVED_NODE' : 'SAVE_NODE'}
                </button>
              </div>

              <div className="hidden sm:flex flex-col items-end gap-1 opacity-60">
                <span className="text-[9px] font-mono text-shift5-dark uppercase tracking-widest font-bold">Sys_Confidence</span>
                <span className="text-[12px] font-mono text-shift5-dark uppercase tracking-widest flex items-center gap-2 font-bold">
                  <span className="w-2 h-2 rounded-full bg-shift5-dark animate-pulse" />
                  OPTIMAL_SIGNAL_LOCKED
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Main Content Column */}
          <div className="lg:col-span-8 space-y-12">

            <section>
              <div className="flex flex-col gap-6 mb-8 border-b border-white/5 pb-6">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-white/40 uppercase tracking-[0.15em]">Detected_Signals // {filteredSimilar.length.toString().padStart(2, '0')}</span>
                  <div className="flex items-center gap-2 text-[9px] font-mono text-white/20 select-none">
                    SORT: [CONFIDENCE_DESC]
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {FILTERS.map((f) => (
                    <FilterPill
                      key={f.key}
                      label={f.label}
                      active={activeFilter === f.key}
                      onClick={() => { setActiveFilter(f.key); setGenreFilter(null); }}
                    />
                  ))}
                </div>
              </div>

              <div className="border border-white/5 divide-y divide-white/[0.02]">
                {filteredSimilar.map((a, i) => (
                  <SimilarCard
                    key={a.mbid || a.name}
                    artist={a}
                    index={i}
                    onExplore={handleExplore}
                    onHover={setHighlightedId}
                    isHighlighted={highlightedId === (a.mbid || a.name)}
                    previewUrl={previewMap[a.mbid || a.name]?.url}
                    previewTitle={previewMap[a.mbid || a.name]?.title}
                    isPlaying={isPlaying && currentTrack?.artist === a.name}
                    onPlay={handlePlay}
                    onStop={handleStop}
                    onGenreClick={handleGenreClick}
                    discography={discoCache[a.name] || null}
                    discographyOpen={openDisco === a.name}
                    onToggleDiscography={handleToggleDisco}
                    playingUrl={playingUrl}
                    info={infoCache[a.name]}
                    albumTracksCache={albumTracksCache}
                    onAlbumClick={handleAlbumClick}
                    expandedAlbum={expandedAlbum}
                    bookmarkedArtists={bookmarkedArtists}
                    bookmarkingIds={bookmarkingIds}
                    onToggleBookmark={handleToggleBookmark}
                  />
                ))}
              </div>
            </section>
          </div>

          {/* Sidebar Column */}
          <aside className="lg:col-span-4 space-y-10">
            {/* Relational Constellation Section - Moved to sidebar */}
            <section className="border border-white/5 bg-white/[0.01]">
              <div className="flex items-center justify-between p-4 border-b border-white/5 bg-white/[0.02]">
                <div className="flex items-center gap-4">
                  <span className="text-[10px] font-mono text-white/40 uppercase tracking-[0.15em]">Relational_Constellation</span>
                </div>
                <GraphModeDropdown value={graphMode} onChange={setGraphMode} />
              </div>

              <div className={`relative bg-shift5-dark transition-all duration-700 overflow-hidden ${constellationExpanded ? 'h-[600px]' : 'h-[350px]'}`}>
                <GraphSwitch
                  center={artistName}
                  centerGenres={artistInfo?.genres}
                  similar={constellationData}
                  onExplore={handleExplore}
                  onHover={setHighlightedId}
                  highlightedId={highlightedId}
                  mode={graphMode}
                />

                <div className="absolute inset-0 pointer-events-none border border-white/5 m-px z-10" />

                <button
                  onClick={() => setConstellationExpanded(!constellationExpanded)}
                  className="absolute bottom-4 right-4 z-20 bg-shift5-dark/90 border border-white/10 px-3 py-1.5 text-[9px] font-mono hover:text-shift5-orange transition-colors uppercase tracking-widest backdrop-blur-sm pointer-events-auto"
                >
                  [{constellationExpanded ? 'REDUCE_FRM' : 'EXPAND_FRM'}]
                </button>
              </div>
            </section>
            {/* Primary Artist Stats - Light Gray Theme for 'Block' Contrast */}
            <div className="border border-white/5 p-8 bg-shift5-light text-shift5-dark">
              <div className="text-[10px] font-mono text-shift5-dark/40 uppercase mb-8 tracking-[0.3em] border-b border-shift5-dark/10 pb-2 font-bold">Central_Node_Assets</div>

              <div className="p-4 border border-shift5-dark/5 bg-shift5-dark/5">
                <GenreMap genreList={genreList} similar={similar} />
              </div>
            </div>

            {/* Global Context or other widgets could go here */}
            <div className="hidden lg:block border border-dashed border-white/5 p-6 animate-pulse hover:animate-none group">
              <div className="text-[9px] font-mono text-shift5-orange/40 uppercase mb-2">System_Nexus_Status</div>
              <div className="text-[10px] font-mono text-white/10 group-hover:text-white/30 transition-colors uppercase leading-tight">
                Atlas is monitoring {similar.length} related signal paths. Confidence threshold set to optimal. Background reconnaissance active.
              </div>
            </div>
          </aside>
        </div>
      </main>

      <Footer />
      {toastMessage && <Toast message={toastMessage} onDone={() => setToastMessage(null)} />}
    </div >
  );
}
