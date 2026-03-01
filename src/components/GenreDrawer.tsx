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
        return <Image src={image} alt={name} width={size} height={size} className="object-cover shrink-0" style={{ width: size, height: size }} unoptimized />;
    }
    return <ArtistInitials name={name} size={size} />;
}

// ─── Main Drawer Component ──────────────────────────────────────────

export default function GenreDrawer({
    genreName,
    onClose,
    showCloseAsBack = false,
    onSelectArtist,
    className
}: {
    genreName: string;
    onClose: () => void;
    showCloseAsBack?: boolean;
    onSelectArtist: (name: string) => void;
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
                    if (Array.isArray(data)) setBookmarkedArtists(new Set(data.map((b: any) => b.name)));
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
        if (!session?.user) { signIn(); return; }
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
        <div className={className || "absolute top-0 right-0 bottom-0 w-full md:w-[480px] bg-white/95 backdrop-blur-xl border-l border-[#F0F0F0] shadow-[-20px_0_40px_rgba(0,0,0,0.06)] z-50 flex flex-col transform transition-transform duration-300 ease-out"} style={className ? {} : { animation: "slideInRight 0.3s ease-out" }}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#F0F0F0/60]">
                <div className="flex items-center gap-3">
                    {showCloseAsBack && (
                        <button onClick={onClose} className="text-[#9CA3AF] hover:text-[#1D1D1F] transition-colors p-1 -ml-1">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                        </button>
                    )}
                    <h3 className="font-semibold text-[#1D1D1F] text-sm uppercase tracking-widest text-[#9CA3AF]">Genre Profile</h3>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto">
                <div className="px-6 py-6 border-b border-[#F0F0F0/60] bg-[radial-gradient(#FAFAFA_1px,transparent_1px)] [background-size:24px_24px]">
                    <h2 className="text-3xl font-bold text-[#1D1D1F] mb-1.5 leading-none tracking-tight capitalize">{genreName}</h2>
                    <p className="text-xs text-[#9CA3AF]">
                        Explore the deepest cuts associated with this category.
                    </p>
                </div>

                {loading ? (
                    <div className="p-6 animate-pulse space-y-4">
                        <Skeleton className="w-full h-[60px]" />
                        <Skeleton className="w-full h-[60px]" />
                        <Skeleton className="w-full h-[60px]" />
                        <Skeleton className="w-full h-[60px]" />
                    </div>
                ) : (
                    <div className="pb-8">
                        {artists.map((artist, index) => {
                            const cardId = artist.mbid || artist.name;
                            const isBookmarked = bookmarkedArtists.has(artist.name);
                            const isBookmarking = bookmarkingIds.has(cardId);
                            const previewUrl = previewMap[cardId];
                            const isPlayingHere = playingUrl === previewUrl && playingUrl !== null;

                            return (
                                <div key={cardId} style={{ animation: `fadeIn 0.3s ease ${index * 0.04}s both` }}>
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-3.5 border-b border-[#F0F0F0/50] cursor-default p-4 hover:bg-[#F8F8FA] transition-colors">
                                        <div className="flex items-center gap-3 sm:gap-3.5 flex-1 min-w-0">
                                            <ArtistAvatar name={artist.name} image={artist.image} size={48} />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2.5 mb-0.5 flex-wrap">
                                                    <span onClick={() => onSelectArtist(artist.name)} className="text-[15px] font-semibold text-[#1D1D1F] cursor-pointer hover:underline hover:text-blue-600 transition-colors truncate" style={{ letterSpacing: "-0.01em" }}>{artist.name}</span>
                                                    <StreamingLinks artistName={artist.name} size={18} />
                                                </div>
                                                <div className="text-[11px] text-[#9CA3AF] capitalize tracking-wide hidden sm:block">
                                                    {genreName} Artist
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-1.5 items-center shrink-0">
                                            {previewUrl && (
                                                <button onClick={() => isPlayingHere ? togglePlayPause() : handlePlay(previewUrl, "Preview", artist.name, artist.image)} className={`flex items-center justify-center border rounded-full cursor-pointer transition-all duration-150 shrink-0 ${isPlayingHere ? "border-[#1D1D1F] bg-[#1D1D1F] text-white" : "border-[#E5E5E5] bg-white text-[#1D1D1F] hover:bg-[#1D1D1F] hover:text-white hover:border-[#1D1D1F]"}`} style={{ width: 34, height: 34 }} title={isPlayingHere ? "Stop" : "Play"}>
                                                    {isPlayingHere ? <svg width={12} height={12} viewBox="0 0 12 12" fill="currentColor"><rect x="2" y="2" width="3" height="8" /><rect x="7" y="2" width="3" height="8" /></svg> : <svg width={12} height={12} viewBox="0 0 12 12" fill="currentColor"><polygon points="3,1 11,6 3,11" /></svg>}
                                                </button>
                                            )}
                                            <button onClick={() => handleToggleBookmark(cardId, artist.name, artist.image, [genreName])} disabled={isBookmarking} className={`flex items-center justify-center border transition-all duration-150 rounded-full cursor-pointer ${isBookmarked ? "border-[#FF4B4B] bg-[#FFF0F0] text-[#FF4B4B]" : "border-[#E5E5E5] bg-white text-[#9CA3AF] hover:text-[#1D1D1F] hover:border-[#D1D5DB]"}`} style={{ width: 34, height: 34 }}>
                                                <Heart size={16} className={isBookmarked ? "fill-current mt-[1px]" : "mt-[1px]"} strokeWidth={isBookmarked ? 2.5 : 2} />
                                            </button>
                                            <button onClick={() => onSelectArtist(artist.name)} className="text-[11px] font-semibold border rounded-full cursor-pointer whitespace-nowrap transition-all duration-150 border-[#E5E5E5] bg-[#FAFAFA] text-[#1D1D1F] hover:bg-[#1D1D1F] hover:text-white" style={{ padding: "0 12px", height: 34 }}>
                                                Explore
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
