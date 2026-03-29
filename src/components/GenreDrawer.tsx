"use client";

import { useState, useEffect } from "react";
import {
    getTopTagArtists,
    type TagArtistResult,
    getDiscography,
    getArtistInfo,
    getAlbumTracks,
    getArtistPreviewData,
    type Discography,
    type ArtistInfo,
    type AlbumTrack
} from "@/lib/api";
import { useSession, signIn } from "next-auth/react";
import { useAudio } from "@/contexts/AudioContext";
import { Skeleton } from "@/components/Skeleton";
// We reuse the exact same SimilarCard logic from ArtistDrawer, 
// so we need to either extract it or import it if exported.
// Since it's internal to ArtistDrawer, let's extract it to a shared file or duplicate the UI temporarily, 
// but wait, we can just extract it to a new file `src/components/SimilarCard.tsx`!

// For now, to ensure we don't break the build and strictly follow the plan,
// we will implement a simplified version of the SimilarCard UI natively here, 
// targeting the exact same CSS and layout logic.

import Image from "next/image";
import ArtistInitials from "@/components/ArtistInitials";
import GenreTag from "@/components/GenreTag";
import SimilarityBar from "@/components/SimilarityBar";
import { Heart } from "lucide-react";
import { truncateBio } from "@/lib/utils";
import StreamingLinks from "@/components/StreamingLinks";

// --- Internal Reused Components ---
function ArtistAvatar({ name, image, size = 44 }: { name: string; image?: string | null; size?: number }) {
    if (image) {
        return <Image src={image} alt={name} width={size} height={size} className="object-cover shrink-0 border border-white/10 grayscale group-hover:grayscale-0 transition-all duration-500" style={{ width: size, height: size }} unoptimized />;
    }
    return <ArtistInitials name={name} size={size} />;
}

// ─── Main Drawer Component ──────────────────────────────────────────

export default function GenreDrawer({
    genreName,
    onClose,
    showCloseAsBack = false,
    onSelectArtist,
    onBookmarksChange,
    className
}: {
    genreName: string;
    onClose: () => void;
    showCloseAsBack?: boolean;
    onSelectArtist: (name: string) => void;
    onBookmarksChange?: () => void;
    className?: string;
}) {
    const { data: session } = useSession();

    // Data State
    const [artists, setArtists] = useState<TagArtistResult[]>([]);
    const [loading, setLoading] = useState(true);
    const [previewMap, setPreviewMap] = useState<Record<string, string>>({});

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
                    if (Array.isArray(data)) setBookmarkedArtists(new Set(data.map((b: { name: string }) => b.name)));
                });
        }
    }, [session]);

    useEffect(() => {
        setLoading(true);
        setArtists([]);
        setPreviewMap({});

        getTopTagArtists(genreName, 50).then((data) => {
            setArtists(data);
            setLoading(false);
        });
    }, [genreName]);

    // Lazy load previews identically to the ArtistDrawer
    useEffect(() => {
        if (artists.length === 0) return;
        let cancelled = false;
        async function fetchPreviews() {
            for (let i = 0; i < artists.length; i += 3) {
                if (cancelled) return;
                if (i > 0) await new Promise((r) => setTimeout(r, 800));
                if (cancelled) return;
                const batch = artists.slice(i, i + 3);
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
    }, [artists]);

    const handleToggleBookmark = async (id: string, name: string, img?: string | null, genres?: string[]) => {
        if (!session?.user) { signIn(undefined, { callbackUrl: "/my-atlas" }); return; }
        setBookmarkingIds((prev) => new Set(prev).add(id));
        const isCurrentlyBookmarked = bookmarkedArtists.has(name);
        try {
            const res = await fetch(isCurrentlyBookmarked ? `/api/bookmarks?artistId=${id}` : "/api/bookmarks", {
                method: isCurrentlyBookmarked ? "DELETE" : "POST",
                headers: { "Content-Type": "application/json" },
                body: isCurrentlyBookmarked ? null : JSON.stringify({ name, artistId: id, imageUrl: img, genres: genres || [genreName] }),
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

    const handlePlay = (url: string, title?: string, artist?: string, coverUrl?: string | null) => {
        if (currentTrack?.url === url) { togglePlayPause(); return; }
        playTrack({ url, title: title || "Top Track", artist: artist || "Unknown", coverUrl: coverUrl || null });
    };

    return (
        <div className={className || "fixed inset-y-0 right-0 w-full sm:w-[480px] bg-shift5-dark border-l border-white/5 shadow-[inset_1px_0_0_0_rgba(255,255,255,0.05)] z-50 flex flex-col transform transition-transform duration-300 ease-out"} style={className ? {} : { animation: "slideInRight 0.3s ease-out" }}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-shift5-dark/95 backdrop-blur-md z-10">
                <div className="flex items-center gap-3">
                    {showCloseAsBack && (
                        <button onClick={onClose} className="text-white/40 hover:text-shift5-orange transition-colors p-1 -ml-1">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                        </button>
                    )}
                    <h3 className="text-[10px] font-mono text-white/30 uppercase tracking-[0.2em]">Genre_Profile // Recon</h3>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto">
                <div className="px-4 sm:px-6 py-6 sm:py-8 border-b border-white/5 bg-white/[0.01]">
                    <div className="flex items-center gap-3 mb-4">
                        <span className="text-[10px] font-mono text-shift5-orange uppercase tracking-[0.2em] bg-shift5-orange/10 px-2 py-0.5 border border-shift5-orange/20">Category_Filter</span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2 leading-none tracking-tighter uppercase truncate">{genreName}</h2>
                    <p className="text-[10px] font-mono text-white/20 uppercase tracking-widest leading-loose">
                        Intercepting artifacts associated with this sonic signature category.
                    </p>
                </div>

                {loading ? (
                    <div className="p-10 space-y-4 animate-pulse">
                        <Skeleton className="w-full h-[80px] bg-white/5" />
                        <Skeleton className="w-full h-[80px] bg-white/5" />
                        <Skeleton className="w-full h-[80px] bg-white/5" />
                    </div>
                ) : (
                    <div className="pb-12">
                        {artists.map((artist, index) => {
                            const cardId = artist.mbid || artist.name;
                            const isBookmarked = bookmarkedArtists.has(artist.name);
                            const isBookmarking = bookmarkingIds.has(cardId);
                            const previewUrl = previewMap[cardId];
                            const isPlayingHere = playingUrl === previewUrl && playingUrl !== null;

                            return (
                                <div key={cardId} style={{ animation: `fadeIn 0.3s ease ${index * 0.04}s both` }}>
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 border-b border-white/5 cursor-default p-5 bg-white/[0.01] hover:bg-white/[0.02] transition-colors group">
                                        <div className="flex items-center gap-4 flex-1 min-w-0">
                                            <ArtistAvatar name={artist.name} image={artist.image} size={48} />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-3 mb-1 flex-wrap">
                                                    <span onClick={() => onSelectArtist(artist.name)} className="text-[13px] font-bold text-white uppercase tracking-tight cursor-pointer hover:text-shift5-orange transition-colors truncate">{artist.name}</span>
                                                    <StreamingLinks artistName={artist.name} size={16} />
                                                </div>
                                                <div className="text-[9px] font-mono text-white/20 uppercase tracking-[0.2em]">
                                                    Node_Signature // {genreName}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 items-center shrink-0">
                                            {previewUrl && (
                                                <button onClick={() => isPlayingHere ? togglePlayPause() : handlePlay(previewUrl, "Preview", artist.name, artist.image)} className={`flex items-center justify-center border transition-all duration-300 shrink-0 ${isPlayingHere ? "bg-shift5-orange border-shift5-orange text-white" : "bg-white/[0.05] border-white/10 text-white hover:bg-white/10 hover:border-white/30"}`} style={{ width: 34, height: 34 }} title={isPlayingHere ? "Stop" : "Play"}>
                                                    {isPlayingHere ? <svg width={12} height={12} viewBox="0 0 12 12" fill="currentColor"><rect x="2" y="2" width="3" height="8" /><rect x="7" y="2" width="3" height="8" /></svg> : <svg width={12} height={12} viewBox="0 0 12 12" fill="currentColor"><polygon points="3,1 11,6 3,11" /></svg>}
                                                </button>
                                            )}
                                            <button onClick={() => handleToggleBookmark(cardId, artist.name, artist.image, [genreName])} disabled={isBookmarking} className={`flex items-center justify-center border transition-all duration-300 cursor-pointer ${isBookmarked ? "border-shift5-orange bg-shift5-orange/10 text-shift5-orange" : "bg-white/[0.05] border-white/10 text-white/50 hover:text-white hover:border-white/30"}`} style={{ width: 34, height: 34 }}>
                                                <Heart size={15} className={isBookmarked ? "fill-current" : ""} strokeWidth={isBookmarked ? 2.5 : 2} />
                                            </button>
                                            <button onClick={() => onSelectArtist(artist.name)} className={`text-[9px] font-bold font-mono border uppercase cursor-pointer whitespace-nowrap transition-all duration-300 bg-white/[0.05] border-white/10 text-white/50 hover:text-white hover:border-white/30`} style={{ padding: "0 10px", height: 34, letterSpacing: '0.1em' }}>
                                                EXPLORE
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
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
        </div>
    );
}
