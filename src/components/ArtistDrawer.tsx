"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import {
    getSimilarArtists,
    getArtistInfo,
    getDiscography,
    getAlbumTracks,
    getArtistPreviewData,
    type SimilarArtistResult,
    type ArtistInfo,
    type Album,
    type PreviewTrack,
    type Discography,
    type AlbumTrack,
} from "@/lib/api";
import { getGenreColor, truncateBio } from "@/lib/utils";
import ArtistInitials from "@/components/ArtistInitials";
import GenreTag from "@/components/GenreTag";
import SimilarityBar from "@/components/SimilarityBar";
import { useAudio } from "@/contexts/AudioContext";
import { Skeleton } from "@/components/Skeleton";
import { useSession, signIn } from "next-auth/react";
import { Heart, X } from "lucide-react";
import StreamingLinks from "@/components/StreamingLinks";
import CollapsibleBio from "@/components/CollapsibleBio";

// ─── Shared Sub-components (Copied from ArtistPage for isolation) ───

function ArtistAvatar({ name, image, size = 44 }: { name: string; image?: string | null; size?: number }) {
    if (image) {
        return <Image src={image} alt={name} width={size} height={size} className="object-cover shrink-0 border border-white/10 grayscale-[100%] group-hover:grayscale-0 transition-all duration-500" style={{ width: size, height: size }} unoptimized />;
    }
    return <ArtistInitials name={name} size={size} />;
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
    isFocused = false,
    onResetFocus,
    onPlayAlbumQueue,
}: {
    albums: Album[];
    topTracks: PreviewTrack[];
    playingUrl: string | null;
    onPlay: (url: string, title?: string, artist?: string, image?: string | null, videoId?: string | null) => void;
    onStop: () => void;
    albumTracksCache: Record<number, AlbumTrack[]>;
    onAlbumClick: (albumId: number) => void;
    expandedAlbum: number | null;
    bio?: string;
    isFocused?: boolean;
    onResetFocus?: () => void;
    onPlayAlbumQueue?: (tracks: AlbumTrack[], index: number, albumCover?: string) => void;
}) {
    const focusedAlbum = isFocused ? albums.find(a => a.id === expandedAlbum) : null;

    return (
        <div className="space-y-6">
            {bio && (
                <div className="mb-6">
                    <div className="text-[9px] font-mono text-white/20 uppercase mb-2">Operational_Bio</div>
                    <div className="border-l border-shift5-orange/20 pl-4">
                        <CollapsibleBio bio={bio} maxLen={200} theme="dark" />
                    </div>
                </div>
            )}
            {topTracks.length > 0 && !isFocused && (
                <div className="mb-8 p-4 border border-white/5 bg-white/[0.01]">
                    <div className="text-[10px] font-mono text-shift5-orange uppercase mb-4 tracking-[0.2em] border-b border-white/5 pb-2">Top_Signals</div>
                    <div className="max-w-[500px] space-y-1">
                        {topTracks.slice(0, 5).map((t, i) => {
                            const isPlaying = playingUrl === t.preview;
                            const mins = Math.floor(t.duration / 60);
                            const secs = t.duration % 60;
                            return (
                                <div key={t.id} className="flex items-center gap-3 py-2 px-3 border border-transparent hover:border-white/5 hover:bg-white/[0.02] transition-colors cursor-pointer group" onClick={() => isPlaying ? onStop() : onPlay(t.preview, t.title, undefined, undefined, t.videoId)}>
                                    <span className={`w-8 text-[10px] font-mono ${isPlaying ? "text-shift5-orange" : "text-white/20"}`}>{isPlaying ? ">>" : (i + 1).toString().padStart(2, '0')}</span>
                                    <span className={`text-[11px] font-mono uppercase tracking-tight flex-1 truncate ${isPlaying ? "text-white font-bold" : "text-white/60 group-hover:text-white"}`}>{t.title}</span>
                                    <span className="text-[10px] text-white/20 font-mono tracking-tighter">{mins}:{secs.toString().padStart(2, "0")}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

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

            {albums.length > 0 && (
                <div>
                    {!isFocused && <div className="text-[10px] font-mono text-white/20 uppercase mb-4 tracking-[0.2em]">Discography_Metadata</div>}
                    <div className="space-y-2">
                        {albums.filter(a => !isFocused || a.id === expandedAlbum).map((a) => {
                            const year = a.release_date?.slice(0, 4);
                            const isExpanded = expandedAlbum === a.id;
                            const tracks = albumTracksCache[a.id];
                            return (
                                <div key={a.id} className={`border ${isExpanded ? 'border-white/10 bg-white/[0.03]' : 'border-white/5 bg-white/[0.01] hover:border-white/10'}`}>
                                    <div className="flex items-center gap-4 p-3 cursor-pointer group" onClick={() => onAlbumClick(a.id)}>
                                        <div className="w-[48px] h-[48px] bg-white/[0.02] shrink-0 border border-white/5 p-0.5 overflow-hidden">
                                            {a.cover_medium ? <Image src={a.cover_medium} alt={a.title} width={48} height={48} className="object-cover w-full h-full grayscale group-hover:grayscale-0 transition-all duration-500" unoptimized /> : <div className="w-full h-full flex items-center justify-center text-white/10 text-[8px] font-mono">NULL_ART</div>}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[11px] font-bold text-white uppercase truncate tracking-tight">{a.title}</p>
                                            <p className="text-[9px] font-mono text-white/30 uppercase tracking-widest mt-1">{year}{a.nb_tracks > 0 && ` // ${a.nb_tracks} Tracks`}</p>
                                        </div>
                                        <span className={`text-[10px] font-mono transition-transform duration-300 ${isExpanded ? 'rotate-180 text-shift5-orange' : 'text-white/20'}`}>▼</span>
                                    </div>
                                    <div className="transition-all duration-300 ease-in-out" style={{ display: "grid", gridTemplateRows: isExpanded ? "1fr" : "0fr", opacity: isExpanded ? 1 : 0 }}>
                                        <div className="overflow-hidden">
                                            <div className="px-4 pb-4 border-t border-white/5">
                                                {!tracks ? <div className="text-[9px] font-mono text-white/20 py-4 uppercase tracking-widest animate-pulse">Syncing_Tracks...</div> : tracks.length === 0 ? <p className="text-[9px] font-mono text-white/20 py-4 uppercase">Zero_Data_Found</p> : tracks.map((t, i) => {
                                                    const isPlaying = playingUrl === t.preview;
                                                    const mins = Math.floor(t.duration / 60);
                                                    const secs = t.duration % 60;
                                                    return (
                                                        <div key={t.id} className="flex items-center gap-3 py-2 border-b border-white/[0.02] last:border-0 hover:bg-white/[0.04] transition-colors cursor-pointer group" onClick={() => { if (t.preview || t.videoId) { if (isPlaying) { onStop(); } else if (onPlayAlbumQueue && tracks) { onPlayAlbumQueue(tracks, i, a.cover_big || a.cover_medium); } else { onPlay(t.preview, t.title, undefined, undefined, t.videoId); } } }}>
                                                            <span className={`w-6 text-[9px] font-mono ${isPlaying ? "text-shift5-orange" : "text-white/10"}`}>{isPlaying ? ">>" : (i + 1).toString().padStart(2, '0')}</span>
                                                            <span className={`text-[10px] font-mono uppercase tracking-tighter flex-1 truncate ${isPlaying ? "text-white font-bold" : "text-white/40 group-hover:text-white"}`}>{t.title}</span>
                                                            {t.preview && <span className={`text-[8px] font-mono ${isPlaying ? "text-shift5-orange" : "text-white/10"}`}>{isPlaying ? "ACTIVE" : "PLAY"}</span>}
                                                            <span className="text-[9px] text-white/20 font-mono tracking-tighter">{mins}:{secs.toString().padStart(2, "0")}</span>
                                                        </div>
                                                    );
                                                })}
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
    previewUrl,
    previewVideoId,
    isPlaying,
    onPlay,
    onStop,
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
    onPlayAlbumQueue,
}: {
    artist: SimilarArtistResult;
    index: number;
    onExplore: (name: string) => void;
    previewUrl?: string;
    previewVideoId?: string | null;
    isPlaying: boolean;
    onPlay: (url: string, title?: string, artist?: string, image?: string | null, videoId?: string | null) => void;
    onStop: () => void;
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
    onPlayAlbumQueue?: (tracks: AlbumTrack[], index: number, albumCover?: string) => void;
}) {
    const cardId = artist.mbid || artist.name;
    const isBookmarked = bookmarkedArtists.has(artist.name);
    const isBookmarking = bookmarkingIds.has(cardId);

    return (
        <div style={{ animation: `fadeIn 0.3s ease ${index * 0.04}s both` }}>
            <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4 border-b border-white/5 cursor-default p-3 sm:p-5 bg-white/[0.01] hover:bg-white/[0.02] transition-colors group active:bg-white/[0.04] touch-manipulation">
                <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                    <ArtistAvatar name={artist.name} image={artist.image} size={44} />
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 sm:gap-3 mb-1 flex-wrap">
                            <span onClick={() => onExplore(artist.name)} className="text-[12px] sm:text-[13px] font-bold text-white uppercase tracking-tight cursor-pointer hover:text-shift5-orange transition-colors truncate">{artist.name}</span>
                            <StreamingLinks artistName={artist.name} size={14} />
                            <span className="text-[9px] font-mono text-shift5-orange font-bold">{(artist.match * 100).toFixed(0)}%</span>
                        </div>
                        {artist.genres.length > 0 && (
                            <div className="flex gap-1 overflow-x-auto sm:overflow-visible sm:flex-wrap no-scrollbar" style={{ touchAction: "pan-x" }}>
                                {artist.genres.slice(0, 3).map((g) => (
                                    <div key={g} className="shrink-0"><GenreTag genre={g} onClick={() => { }} /></div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
                <div className="flex gap-2 items-center ml-[56px] sm:ml-0 sm:items-start shrink-0">
                    {previewUrl && (
                        <button onClick={() => isPlaying ? onStop() : onPlay(previewUrl, "Preview", artist.name, artist.image, previewVideoId)} className={`flex items-center justify-center border transition-all duration-300 shrink-0 ${isPlaying ? "bg-shift5-orange border-shift5-orange text-white" : "bg-white/[0.05] border-white/10 text-white hover:bg-white/10 hover:border-white/30"}`} style={{ width: 34, height: 34 }} title={isPlaying ? "Stop" : "Play"}>
                            {isPlaying ? <svg width={10} height={10} viewBox="0 0 12 12" fill="currentColor"><rect x="1" y="1" width="4" height="10" /><rect x="7" y="1" width="4" height="10" /></svg> : <svg width={10} height={10} viewBox="0 0 12 12" fill="currentColor"><polygon points="2,0 12,6 2,12" /></svg>}
                        </button>
                    )}
                    <button onClick={() => onToggleBookmark(cardId, artist.name, artist.image, artist.genres)} disabled={isBookmarking} className={`flex items-center justify-center border transition-all duration-300 cursor-pointer ${isBookmarked ? "border-shift5-orange bg-shift5-orange/10 text-shift5-orange" : "bg-white/[0.05] border-white/10 text-white/50 hover:text-white hover:border-white/30"}`} style={{ width: 34, height: 34 }}>
                        <Heart size={15} className={isBookmarked ? "fill-current" : ""} strokeWidth={isBookmarked ? 2.5 : 2} />
                    </button>
                    <button onClick={() => onToggleDiscography(artist.name)} className={`text-[9px] font-bold font-mono border uppercase cursor-pointer whitespace-nowrap transition-all duration-300 active:scale-95 touch-manipulation ${discographyOpen ? "bg-shift5-orange border-shift5-orange text-white" : "bg-white/[0.05] border-white/10 text-white/50 hover:text-white hover:border-white/30"}`} style={{ padding: "0 8px", height: 32, letterSpacing: '0.08em' }}>
                        {discographyOpen ? "CLOSE" : "MORE"}
                    </button>
                </div>
            </div>
            <div className="transition-all duration-300 ease-in-out" style={{ display: "grid", gridTemplateRows: discographyOpen ? "1fr" : "0fr", opacity: discographyOpen ? 1 : 0 }}>
                <div className="overflow-hidden">
                    <div className="p-6 bg-white/[0.02] border-b border-white/5">
                        {discography ? <DiscographyPanel albums={discography.albums} topTracks={discography.topTracks} playingUrl={playingUrl} onPlay={onPlay} onStop={onStop} albumTracksCache={albumTracksCache} onAlbumClick={onAlbumClick} expandedAlbum={expandedAlbum} bio={bio} onPlayAlbumQueue={onPlayAlbumQueue} /> : <div className="text-[9px] font-mono text-white/20 uppercase animate-pulse">Retrieving_Data_Stream...</div>}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Main Drawer Component ──────────────────────────────────────────

export default function ArtistDrawer({
    artistName,
    onClose,
    showCloseAsBack = false,
    onSelectArtist,
    onSelectGenre,
    onBookmarksChange,
    className
}: {
    artistName: string;
    onClose: () => void;
    showCloseAsBack?: boolean;
    onSelectArtist: (name: string) => void;
    onSelectGenre?: (genre: string) => void;
    onBookmarksChange?: () => void;
    className?: string;
}) {
    const { data: session } = useSession();

    // Data State
    const [similar, setSimilar] = useState<SimilarArtistResult[]>([]);
    const [artistInfo, setArtistInfo] = useState<ArtistInfo | null>(null);
    const [primaryDisco, setPrimaryDisco] = useState<Discography | null>(null);
    const [loading, setLoading] = useState(true);
    const [previewMap, setPreviewMap] = useState<Record<string, { url: string; videoId?: string | null }>>({});

    // UI State
    const [primaryDiscoOpen, setPrimaryDiscoOpen] = useState(false);
    const [openDisco, setOpenDisco] = useState<string | null>(null);
    const [discoCache, setDiscoCache] = useState<Record<string, Discography>>({});
    const [infoCache, setInfoCache] = useState<Record<string, ArtistInfo>>({});
    const [albumTracksCache, setAlbumTracksCache] = useState<Record<number, AlbumTrack[]>>({});
    const [expandedAlbum, setExpandedAlbum] = useState<number | null>(null);
    const [expandedAlbumPrimary, setExpandedAlbumPrimary] = useState<number | null>(null);
    const [isDiscoFocused, setIsDiscoFocused] = useState(false);
    const primaryAccordionRef = useRef<HTMLDivElement>(null);

    // Bookmarking
    const [bookmarkedArtists, setBookmarkedArtists] = useState<Set<string>>(new Set());
    const [bookmarkingIds, setBookmarkingIds] = useState<Set<string>>(new Set());

    const { playTrack, playQueue, currentTrack, isPlaying, togglePlayPause } = useAudio();
    const playingUrl = isPlaying ? (currentTrack?.url ?? null) : null;

    useEffect(() => {
        if (session?.user) {
            fetch("/api/bookmarks")
                .then((res) => res.json())
                .then((data) => {
                    if (Array.isArray(data)) setBookmarkedArtists(new Set(data.map((b: { name: string }) => b.name)));
                });
        }
    }, [session]);

    useEffect(() => {
        setLoading(true);
        setSimilar([]);
        setArtistInfo(null);
        setPrimaryDisco(null);
        setPreviewMap({});
        setPrimaryDiscoOpen(false);
        setIsDiscoFocused(false);
        setOpenDisco(null);

        Promise.all([
            getSimilarArtists(artistName, 15), // Fetch fewer for the side panel
            getArtistInfo(artistName),
            getDiscography(artistName),
        ]).then(([simData, infoData, discoData]) => {
            setSimilar(simData);
            setArtistInfo(infoData);
            if (discoData) setPrimaryDisco(discoData);
            setLoading(false);
        });
    }, [artistName]);

    useEffect(() => {
        if (similar.length === 0) return;
        let cancelled = false;
        async function fetchPreviews() {
            for (let i = 0; i < similar.length; i += 3) {
                if (cancelled) return;
                if (i > 0) await new Promise((r) => setTimeout(r, 800));
                if (cancelled) return;
                const batch = similar.slice(i, i + 3);
                const results = await Promise.allSettled(batch.map(async (a) => {
                    const data = await getArtistPreviewData(a.name);
                    const firstTrack = data.tracks[0];
                    return { key: a.mbid || a.name, url: firstTrack?.preview || null, videoId: firstTrack?.videoId || null };
                }));
                if (cancelled) return;
                setPreviewMap((prev) => {
                    const next = { ...prev };
                    for (const r of results) {
                        if (r.status === "fulfilled" && (r.value.url || r.value.videoId)) next[r.value.key] = { url: r.value.url || "", videoId: r.value.videoId };
                    }
                    return next;
                });
            }
        }
        fetchPreviews();
        return () => { cancelled = true; };
    }, [similar]);

    const handleToggleBookmark = async (id: string, name: string, img?: string | null, genres?: string[]) => {
        if (!session?.user) { signIn(undefined, { callbackUrl: "/my-atlas" }); return; }
        setBookmarkingIds((prev) => new Set(prev).add(id));
        const isCurrentlyBookmarked = bookmarkedArtists.has(name);
        try {
            const res = await fetch(isCurrentlyBookmarked ? `/api/bookmarks?artistId=${id}` : "/api/bookmarks", {
                method: isCurrentlyBookmarked ? "DELETE" : "POST",
                headers: { "Content-Type": "application/json" },
                body: isCurrentlyBookmarked ? null : JSON.stringify({ name, artistId: id, imageUrl: img, genres: genres || [] }),
            });
            if (res.ok) {
                setBookmarkedArtists((prev) => {
                    const next = new Set(prev);
                    isCurrentlyBookmarked ? next.delete(name) : next.add(name);
                    return next;
                });
                if (onBookmarksChange) onBookmarksChange();
            }
        } finally {
            setBookmarkingIds((prev) => {
                const next = new Set(prev);
                next.delete(id);
                return next;
            });
        }
    };

    const handlePlay = (url: string, title?: string, artist?: string, coverUrl?: string | null, videoId?: string | null) => {
        const isSame = videoId ? currentTrack?.videoId === videoId : currentTrack?.url === url;
        if (isSame) { togglePlayPause(); return; }
        playTrack({
            url,
            title: title || "Top Track",
            artist: artist || artistName,
            coverUrl: coverUrl || artistInfo?.image || null,
            genres: artistInfo?.genres || [],
            videoId: videoId || undefined
        });
    };

    const handlePlayAlbumQueue = (targetArtist: string, targetImage?: string | null) => {
        return (tracks: AlbumTrack[], index: number, albumCover?: string) => {
            const info = infoCache[targetArtist] || artistInfo;
            const queueTracks = tracks.map((t) => ({
                url: t.preview,
                title: t.title,
                artist: targetArtist,
                coverUrl: albumCover || targetImage || null,
                genres: info?.genres || artistInfo?.genres || [],
                videoId: t.videoId || undefined,
            }));
            playQueue(queueTracks, index);
        };
    };

    const handleToggleDisco = async (name: string) => {
        if (openDisco === name) { setOpenDisco(null); return; }
        setOpenDisco(name);
        setExpandedAlbum(null);
        if (!discoCache[name]) {
            const disco = await getDiscography(name);
            if (disco) setDiscoCache((prev) => ({ ...prev, [name]: disco }));
        }
        if (!infoCache[name]) {
            const info = await getArtistInfo(name);
            if (info) setInfoCache((prev) => ({ ...prev, [name]: info }));
        }
    };

    const handleAlbumClick = async (albumId: number, isPrimary = false) => {
        const updater = isPrimary ? setExpandedAlbumPrimary : setExpandedAlbum;
        const current = isPrimary ? expandedAlbumPrimary : expandedAlbum;
        if (current === albumId) { updater(null); return; }
        updater(albumId);
        if (!albumTracksCache[albumId]) {
            const tracks = await getAlbumTracks(albumId);
            setAlbumTracksCache((prev) => ({ ...prev, [albumId]: tracks }));
        }
    };

    const primaryPreview = primaryDisco?.topTracks?.[0]?.preview || null;

    const isEmbedded = !!className;

    return (
        <motion.div
            initial={isEmbedded ? false : { x: "100%" }}
            animate={isEmbedded ? undefined : { x: 0 }}
            exit={isEmbedded ? undefined : { x: "100%" }}
            transition={isEmbedded ? undefined : { type: "spring", damping: 28, stiffness: 300 }}
            drag={isEmbedded ? false : "x"}
            dragConstraints={isEmbedded ? undefined : { left: 0, right: 0 }}
            dragElastic={isEmbedded ? undefined : { left: 0, right: 0.3 }}
            onDragEnd={isEmbedded ? undefined : (_: unknown, info: { offset: { x: number }; velocity: { x: number } }) => {
                if (info.offset.x > 100 || info.velocity.x > 500) {
                    onClose();
                }
            }}
            className={className || "fixed inset-y-0 right-0 w-full sm:w-[480px] bg-shift5-dark border-l border-white/5 shadow-[inset_1px_0_0_0_rgba(255,255,255,0.05)] z-50 flex flex-col touch-manipulation"}
        >
            {/* Drag handle — mobile only, floating mode only */}
            {!isEmbedded && <div className="sm:hidden absolute left-2 top-1/2 -translate-y-1/2 w-1 h-12 rounded-full bg-white/10" />}

            <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-white/5 bg-shift5-dark/95 backdrop-blur-md z-10">
                <div className="flex items-center gap-3">
                    {showCloseAsBack && (
                        <button onClick={onClose} className="text-white/40 hover:text-shift5-orange active:scale-90 transition-all p-1 -ml-1 touch-manipulation">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                        </button>
                    )}
                    <h3 className="text-[10px] font-mono text-white/30 uppercase tracking-[0.2em]">Artist_Profile // Recon</h3>
                </div>
                {!showCloseAsBack && (
                    <button onClick={onClose} className="text-white/20 hover:text-white active:scale-90 transition-all">
                        <X size={18} />
                    </button>
                )}
            </div>

            <div className="flex-1 overflow-y-auto overscroll-contain">
                {loading ? (
                    <div className="p-10 space-y-8 animate-pulse">
                        <div className="flex items-start gap-5">
                            <Skeleton className="w-[64px] h-[64px] bg-white/5 border border-white/5" />
                            <div className="flex-1 space-y-2">
                                <Skeleton className="w-1/2 h-6 bg-white/5" />
                                <Skeleton className="w-3/4 h-3 bg-white/5" />
                            </div>
                        </div>
                        <Skeleton className="w-full h-[120px] bg-white/5" />
                        <Skeleton className="w-full h-[200px] bg-white/5" />
                    </div>
                ) : (
                    <>
                        <div className="px-4 sm:px-6 py-4 sm:py-8 border-b border-white/5 bg-white/[0.01]">
                            <div className="flex items-start gap-3 sm:flex-col sm:items-start sm:gap-5 mb-4 sm:mb-6">
                                <ArtistAvatar name={artistName} image={artistInfo?.image} size={64} />
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1.5 sm:mb-2">
                                        <h2 className="text-lg sm:text-2xl font-bold text-white leading-none tracking-tighter uppercase truncate">{artistName}</h2>
                                        <StreamingLinks artistName={artistName} size={16} className="mt-0.5 shrink-0" />
                                    </div>
                                    {artistInfo && (
                                        <div className="mb-2 sm:mb-3 flex gap-1 overflow-x-auto sm:overflow-visible sm:flex-wrap no-scrollbar -mr-4 pr-4 sm:mr-0 sm:pr-0" style={{ touchAction: "pan-x", WebkitOverflowScrolling: "touch" }}>
                                            {artistInfo.genres.slice(0, 5).map(g => <div key={g} className="shrink-0"><GenreTag genre={g} onClick={() => onSelectGenre && onSelectGenre(g)} /></div>)}
                                        </div>
                                    )}
                                    <div className="text-[9px] sm:text-[10px] font-mono text-white/20 uppercase tracking-widest">
                                        {artistInfo?.listeners ? `${(artistInfo.listeners / 1000).toFixed(0)}K listeners` : "SCANNING..."}
                                    </div>
                                </div>
                            </div>

                            {/* Metadata Scans Grid — compact on mobile */}
                            <div className="grid grid-cols-2 gap-2 sm:gap-4 mb-5 sm:mb-8 p-3 sm:p-4 bg-white/[0.02] border border-white/5 font-mono text-[9px] sm:text-[10px] uppercase tracking-wider sm:tracking-widest">
                                <div className="space-y-0.5 sm:space-y-1 min-w-0">
                                    <div className="text-white/20">Origin</div>
                                    <div className="text-white truncate">{artistInfo?.location || "N/A"}</div>
                                </div>
                                <div className="space-y-0.5 sm:space-y-1 border-l border-white/5 pl-2 sm:pl-4 min-w-0">
                                    <div className="text-white/20">Est.</div>
                                    <div className="text-white">{artistInfo?.yearStarted || "N/A"}</div>
                                </div>
                                <div className="space-y-0.5 sm:space-y-1 border-t border-white/5 pt-2 sm:pt-3 min-w-0">
                                    <div className="text-white/20">Albums</div>
                                    <div className="text-white">{artistInfo?.nbAlbums || 0}</div>
                                </div>
                                <div className="space-y-0.5 sm:space-y-1 border-t border-l border-white/5 pt-2 sm:pt-3 pl-2 sm:pl-4 min-w-0">
                                    <div className="text-white/20">Match_Confidence</div>
                                    <div className="text-shift5-orange">100% (PRIMARY)</div>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                {primaryPreview && (
                                    <button onClick={() => playingUrl === primaryPreview ? togglePlayPause() : handlePlay(primaryPreview, primaryDisco?.topTracks?.[0]?.title, artistName, artistInfo?.image)} className={`flex-1 flex items-center justify-center gap-2 sm:gap-3 py-2.5 sm:py-3 border text-[10px] sm:text-[11px] font-mono font-bold uppercase tracking-widest transition-all active:scale-95 touch-manipulation ${playingUrl === primaryPreview ? "bg-shift5-orange border-shift5-orange text-white" : "bg-white/[0.05] border-white/10 text-white hover:bg-white/10 hover:border-white/30"}`}>
                                        {playingUrl === primaryPreview ? (
                                            <><span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" /><span className="sm:hidden">STOP</span><span className="hidden sm:inline">Stop Signal</span></>
                                        ) : (
                                            <><span className="text-[11px]">▶</span><span className="sm:hidden">PLAY</span><span className="hidden sm:inline">Intercept Signal</span></>
                                        )}
                                    </button>
                                )}
                                {artistInfo && (
                                    <button onClick={() => handleToggleBookmark(artistInfo.deezerId?.toString() || artistName, artistName, artistInfo.image, artistInfo.genres)} disabled={bookmarkingIds.has(artistInfo.deezerId?.toString() || "primary")} className={`flex items-center justify-center border transition-all duration-300 cursor-pointer active:scale-95 touch-manipulation ${bookmarkedArtists.has(artistName) ? "border-shift5-orange bg-shift5-orange/10 text-shift5-orange" : "bg-white/[0.05] border-white/10 text-white/50 hover:text-white hover:border-white/30"}`} style={{ width: 42, height: 42 }}>
                                        <Heart size={16} className={bookmarkedArtists.has(artistName) ? "fill-current" : ""} strokeWidth={bookmarkedArtists.has(artistName) ? 2.5 : 2} />
                                    </button>
                                )}
                            </div>

                            {artistInfo?.bio && (
                                <div className="mt-4 sm:mt-8">
                                    <div className="text-[9px] font-mono text-white/20 uppercase mb-1.5 sm:mb-2"><span className="hidden sm:inline">Subject_</span>Bio</div>
                                    <CollapsibleBio bio={artistInfo.bio} maxLen={160} theme="dark" />
                                </div>
                            )}
                        </div>

                        {primaryDisco?.albums && primaryDisco.albums.length > 0 && (
                            <div className="border-b border-white/5 pt-4 sm:pt-8">
                                <div className="px-4 sm:px-6 mb-3 sm:mb-4">
                                    <div className="text-[9px] font-mono text-white/20 tracking-[0.2em] uppercase mb-3 sm:mb-4"><span className="hidden sm:inline">Core_Artifacts // </span>Discography</div>

                                    {/* Horizontal Scroll Discography */}
                                    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide no-scrollbar -mx-2 px-2 mask-linear-right">
                                        {primaryDisco.albums.map((a) => (
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
                                                            handleAlbumClick(a.id, true);
                                                        }
                                                        // Smooth scroll to the accordion
                                                        setTimeout(() => {
                                                            primaryAccordionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                                                        }, 100);
                                                    }
                                                }}
                                                className={`relative min-w-[100px] aspect-square bg-white/5 border-2 transition-all cursor-pointer group/album ${expandedAlbumPrimary === a.id ? 'border-shift5-orange scale-105 z-10' : 'border-white/5 hover:border-white/20'}`}
                                            >
                                                {a.cover_medium ? (
                                                    <Image
                                                        src={a.cover_medium}
                                                        alt={a.title}
                                                        fill
                                                        className={`object-cover transition-all duration-500 ${expandedAlbumPrimary === a.id ? 'contrast-125 brightness-110' : 'grayscale group-hover/album:grayscale-0'}`}
                                                        unoptimized
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-[8px] font-mono text-white/10 uppercase">No_Sig</div>
                                                )}
                                                <div className="absolute inset-0 bg-shift5-dark/60 opacity-0 group-hover/album:opacity-100 transition-opacity flex items-end p-1.5 focus:pointer-events-none">
                                                    <span className="text-[7px] font-mono text-white uppercase leading-tight truncate w-full">{a.title}</span>
                                                </div>
                                                {expandedAlbumPrimary === a.id && (
                                                    <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-shift5-dark border-2 border-shift5-orange flex items-center justify-center">
                                                        <span className="text-[8px] text-shift5-orange animate-pulse">■</span>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div
                                    ref={primaryAccordionRef}
                                    className="transition-all duration-300 ease-in-out"
                                    style={{
                                        display: "grid",
                                        gridTemplateRows: primaryDiscoOpen ? "1fr" : "0fr",
                                        opacity: primaryDiscoOpen ? 1 : 0
                                    }}
                                >
                                    <div className="overflow-hidden bg-white/[0.01] px-6 py-8 border-t border-white/5">
                                        <div className="flex justify-end mb-4">
                                            <button
                                                onClick={() => {
                                                    setPrimaryDiscoOpen(false);
                                                    setIsDiscoFocused(false);
                                                }}
                                                className="text-[9px] font-mono text-white/20 hover:text-white uppercase tracking-widest transition-colors"
                                            >
                                                [ Terminate_Sync ]
                                            </button>
                                        </div>
                                        <DiscographyPanel
                                            albums={primaryDisco.albums}
                                            topTracks={primaryDisco.topTracks}
                                            playingUrl={playingUrl}
                                            onPlay={handlePlay}
                                            onStop={togglePlayPause}
                                            albumTracksCache={albumTracksCache}
                                            onAlbumClick={(id) => handleAlbumClick(id, true)}
                                            expandedAlbum={expandedAlbumPrimary}
                                            isFocused={isDiscoFocused}
                                            onResetFocus={() => setIsDiscoFocused(false)}
                                            onPlayAlbumQueue={handlePlayAlbumQueue(artistName, artistInfo?.image)}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="px-4 sm:px-6 py-3 sm:py-5 bg-white/[0.02] border-b border-white/5">
                            <h3 className="text-[9px] sm:text-[10px] font-mono text-white/20 tracking-[0.2em] uppercase">Similar_Artists</h3>
                        </div>
                        <div className="pb-12">
                            {similar.map((a, i) => (
                                <SimilarCard key={a.mbid || a.name} artist={a} index={i} onExplore={onSelectArtist} previewUrl={previewMap[a.mbid || a.name]?.url} previewVideoId={previewMap[a.mbid || a.name]?.videoId} isPlaying={playingUrl === previewMap[a.mbid || a.name]?.url && playingUrl !== null} onPlay={handlePlay} onStop={togglePlayPause} discography={discoCache[a.name] || null} discographyOpen={openDisco === a.name} onToggleDiscography={handleToggleDisco} playingUrl={playingUrl} bio={infoCache[a.name]?.bio} albumTracksCache={albumTracksCache} onAlbumClick={handleAlbumClick} expandedAlbum={expandedAlbum} bookmarkedArtists={bookmarkedArtists} bookmarkingIds={bookmarkingIds} onToggleBookmark={handleToggleBookmark} onPlayAlbumQueue={handlePlayAlbumQueue(a.name, a.image)} />
                            ))}
                        </div>
                    </>
                )}
            </div>

            <style jsx>{`
                @keyframes slideInRight {
                    0% { transform: translateX(100%); opacity: 0; }
                    100% { transform: translateX(0); opacity: 1; }
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(4px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </motion.div>
    );
}
