"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
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

// ─── Shared Sub-components (Copied from ArtistPage for isolation) ───

function ArtistAvatar({ name, image, size = 44 }: { name: string; image?: string | null; size?: number }) {
    if (image) {
        return <Image src={image} alt={name} width={size} height={size} className="object-cover shrink-0" style={{ width: size, height: size }} unoptimized />;
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
            {bio && <p className="text-xs text-[#6B7280] leading-relaxed mb-4">{truncateBio(bio)}</p>}
            {topTracks.length > 0 && (
                <div className="mb-4">
                    <div className="text-[11px] font-semibold text-[#9CA3AF] uppercase mb-2" style={{ letterSpacing: "0.08em" }}>Popular Tracks</div>
                    <div className="max-w-[500px]">
                        {topTracks.slice(0, 5).map((t, i) => {
                            const isPlaying = playingUrl === t.preview;
                            const mins = Math.floor(t.duration / 60);
                            const secs = t.duration % 60;
                            return (
                                <div key={t.id} className="flex items-center gap-3 py-2 px-1 hover:bg-[#F8F8FA] transition-colors cursor-pointer" onClick={() => isPlaying ? onStop() : onPlay(t.preview, t.title)}>
                                    <span className={`w-6 text-center text-[11px] font-[family-name:var(--font-dm-mono)] ${isPlaying ? "text-[#1D1D1F] font-bold" : "text-[#C4C4C4]"}`}>{isPlaying ? "▪▪" : i + 1}</span>
                                    <span className={`text-sm flex-1 truncate ${isPlaying ? "text-[#1D1D1F] font-medium" : "text-[#1D1D1F]"}`}>{t.title}</span>
                                    <span className="text-[11px] text-[#C4C4C4] font-[family-name:var(--font-dm-mono)]">{mins}:{secs.toString().padStart(2, "0")}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
            {albums.length > 0 && (
                <div>
                    <div className="text-[11px] font-semibold text-[#9CA3AF] uppercase mb-3" style={{ letterSpacing: "0.08em" }}>Discography</div>
                    <div className="space-y-0">
                        {albums.map((a) => {
                            const year = a.release_date?.slice(0, 4);
                            const isExpanded = expandedAlbum === a.id;
                            const tracks = albumTracksCache[a.id];
                            return (
                                <div key={a.id}>
                                    <div className="flex items-center gap-3 py-2.5 px-1 hover:bg-[#F8F8FA] transition-colors cursor-pointer" onClick={() => onAlbumClick(a.id)}>
                                        <div className="w-[56px] h-[56px] bg-[#F0F0F0] shrink-0 overflow-hidden">
                                            {a.cover_medium ? <Image src={a.cover_medium} alt={a.title} width={56} height={56} className="object-cover" unoptimized /> : <div className="w-full h-full flex items-center justify-center text-[#C4C4C4] text-[10px]">No art</div>}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-[#1D1D1F] truncate">{a.title}</p>
                                            <p className="text-[11px] text-[#9CA3AF]">{year}{a.nb_tracks > 0 && ` · ${a.nb_tracks} tracks`}</p>
                                        </div>
                                        <span className="text-[11px] text-[#C4C4C4] shrink-0">{isExpanded ? "▲" : "▼"}</span>
                                    </div>
                                    <div className="transition-all duration-200 ease-in-out" style={{ display: "grid", gridTemplateRows: isExpanded ? "1fr" : "0fr", opacity: isExpanded ? 1 : 0 }}>
                                        <div className="overflow-hidden">
                                            <div className="pl-[72px] pr-2 pb-3">
                                                {!tracks ? <p className="text-[11px] text-[#9CA3AF] py-2">Loading tracks...</p> : tracks.length === 0 ? <p className="text-[11px] text-[#9CA3AF] py-2">No tracks available</p> : tracks.map((t, i) => {
                                                    const isPlaying = playingUrl === t.preview;
                                                    const mins = Math.floor(t.duration / 60);
                                                    const secs = t.duration % 60;
                                                    return (
                                                        <div key={t.id} className="flex items-center gap-3 py-1.5 hover:bg-[#F8F8FA] transition-colors cursor-pointer" onClick={() => { if (t.preview) { isPlaying ? onStop() : onPlay(t.preview, t.title); } }}>
                                                            <span className={`w-5 text-center text-[11px] font-[family-name:var(--font-dm-mono)] ${isPlaying ? "text-[#1D1D1F] font-bold" : "text-[#C4C4C4]"}`}>{isPlaying ? "▪▪" : i + 1}</span>
                                                            <span className={`text-xs flex-1 truncate ${isPlaying ? "text-[#1D1D1F] font-medium" : "text-[#6B7280]"}`}>{t.title}</span>
                                                            {t.preview && <span className="text-[10px] text-[#C4C4C4]">{isPlaying ? "■" : "▶"}</span>}
                                                            <span className="text-[11px] text-[#C4C4C4] font-[family-name:var(--font-dm-mono)]">{mins}:{secs.toString().padStart(2, "0")}</span>
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
}: {
    artist: SimilarArtistResult;
    index: number;
    onExplore: (name: string) => void;
    previewUrl?: string;
    isPlaying: boolean;
    onPlay: (url: string, title?: string, artist?: string, image?: string | null) => void;
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
}) {
    const cardId = artist.mbid || artist.name;
    const isBookmarked = bookmarkedArtists.has(artist.name);
    const isBookmarking = bookmarkingIds.has(cardId);

    return (
        <div style={{ animation: `fadeIn 0.3s ease ${index * 0.04}s both` }}>
            <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-3.5 border-b border-[#F0F0F0/50] cursor-default p-4 hover:bg-[#F8F8FA] transition-colors">
                <div className="flex items-center gap-3 sm:gap-3.5 flex-1 min-w-0">
                    <ArtistAvatar name={artist.name} image={artist.image} size={44} />
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2.5 mb-1 flex-wrap">
                            <span onClick={() => onExplore(artist.name)} className="text-[14px] font-semibold text-[#1D1D1F] cursor-pointer hover:underline truncate" style={{ letterSpacing: "-0.01em" }}>{artist.name}</span>
                            <StreamingLinks artistName={artist.name} size={18} />
                            <SimilarityBar value={artist.match} />
                        </div>
                        {artist.genres.length > 0 && (
                            <div className="mb-1.5 flex flex-wrap gap-1.5 border-none">
                                {artist.genres.slice(0, 4).map((g) => (
                                    <GenreTag key={g} genre={g} onClick={() => { }} />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
                <div className="flex gap-1.5 items-center sm:items-start shrink-0">
                    {previewUrl && (
                        <button onClick={() => isPlaying ? onStop() : onPlay(previewUrl, "Preview", artist.name, artist.image)} className={`flex items-center justify-center border cursor-pointer transition-all duration-150 shrink-0 ${isPlaying ? "border-[#1D1D1F] bg-[#1D1D1F] text-white" : "border-[#E5E5E5] bg-[#FAFAFA] text-[#1D1D1F] hover:bg-[#1D1D1F] hover:text-white"}`} style={{ width: 28, height: 28 }} title={isPlaying ? "Stop" : "Play"}>
                            {isPlaying ? <svg width={10} height={10} viewBox="0 0 12 12" fill="currentColor"><rect x="1" y="1" width="4" height="10" /><rect x="7" y="1" width="4" height="10" /></svg> : <svg width={10} height={10} viewBox="0 0 12 12" fill="currentColor"><polygon points="2,0 12,6 2,12" /></svg>}
                        </button>
                    )}
                    <button onClick={() => onToggleBookmark(cardId, artist.name, artist.image, artist.genres)} disabled={isBookmarking} className={`flex items-center justify-center border transition-all duration-150 rounded-sm cursor-pointer ${isBookmarked ? "border-[#FF4B4B] bg-[#FFF0F0] text-[#FF4B4B]" : "border-[#E5E5E5] bg-[#FAFAFA] text-[#9CA3AF] hover:text-[#1D1D1F]"}`} style={{ width: 28, height: 28 }}>
                        <Heart size={14} className={isBookmarked ? "fill-current" : ""} strokeWidth={isBookmarked ? 2.5 : 2} />
                    </button>
                    <button onClick={() => onToggleDiscography(artist.name)} className={`text-[10px] font-semibold border cursor-pointer whitespace-nowrap transition-all duration-150 ${discographyOpen ? "border-[#1D1D1F] bg-[#1D1D1F] text-white" : "border-[#E5E5E5] bg-[#FAFAFA] text-[#1D1D1F] hover:bg-[#1D1D1F] hover:text-white"}`} style={{ padding: "0 8px", height: 28 }}>
                        {discographyOpen ? "Close" : "Explore"}
                    </button>
                </div>
            </div>
            <div className="transition-all duration-300 ease-in-out" style={{ display: "grid", gridTemplateRows: discographyOpen ? "1fr" : "0fr", opacity: discographyOpen ? 1 : 0 }}>
                <div className="overflow-hidden">
                    <div className="p-4 bg-[rgba(250,250,250,0.5)] border-b border-[#F0F0F0]">
                        {discography ? <DiscographyPanel albums={discography.albums} topTracks={discography.topTracks} playingUrl={playingUrl} onPlay={onPlay} onStop={onStop} albumTracksCache={albumTracksCache} onAlbumClick={onAlbumClick} expandedAlbum={expandedAlbum} bio={bio} /> : <div className="text-xs text-[#9CA3AF] py-2">Loading...</div>}
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
    className
}: {
    artistName: string;
    onClose: () => void;
    showCloseAsBack?: boolean;
    onSelectArtist: (name: string) => void;
    onSelectGenre?: (genre: string) => void;
    className?: string;
}) {
    const { data: session } = useSession();

    // Data State
    const [similar, setSimilar] = useState<SimilarArtistResult[]>([]);
    const [artistInfo, setArtistInfo] = useState<ArtistInfo | null>(null);
    const [primaryDisco, setPrimaryDisco] = useState<Discography | null>(null);
    const [loading, setLoading] = useState(true);
    const [previewMap, setPreviewMap] = useState<Record<string, string>>({});

    // UI State
    const [primaryDiscoOpen, setPrimaryDiscoOpen] = useState(false);
    const [openDisco, setOpenDisco] = useState<string | null>(null);
    const [discoCache, setDiscoCache] = useState<Record<string, Discography>>({});
    const [infoCache, setInfoCache] = useState<Record<string, ArtistInfo>>({});
    const [albumTracksCache, setAlbumTracksCache] = useState<Record<number, AlbumTrack[]>>({});
    const [expandedAlbum, setExpandedAlbum] = useState<number | null>(null);
    const [expandedAlbumPrimary, setExpandedAlbumPrimary] = useState<number | null>(null);

    // Bookmarking
    const [bookmarkedArtists, setBookmarkedArtists] = useState<Set<string>>(new Set());
    const [bookmarkingIds, setBookmarkingIds] = useState<Set<string>>(new Set());

    const { playTrack, currentTrack, isPlaying, togglePlayPause } = useAudio();
    const playingUrl = isPlaying ? (currentTrack?.url ?? null) : null;

    useEffect(() => {
        if (session?.user) {
            fetch("/api/bookmarks")
                .then((res) => res.json())
                .then((data) => {
                    if (Array.isArray(data)) setBookmarkedArtists(new Set(data.map((b: any) => b.name)));
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
                    return { key: a.mbid || a.name, url: data.tracks[0]?.preview || null };
                }));
                if (cancelled) return;
                setPreviewMap((prev) => {
                    const next = { ...prev };
                    for (const r of results) {
                        if (r.status === "fulfilled" && r.value.url) next[r.value.key] = r.value.url;
                    }
                    return next;
                });
            }
        }
        fetchPreviews();
        return () => { cancelled = true; };
    }, [similar]);

    const handleToggleBookmark = async (id: string, name: string, img?: string | null, genres?: string[]) => {
        if (!session?.user) { signIn(); return; }
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
            }
        } finally {
            setBookmarkingIds((prev) => {
                const next = new Set(prev);
                next.delete(id);
                return next;
            });
        }
    };

    const handlePlay = (url: string, title?: string, artist?: string, coverUrl?: string | null) => {
        if (currentTrack?.url === url) { togglePlayPause(); return; }
        playTrack({ url, title: title || "Top Track", artist: artist || artistName, coverUrl: coverUrl || artistInfo?.image || null });
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

    return (
        <div className={className || "absolute top-0 right-0 bottom-0 w-full md:w-[480px] bg-white/95 backdrop-blur-xl border-l border-[#F0F0F0] shadow-[-20px_0_40px_rgba(0,0,0,0.06)] z-50 flex flex-col transform transition-transform duration-300 ease-out"} style={className ? {} : { animation: "slideInRight 0.3s ease-out" }}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#F0F0F0/60]">
                <div className="flex items-center gap-3">
                    {showCloseAsBack && (
                        <button onClick={onClose} className="text-[#9CA3AF] hover:text-[#1D1D1F] transition-colors p-1 -ml-1">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                        </button>
                    )}
                    <h3 className="font-semibold text-[#1D1D1F] text-sm uppercase tracking-widest text-[#9CA3AF]">Artist Profile</h3>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto">
                {loading ? (
                    <div className="p-6 animate-pulse">
                        <div className="flex items-start gap-4 mb-6">
                            <Skeleton className="w-[64px] h-[64px] rounded-full shrink-0" />
                            <div className="flex-1">
                                <Skeleton className="w-1/2 h-6 mb-2" />
                                <Skeleton className="w-3/4 h-3 mb-1" />
                                <Skeleton className="w-2/3 h-3" />
                            </div>
                        </div>
                        <Skeleton className="w-full h-[60px] mb-4" />
                        <Skeleton className="w-full h-[60px] mb-4" />
                        <Skeleton className="w-full h-[60px]" />
                    </div>
                ) : (
                    <>
                        <div className="px-6 py-6 border-b border-[#F0F0F0/60]">
                            <div className="flex items-start gap-4 mb-4">
                                <ArtistAvatar name={artistName} image={artistInfo?.image} size={64} />
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1.5">
                                        <h2 className="text-2xl font-semibold text-[#1D1D1F] leading-none tracking-tight truncate">{artistName}</h2>
                                        <StreamingLinks artistName={artistName} size={22} className="mt-0.5" />
                                    </div>
                                    {artistInfo && (
                                        <div className="mb-2 flex flex-wrap gap-1.5">
                                            {artistInfo.genres.slice(0, 6).map(g => <GenreTag key={g} genre={g} onClick={() => onSelectGenre && onSelectGenre(g)} />)}
                                        </div>
                                    )}
                                    <div className="text-[11px] text-[#9CA3AF]">
                                        {artistInfo?.listeners ? `${(artistInfo.listeners / 1000).toFixed(0)}K listeners` : "Loading..."}
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                {primaryPreview && (
                                    <button onClick={() => playingUrl === primaryPreview ? togglePlayPause() : handlePlay(primaryPreview, primaryDisco?.topTracks?.[0]?.title, artistName, artistInfo?.image)} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-sm text-sm font-semibold transition-all ${playingUrl === primaryPreview ? "bg-[#1D1D1F] text-white" : "bg-[#F8F8FA] text-[#1D1D1F] border border-[#E5E5E5] hover:bg-white hover:border-[#1D1D1F]"}`}>
                                        {playingUrl === primaryPreview ? "Stop Preview" : "Play Top Track"}
                                    </button>
                                )}
                                {artistInfo && (
                                    <button onClick={() => handleToggleBookmark(artistInfo.deezerId?.toString() || artistName, artistName, artistInfo.image, artistInfo.genres)} disabled={bookmarkingIds.has(artistInfo.deezerId?.toString() || "primary")} className={`flex items-center justify-center border transition-all duration-150 rounded-sm cursor-pointer ${bookmarkedArtists.has(artistName) ? "border-[#FF4B4B] bg-[#FFF0F0] text-[#FF4B4B]" : "border-[#E5E5E5] bg-[#FAFAFA] text-[#9CA3AF] hover:text-[#1D1D1F]"}`} style={{ width: 42, height: 42 }}>
                                        <Heart size={18} className={bookmarkedArtists.has(artistName) ? "fill-current" : ""} strokeWidth={bookmarkedArtists.has(artistName) ? 2.5 : 2} />
                                    </button>
                                )}
                            </div>

                            {artistInfo?.bio && <p className="text-[12px] text-[#6B7280] leading-relaxed mt-4">{truncateBio(artistInfo.bio, 260)}</p>}
                        </div>

                        {primaryDisco?.albums && primaryDisco.albums.length > 0 && (
                            <div className="border-b border-[#F0F0F0/60]">
                                <button onClick={() => setPrimaryDiscoOpen(!primaryDiscoOpen)} className="w-full flex items-center justify-between px-6 py-4 text-xs font-semibold text-[#1D1D1F] hover:bg-[#F8F8FA] transition-colors">
                                    <span className="uppercase tracking-widest text-[#9CA3AF]">Discography & Top Tracks</span>
                                    <span>{primaryDiscoOpen ? "−" : "+"}</span>
                                </button>
                                <div className="transition-all duration-300 ease-in-out" style={{ display: "grid", gridTemplateRows: primaryDiscoOpen ? "1fr" : "0fr", opacity: primaryDiscoOpen ? 1 : 0 }}>
                                    <div className="overflow-hidden bg-[#FAFAFA] px-6 py-4">
                                        <DiscographyPanel albums={primaryDisco.albums} topTracks={primaryDisco.topTracks} playingUrl={playingUrl} onPlay={handlePlay} onStop={togglePlayPause} albumTracksCache={albumTracksCache} onAlbumClick={(id) => handleAlbumClick(id, true)} expandedAlbum={expandedAlbumPrimary} />
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="px-6 py-4 border-b border-[#F0F0F0/60]">
                            <h3 className="font-semibold text-xs tracking-widest uppercase text-[#9CA3AF]">Similar Artists</h3>
                        </div>
                        <div className="pb-8">
                            {similar.map((a, i) => (
                                <SimilarCard key={a.mbid || a.name} artist={a} index={i} onExplore={onSelectArtist} previewUrl={previewMap[a.mbid || a.name]} isPlaying={playingUrl === previewMap[a.mbid || a.name] && playingUrl !== null} onPlay={handlePlay} onStop={togglePlayPause} discography={discoCache[a.name] || null} discographyOpen={openDisco === a.name} onToggleDiscography={handleToggleDisco} playingUrl={playingUrl} bio={infoCache[a.name]?.bio} albumTracksCache={albumTracksCache} onAlbumClick={handleAlbumClick} expandedAlbum={expandedAlbum} bookmarkedArtists={bookmarkedArtists} bookmarkingIds={bookmarkingIds} onToggleBookmark={handleToggleBookmark} />
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
            `}</style>
        </div>
    );
}
