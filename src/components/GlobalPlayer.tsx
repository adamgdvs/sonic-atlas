"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { useAudio } from "@/contexts/AudioContext";
import { getSimilarArtists, getArtistPreviewData } from "@/lib/api";
import { Play, Pause, X, Radio, Zap, Music } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getGenreArtists } from "@/lib/api";
import { usePathname } from "next/navigation";

export default function GlobalPlayer() {
    const {
        currentTrack,
        isPlaying,
        progress,
        togglePlayPause,
        closePlayer,
        radioMode,
        setRadioMode,
        trackEndedRaw,
        playTrack,
        hasEverPlayed,
    } = useAudio();

    const pathname = usePathname();

    // Pages where the floating player button should appear
    const isDiscoveryPage = pathname === "/" ||
        pathname.startsWith("/artist") ||
        pathname.startsWith("/my-atlas") ||
        pathname.startsWith("/genre") ||
        pathname.startsWith("/genres");

    const [loadingNext, setLoadingNext] = useState(false);
    const [isSurging, setIsSurging] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Auto-hide: player collapses after 5s of inactivity (paused state)
    const [isHidden, setIsHidden] = useState(false);
    const hideTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Reset hide timer on any interaction or play state change
    useEffect(() => {
        if (hideTimerRef.current) clearTimeout(hideTimerRef.current);

        if (!isPlaying && currentTrack) {
            // Start 5-second countdown when paused
            hideTimerRef.current = setTimeout(() => {
                setIsHidden(true);
            }, 5000);
        } else {
            // Playing — always show
            setIsHidden(false);
        }

        return () => {
            if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
        };
    }, [isPlaying, currentTrack]);

    const handleReveal = () => {
        setIsHidden(false);
        // Reset the auto-hide timer
        if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
        hideTimerRef.current = setTimeout(() => {
            if (!isPlaying) setIsHidden(true);
        }, 5000);
    };

    // Protection for Radio Mode to prevent infinite skip-loops
    const lastProcessedTrackEndedRef = useRef<number>(0);

    const handleSurge = async () => {
        if (!currentTrack?.genres || currentTrack.genres.length === 0) {
            setError("NO_SECTOR_DATA_AVAILABLE");
            return;
        }

        setIsSurging(true);
        setError(null);

        try {
            const genres = currentTrack.genres;
            const randomGenre = genres[Math.floor(Math.random() * genres.length)];
            const artists = await getGenreArtists(randomGenre, 20);

            if (artists.length === 0) {
                setError("SECTOR_EMPTY");
                return;
            }

            const shuffled = [...artists].sort(() => Math.random() - 0.5).slice(0, 5);
            let found = false;

            for (const randomArtist of shuffled) {
                const previewData = await getArtistPreviewData(randomArtist.name);
                const trackWithPreview = previewData.tracks.find(t => t.preview);

                if (trackWithPreview) {
                    playTrack({
                        id: randomGenre,
                        url: trackWithPreview.preview,
                        title: trackWithPreview.title,
                        artist: randomArtist.name,
                        coverUrl: previewData.image || undefined,
                        genres: [randomGenre]
                    });
                    found = true;
                    break;
                }
            }

            if (!found) {
                setError("SIGNAL_LOST");
            }
        } catch (e) {
            console.error(e);
            setError("SURGE_FAILURE");
        } finally {
            setIsSurging(false);
        }
    };

    // Radio Mode Engine
    useEffect(() => {
        if (!radioMode || trackEndedRaw === 0 || !currentTrack || lastProcessedTrackEndedRef.current === trackEndedRaw) return;

        lastProcessedTrackEndedRef.current = trackEndedRaw;

        let cancelled = false;
        const fetchNextTrack = async () => {
            setLoadingNext(true);
            setError(null);

            try {
                const similar = await getSimilarArtists(currentTrack.artist, 10);
                if (cancelled) return;

                if (similar.length === 0) {
                    setError("No similar artists found.");
                    setLoadingNext(false);
                    return;
                }

                let nextTrack = null;
                let nextArtistName = "";
                let nextGenres: string[] = [];

                for (const artist of similar) {
                    const previewData = await getArtistPreviewData(artist.name);
                    if (cancelled) return;

                    const playableTrack = previewData.tracks.find((t) => t.preview);
                    if (playableTrack) {
                        nextTrack = playableTrack;
                        nextArtistName = artist.name;
                        nextGenres = artist.genres || [];
                        break;
                    }
                }

                if (!nextTrack) {
                    setError("No previews available for related artists.");
                    setLoadingNext(false);
                    return;
                }

                playTrack({
                    url: nextTrack.preview,
                    title: nextTrack.title,
                    artist: nextArtistName,
                    coverUrl: null,
                    genres: nextGenres
                });

            } catch (err) {
                console.error("Radio mode error:", err);
                if (!cancelled) setError("Radio fetch failed.");
            } finally {
                if (!cancelled) setLoadingNext(false);
            }
        };

        fetchNextTrack();

        return () => {
            cancelled = true;
        };
    }, [trackEndedRaw, radioMode, currentTrack, playTrack]);

    // Show floating button on discovery pages if player has been used before but no track is loaded
    if (!currentTrack) {
        if (!hasEverPlayed || !isDiscoveryPage) return null;
        return (
            <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-[#1D1D1F]/80 text-white/40 shadow-lg flex items-center justify-center hover:scale-110 hover:text-white/70 active:scale-95 transition-all border border-white/10"
                title="No track loaded"
            >
                <Music size={18} />
            </motion.button>
        );
    }

    return (
        <>
            {/* Floating reveal button when player is hidden */}
            <AnimatePresence>
                {isHidden && (
                    <motion.button
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        onClick={handleReveal}
                        className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-[#1D1D1F] text-white shadow-lg flex items-center justify-center hover:scale-110 active:scale-95 transition-transform border border-white/10"
                        title="Show Player"
                    >
                        <Music size={18} />
                        {/* Subtle progress ring */}
                        <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 48 48">
                            <circle cx="24" cy="24" r="22" fill="none" stroke="rgba(255,88,65,0.3)" strokeWidth="2" />
                            <circle
                                cx="24" cy="24" r="22" fill="none"
                                stroke="#ff5841" strokeWidth="2"
                                strokeDasharray={`${progress * 138.2} 138.2`}
                                strokeLinecap="round"
                            />
                        </svg>
                    </motion.button>
                )}
            </AnimatePresence>

            {/* Full player */}
            <AnimatePresence>
                {!isHidden && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                        className="fixed bottom-4 right-4 left-4 sm:left-auto sm:bottom-6 sm:right-6 lg:bottom-10 lg:right-10 z-50 pointer-events-auto"
                    >
                        <div className="bg-white/90 backdrop-blur-xl border border-[#F0F0F0] shadow-[0_12px_48px_rgba(0,0,0,0.12)] rounded-3xl p-3 flex items-center gap-3 sm:gap-4 w-full sm:w-[340px] relative overflow-hidden group">

                            {/* Progress Bar Background */}
                            <div className="absolute top-0 left-0 w-full h-[3px] bg-[#F8F8FA]">
                                <div
                                    className="h-full bg-[#1D1D1F] transition-all duration-150 ease-linear"
                                    style={{ width: `${progress * 100}%` }}
                                />
                            </div>

                            {/* Art - Vinyl Record Style */}
                            <div className="relative group shrink-0">
                                <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-[#E5E5E5] shadow-lg relative bg-[#F0F0F0]" style={{ clipPath: 'circle(50%)', WebkitClipPath: 'circle(50%)' }}>
                                    <motion.div
                                        animate={isPlaying ? { rotate: 360 } : { rotate: 0 }}
                                        transition={isPlaying ? { duration: 8, repeat: Infinity, ease: "linear" } : { duration: 0.5 }}
                                        className="w-full h-full flex items-center justify-center relative rounded-full"
                                        style={{ clipPath: 'circle(50%)', WebkitClipPath: 'circle(50%)' }}
                                    >
                                        {currentTrack.coverUrl ? (
                                            <img
                                                src={currentTrack.coverUrl}
                                                alt={currentTrack.title}
                                                className="object-cover w-full h-full rounded-full"
                                                style={{ clipPath: 'circle(50%)', WebkitClipPath: 'circle(50%)' }}
                                            />
                                        ) : (
                                            <div className="text-[10px] text-[#C4C4C4] font-medium tracking-tighter">♪</div>
                                        )}

                                        {/* Vinyl Grooves Effect */}
                                        <div className="absolute inset-0 bg-[radial-gradient(circle,transparent_40%,rgba(0,0,0,0.05)_41%,transparent_42%,rgba(0,0,0,0.05)_43%,transparent_44%)] pointer-events-none opacity-50 rounded-full" />

                                        {/* Center Label */}
                                        <div
                                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-white/90 rounded-full z-10 shadow-sm flex items-center justify-center"
                                            style={{ clipPath: 'circle(50%)', WebkitClipPath: 'circle(50%)' }}
                                        >
                                            <div
                                                className="w-1.5 h-1.5 bg-gray-200 rounded-full shadow-inner border border-black/5"
                                                style={{ clipPath: 'circle(50%)', WebkitClipPath: 'circle(50%)' }}
                                            />
                                        </div>
                                    </motion.div>
                                </div>
                            </div>

                            {/* Track Info */}
                            <div className="flex-1 min-w-0 pr-2">
                                <div className="flex items-center gap-2">
                                    <h3 className="text-sm font-semibold text-[#1D1D1F] truncate" style={{ letterSpacing: "-0.01em" }}>
                                        {currentTrack.title}
                                    </h3>
                                    {loadingNext && <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />}
                                </div>
                                <p className="text-xs truncate mt-0.5">
                                    <a
                                        href={`/artist/${encodeURIComponent(currentTrack.artist)}`}
                                        className="text-[#9CA3AF] hover:text-[#1D1D1F] hover:underline transition-colors"
                                    >
                                        {currentTrack.artist}
                                    </a>
                                </p>
                                {error && <p className="text-[10px] text-red-500 mt-1 truncate">{error}</p>}
                            </div>

                            {/* Controls */}
                            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                                <button
                                    onClick={handleSurge}
                                    disabled={isSurging}
                                    className={`p-1.5 rounded-full transition-all duration-300 ${isSurging ? 'bg-shift5-orange text-white animate-pulse' : 'text-[#C4C4C4] hover:text-shift5-orange hover:bg-shift5-orange/10'}`}
                                    title="Surge Relay (New artist in same genre)"
                                >
                                    <Zap size={16} fill={isSurging ? "currentColor" : "none"} className={isSurging ? "animate-bounce" : ""} />
                                </button>

                                <button
                                    onClick={() => setRadioMode(!radioMode)}
                                    className={`p-1.5 rounded-full transition-colors ${radioMode ? 'bg-[#1D1D1F] text-white' : 'text-[#C4C4C4] hover:text-[#1D1D1F] hover:bg-[#F0F0F0]'}`}
                                    title="Radio Mode"
                                >
                                    <Radio size={16} />
                                </button>

                                <button
                                    onClick={togglePlayPause}
                                    className="w-10 h-10 rounded-full bg-[#1D1D1F] text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-md"
                                >
                                    {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-0.5" />}
                                </button>
                            </div>

                            {/* Close Button Trigger (Appears on Hover) */}
                            <button
                                onClick={closePlayer}
                                className="absolute -top-2 -right-2 p-3 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <div className="w-5 h-5 rounded-full bg-black/10 flex items-center justify-center text-[#1D1D1F] backdrop-blur-md">
                                    <X size={12} />
                                </div>
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
