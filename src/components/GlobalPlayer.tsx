"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useAudio, RepeatMode } from "@/contexts/AudioContext";
import { getSimilarArtists, getArtistPreviewData } from "@/lib/api";
import { Play, Pause, X, Radio, Zap, Music, SkipBack, SkipForward, Shuffle, Repeat, Repeat1, ChevronDown, ListMusic, Clock, Plus } from "lucide-react";
import QueuePanel from "@/components/QueuePanel";
import HistoryPanel from "@/components/HistoryPanel";
import PlaylistModal from "@/components/PlaylistModal";
import { motion, AnimatePresence, useMotionValue, useTransform, animate as motionAnimate } from "framer-motion";
import { getGenreArtists } from "@/lib/api";
import { usePathname } from "next/navigation";

function formatTime(seconds: number): string {
    if (!isFinite(seconds) || seconds < 0) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function GlobalPlayer() {
    const {
        currentTrack,
        isPlaying,
        progress,
        currentTime,
        duration,
        togglePlayPause,
        closePlayer,
        radioMode,
        setRadioMode,
        trackEndedRaw,
        playTrack,
        seek,
        hasEverPlayed,
        nextTrack,
        prevTrack,
        hasQueue,
        queue,
        queueIndex,
        shuffleMode,
        setShuffleMode,
        repeatMode,
        setRepeatMode,
    } = useAudio();

    const pathname = usePathname();

    const isDiscoveryPage = pathname === "/" ||
        pathname.startsWith("/artist") ||
        pathname.startsWith("/my-atlas") ||
        pathname.startsWith("/genre") ||
        pathname.startsWith("/genres");

    const [loadingNext, setLoadingNext] = useState(false);
    const [isSurging, setIsSurging] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Mobile expanded state
    const [mobileExpanded, setMobileExpanded] = useState(false);

    // Queue, History & Playlist panels
    const [queueOpen, setQueueOpen] = useState(false);
    const [historyOpen, setHistoryOpen] = useState(false);
    const [playlistModalOpen, setPlaylistModalOpen] = useState(false);

    // Mini bar swipe gesture
    const miniBarX = useMotionValue(0);
    const miniBarOpacity = useTransform(miniBarX, [-120, 0, 120], [0.4, 1, 0.4]);
    const [swipeHint, setSwipeHint] = useState<"prev" | "next" | null>(null);

    const handleMiniBarDragEnd = (_: unknown, info: { offset: { x: number }; velocity: { x: number } }) => {
        const swipeThreshold = 60;
        const velocityThreshold = 300;
        const offsetX = info.offset.x;
        const velocityX = info.velocity.x;

        if (offsetX < -swipeThreshold || velocityX < -velocityThreshold) {
            // Swipe left → next track
            if (canSkipForward) {
                hasQueue ? nextTrack() : seek(0.9999);
            }
        } else if (offsetX > swipeThreshold || velocityX > velocityThreshold) {
            // Swipe right → previous track
            prevTrack();
        }

        setSwipeHint(null);
        motionAnimate(miniBarX, 0, { type: "spring", stiffness: 400, damping: 30 });
    };

    // Auto-hide: player collapses after 8s of inactivity (paused state)
    const [isHidden, setIsHidden] = useState(false);
    const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Seekbar dragging
    const seekbarRef = useRef<HTMLDivElement | null>(null);
    const [isSeeking, setIsSeeking] = useState(false);

    const handleSeekbarInteraction = useCallback((clientX: number) => {
        if (!seekbarRef.current) return;
        const rect = seekbarRef.current.getBoundingClientRect();
        const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
        seek(ratio);
    }, [seek]);

    const handleSeekMouseDown = useCallback((e: React.MouseEvent) => {
        setIsSeeking(true);
        handleSeekbarInteraction(e.clientX);
    }, [handleSeekbarInteraction]);

    useEffect(() => {
        if (!isSeeking) return;
        const handleMouseMove = (e: MouseEvent) => handleSeekbarInteraction(e.clientX);
        const handleMouseUp = () => setIsSeeking(false);
        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);
        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        };
    }, [isSeeking, handleSeekbarInteraction]);

    const handleSeekTouch = useCallback((e: React.TouchEvent) => {
        handleSeekbarInteraction(e.touches[0].clientX);
    }, [handleSeekbarInteraction]);

    // Reset hide timer on any interaction or play state change
    useEffect(() => {
        if (hideTimerRef.current) clearTimeout(hideTimerRef.current);

        if (!isPlaying && currentTrack) {
            hideTimerRef.current = setTimeout(() => {
                setIsHidden(true);
            }, 8000);
        } else {
            setIsHidden(false);
        }

        return () => {
            if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
        };
    }, [isPlaying, currentTrack]);

    const handleReveal = () => {
        setIsHidden(false);
        if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
        hideTimerRef.current = setTimeout(() => {
            if (!isPlaying) setIsHidden(true);
        }, 8000);
    };

    // Protection for Radio Mode to prevent infinite skip-loops
    const lastProcessedTrackEndedRef = useRef<number>(0);

    const cycleRepeat = () => {
        const modes: RepeatMode[] = ["none", "all", "one"];
        const idx = modes.indexOf(repeatMode);
        setRepeatMode(modes[(idx + 1) % modes.length]);
    };

    const canSkipForward = hasQueue || radioMode;
    const canSkipBack = hasQueue || true; // always allow restart

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
                const playableTrack = previewData.tracks.find(t => t.videoId || t.preview);

                if (playableTrack) {
                    playTrack({
                        id: randomGenre,
                        url: playableTrack.preview || "",
                        title: playableTrack.title,
                        artist: randomArtist.name,
                        coverUrl: previewData.image || undefined,
                        genres: [randomGenre],
                        videoId: playableTrack.videoId || undefined,
                    });
                    found = true;
                    break;
                }
            }

            if (!found) {
                setError("SIGNAL_LOST");
            }
        } catch {
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

                const artistList = shuffleMode
                    ? [...similar].sort(() => Math.random() - 0.5)
                    : similar;

                let nextRadioTrack = null;
                let nextArtistName = "";
                let nextGenres: string[] = [];

                for (const artist of artistList) {
                    const previewData = await getArtistPreviewData(artist.name);
                    if (cancelled) return;

                    const playableTrack = previewData.tracks.find((t) => t.videoId || t.preview);
                    if (playableTrack) {
                        nextRadioTrack = playableTrack;
                        nextArtistName = artist.name;
                        nextGenres = artist.genres || [];
                        break;
                    }
                }

                if (!nextRadioTrack) {
                    setError("No previews available for related artists.");
                    setLoadingNext(false);
                    return;
                }

                playTrack({
                    url: nextRadioTrack.preview || "",
                    title: nextRadioTrack.title,
                    artist: nextArtistName,
                    coverUrl: null,
                    genres: nextGenres,
                    videoId: nextRadioTrack.videoId || undefined,
                });

            } catch {
                if (!cancelled) setError("Radio fetch failed.");
            } finally {
                if (!cancelled) setLoadingNext(false);
            }
        };

        fetchNextTrack();

        return () => {
            cancelled = true;
        };
    }, [trackEndedRaw, radioMode, currentTrack, playTrack, shuffleMode]);

    // Show floating button on discovery pages if player has been used before but no track is loaded
    if (!currentTrack) {
        if (!hasEverPlayed || !isDiscoveryPage) return null;
        return (
            <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-12 h-12 rounded-full bg-[#1D1D1F]/80 text-white/40 shadow-lg flex items-center justify-center hover:scale-110 hover:text-white/70 active:scale-95 transition-all border border-white/10"
                title="No track loaded"
            >
                <Music size={18} />
            </motion.button>
        );
    }

    const timeRemaining = duration - currentTime;

    // ─── Mobile Full-Screen Player ────────────────────────────────
    const renderMobileExpanded = () => (
        <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_: unknown, info: { offset: { y: number }; velocity: { y: number } }) => {
                if (info.offset.y > 120 || info.velocity.y > 500) {
                    setMobileExpanded(false);
                }
            }}
            className="fixed inset-0 z-[60] flex flex-col sm:hidden overflow-hidden"
        >
            {/* Drag handle indicator */}
            <div className="relative z-10 flex justify-center pt-2">
                <div className="w-10 h-1 rounded-full bg-white/20" />
            </div>

            {/* Blurred album art background */}
            {currentTrack.coverUrl && (
                <div className="absolute inset-0 z-0">
                    <img
                        src={currentTrack.coverUrl}
                        alt=""
                        className="w-full h-full object-cover scale-110 blur-[80px] opacity-40"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-shift5-dark/80 via-shift5-dark/90 to-shift5-dark" />
                </div>
            )}
            {!currentTrack.coverUrl && <div className="absolute inset-0 z-0 bg-shift5-dark" />}

            {/* Top bar: collapse + track info */}
            <div className="relative z-10 flex items-center justify-between px-5 pt-[max(12px,env(safe-area-inset-top))] pb-2">
                <button
                    onClick={() => setMobileExpanded(false)}
                    className="w-10 h-10 flex items-center justify-center text-white/60 active:scale-90"
                    aria-label="Collapse player"
                >
                    <ChevronDown size={24} />
                </button>
                <div className="text-[10px] font-mono text-white/40 uppercase tracking-widest">
                    {radioMode ? (
                        <span className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-shift5-orange animate-pulse" />
                            Radio Mode
                        </span>
                    ) : hasQueue ? `${queueIndex + 1} / ${queue.length}` : "Now Playing"}
                </div>
                <button
                    onClick={() => { setMobileExpanded(false); closePlayer(); }}
                    className="w-10 h-10 flex items-center justify-center text-white/40 active:scale-90"
                    aria-label="Close player"
                >
                    <X size={18} />
                </button>
            </div>

            {/* Animated Vinyl Album Art */}
            <div className="relative z-10 flex-1 flex items-center justify-center px-8 py-2 min-h-0">
                <div className="relative w-full max-w-[260px] max-h-[38vh] aspect-square">
                    {/* Vinyl disc behind the art */}
                    <motion.div
                        animate={isPlaying ? { rotate: 360 } : { rotate: 0 }}
                        transition={isPlaying ? { duration: 12, repeat: Infinity, ease: "linear" } : { duration: 0.8, ease: "easeOut" }}
                        className="absolute inset-[-12%] rounded-full"
                        style={{
                            background: "radial-gradient(circle, #1a1a1a 28%, #111 29%, #222 30%, #111 31%, #222 50%, #111 51%, #1a1a1a 52%, #222 70%, #111 71%, #1a1a1a 100%)",
                            boxShadow: "0 0 60px rgba(0,0,0,0.5), inset 0 0 30px rgba(0,0,0,0.3)",
                        }}
                    >
                        {/* Vinyl center label */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[22%] h-[22%] rounded-full bg-shift5-orange/80 flex items-center justify-center shadow-inner">
                            <div className="w-[30%] h-[30%] rounded-full bg-shift5-dark/60 shadow-inner" />
                        </div>
                        {/* Groove lines */}
                        <div className="absolute inset-[15%] rounded-full border border-white/[0.03]" />
                        <div className="absolute inset-[25%] rounded-full border border-white/[0.03]" />
                        <div className="absolute inset-[35%] rounded-full border border-white/[0.03]" />
                        {/* Light reflection */}
                        <div
                            className="absolute inset-0 rounded-full pointer-events-none"
                            style={{
                                background: "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, transparent 50%, rgba(255,255,255,0.02) 100%)",
                            }}
                        />
                    </motion.div>

                    {/* Album art - spinning on top */}
                    <motion.div
                        animate={isPlaying ? { rotate: 360 } : { rotate: 0 }}
                        transition={isPlaying ? { duration: 12, repeat: Infinity, ease: "linear" } : { duration: 0.8, ease: "easeOut" }}
                        className="relative w-full h-full rounded-full overflow-hidden shadow-2xl"
                        style={{ clipPath: "circle(50%)" }}
                    >
                        {currentTrack.coverUrl ? (
                            <img
                                src={currentTrack.coverUrl}
                                alt={currentTrack.title}
                                className="object-cover w-full h-full rounded-full"
                                style={{ clipPath: "circle(50%)" }}
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-white/5 rounded-full">
                                <Music size={48} className="text-white/10" />
                            </div>
                        )}
                        {/* Vinyl groove overlay on art */}
                        <div className="absolute inset-0 rounded-full pointer-events-none bg-[radial-gradient(circle,transparent_38%,rgba(0,0,0,0.08)_39%,transparent_40%,rgba(0,0,0,0.06)_41%,transparent_42%)] opacity-60" />
                        {/* Center spindle */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-shift5-dark/70 backdrop-blur-sm shadow-lg border-2 border-white/10 flex items-center justify-center">
                            <div className="w-2 h-2 rounded-full bg-white/20" />
                        </div>
                    </motion.div>

                    {/* Loading overlay */}
                    {loadingNext && (
                        <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center" style={{ clipPath: "circle(50%)" }}>
                            <div className="w-8 h-8 border-2 border-shift5-orange/30 border-t-shift5-orange rounded-full animate-spin" />
                        </div>
                    )}

                    {/* Glow ring when playing */}
                    {isPlaying && (
                        <motion.div
                            animate={{ opacity: [0.3, 0.6, 0.3] }}
                            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute inset-[-16%] rounded-full pointer-events-none"
                            style={{ boxShadow: "0 0 40px rgba(255,88,65,0.15), 0 0 80px rgba(255,88,65,0.08)" }}
                        />
                    )}
                </div>
            </div>

            {/* Track info */}
            <div className="relative z-10 px-6 pb-1">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentTrack.title}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.25 }}
                    >
                        <h2 className="text-lg font-bold text-white truncate">{currentTrack.title}</h2>
                        <a
                            href={`/artist/${encodeURIComponent(currentTrack.artist)}`}
                            onClick={() => setMobileExpanded(false)}
                            className="text-[13px] text-white/50 truncate block mt-0.5 active:text-white/70"
                        >
                            {currentTrack.artist}
                        </a>
                    </motion.div>
                </AnimatePresence>
                {error && <p className="text-[11px] text-red-400 mt-1 truncate">{error}</p>}
            </div>

            {/* Seekbar */}
            <div className="relative z-10 px-6 pt-3 pb-0">
                <div
                    ref={seekbarRef}
                    className="w-full h-[5px] bg-white/10 rounded-full cursor-pointer relative"
                    onMouseDown={handleSeekMouseDown}
                    onTouchStart={handleSeekTouch}
                    onTouchMove={handleSeekTouch}
                    style={{ touchAction: "none" }}
                >
                    <div
                        className="h-full bg-shift5-orange rounded-full relative transition-[width] duration-75 ease-linear"
                        style={{ width: `${progress * 100}%` }}
                    >
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-white shadow-md border-2 border-shift5-orange" />
                    </div>
                </div>
                <div className="flex items-center justify-between mt-1">
                    <span className="text-[10px] font-mono text-white/40 tabular-nums">{formatTime(currentTime)}</span>
                    <span className="text-[10px] font-mono text-white/40 tabular-nums">
                        {duration > 60 ? `-${formatTime(timeRemaining)}` : formatTime(duration)}
                    </span>
                </div>
            </div>

            {/* Transport controls */}
            <div className="relative z-10 flex items-center justify-between px-8 py-3">
                <button
                    onClick={() => setShuffleMode(!shuffleMode)}
                    className={`w-10 h-10 flex items-center justify-center rounded-full active:scale-90 transition-colors ${shuffleMode ? 'text-shift5-orange' : 'text-white/30'}`}
                    aria-label="Shuffle"
                >
                    <Shuffle size={18} />
                </button>

                <button
                    onClick={prevTrack}
                    className="w-11 h-11 flex items-center justify-center text-white active:scale-90"
                    aria-label="Previous"
                >
                    <SkipBack size={24} fill="currentColor" />
                </button>

                <motion.button
                    whileTap={{ scale: 0.92 }}
                    onClick={togglePlayPause}
                    className="w-16 h-16 rounded-full bg-shift5-orange text-white flex items-center justify-center shadow-lg shadow-shift5-orange/30"
                    aria-label={isPlaying ? "Pause" : "Play"}
                >
                    <AnimatePresence mode="wait">
                        <motion.span
                            key={isPlaying ? "pause" : "play"}
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.5, opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            className="flex items-center justify-center"
                        >
                            {isPlaying ? <Pause size={26} fill="currentColor" /> : <Play size={26} fill="currentColor" className="ml-0.5" />}
                        </motion.span>
                    </AnimatePresence>
                </motion.button>

                <button
                    onClick={canSkipForward ? () => { hasQueue ? nextTrack() : seek(0.9999); } : undefined}
                    disabled={!canSkipForward}
                    className={`w-11 h-11 flex items-center justify-center active:scale-90 transition-colors ${canSkipForward ? 'text-white' : 'text-white/15'}`}
                    aria-label="Next"
                >
                    <SkipForward size={24} fill="currentColor" />
                </button>

                <button
                    onClick={cycleRepeat}
                    className={`w-10 h-10 flex items-center justify-center rounded-full active:scale-90 transition-colors ${repeatMode !== 'none' ? 'text-shift5-orange' : 'text-white/30'}`}
                    aria-label="Repeat"
                >
                    {repeatMode === "one" ? <Repeat1 size={18} /> : <Repeat size={18} />}
                </button>
            </div>

            {/* Bottom controls: icon-only row */}
            <div className="relative z-10 flex items-center justify-center gap-4 px-6 pb-[max(16px,env(safe-area-inset-bottom))]">
                <button
                    onClick={() => { setQueueOpen(true); setMobileExpanded(false); }}
                    className={`relative w-11 h-11 flex items-center justify-center rounded-full active:scale-90 transition-all ${hasQueue ? 'bg-white/15 text-white' : 'text-white/30'}`}
                    aria-label="Queue"
                >
                    <ListMusic size={18} />
                    {hasQueue && (
                        <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-shift5-orange text-[8px] font-mono font-bold text-white flex items-center justify-center">{queue.length}</span>
                    )}
                </button>
                <button
                    onClick={() => { setHistoryOpen(true); setMobileExpanded(false); }}
                    className="w-11 h-11 flex items-center justify-center rounded-full active:scale-90 transition-colors text-white/30"
                    aria-label="History"
                >
                    <Clock size={18} />
                </button>
                <button
                    onClick={() => setRadioMode(!radioMode)}
                    className={`w-11 h-11 flex items-center justify-center rounded-full active:scale-90 transition-all ${radioMode ? 'bg-white/15 text-white' : 'text-white/30'}`}
                    aria-label="Radio"
                >
                    <Radio size={18} />
                </button>
                <button
                    onClick={handleSurge}
                    disabled={isSurging}
                    className={`w-11 h-11 flex items-center justify-center rounded-full active:scale-90 transition-all ${isSurging ? 'bg-shift5-orange text-white animate-pulse' : 'text-white/30'}`}
                    aria-label="Surge"
                >
                    <Zap size={18} fill={isSurging ? "currentColor" : "none"} />
                </button>
                <button
                    onClick={() => { setPlaylistModalOpen(true); setMobileExpanded(false); }}
                    className="w-11 h-11 flex items-center justify-center rounded-full active:scale-90 transition-colors text-white/30"
                    aria-label="Save to playlist"
                >
                    <Plus size={18} />
                </button>
            </div>
        </motion.div>
    );

    // ─── Mobile Mini Bar (collapsed) ──────────────────────────────
    const renderMobileMiniBar = () => (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.25 }}
            className="fixed bottom-0 left-0 right-0 z-50 sm:hidden pointer-events-auto"
        >
            {/* Progress bar at the very top of the mini bar */}
            <div className="h-[3px] bg-white/5">
                <motion.div
                    className="h-full bg-shift5-orange"
                    style={{ width: `${progress * 100}%` }}
                    transition={{ duration: 0.15, ease: "linear" }}
                />
            </div>

            {/* Swipeable content area — drag left/right to skip */}
            <motion.div
                className="bg-[#1a1a1a]/95 backdrop-blur-xl border-t border-white/5 flex items-center gap-3 px-3 py-2 touch-manipulation relative overflow-hidden"
                style={{ x: miniBarX, opacity: miniBarOpacity }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.4}
                onDrag={(_: unknown, info: { offset: { x: number } }) => {
                    if (info.offset.x < -30) setSwipeHint("next");
                    else if (info.offset.x > 30) setSwipeHint("prev");
                    else setSwipeHint(null);
                }}
                onDragEnd={handleMiniBarDragEnd}
                onTap={() => setMobileExpanded(true)}
            >
                {/* Swipe direction indicators */}
                {swipeHint === "prev" && (
                    <div className="absolute left-2 top-1/2 -translate-y-1/2 text-white/40">
                        <SkipBack size={14} fill="currentColor" />
                    </div>
                )}
                {swipeHint === "next" && (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 text-white/40">
                        <SkipForward size={14} fill="currentColor" />
                    </div>
                )}

                {/* Mini album art — spinning vinyl */}
                <div className="w-11 h-11 rounded-full overflow-hidden bg-white/5 shrink-0 relative" style={{ clipPath: "circle(50%)" }}>
                    <motion.div
                        animate={isPlaying ? { rotate: 360 } : { rotate: 0 }}
                        transition={isPlaying ? { duration: 8, repeat: Infinity, ease: "linear" } : { duration: 0.5 }}
                        className="w-full h-full rounded-full"
                        style={{ clipPath: "circle(50%)" }}
                    >
                        {currentTrack.coverUrl ? (
                            <img src={currentTrack.coverUrl} alt="" className="w-full h-full object-cover rounded-full" style={{ clipPath: "circle(50%)" }} />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center rounded-full"><Music size={16} className="text-white/20" /></div>
                        )}
                        {/* Vinyl groove overlay */}
                        <div className="absolute inset-0 rounded-full pointer-events-none bg-[radial-gradient(circle,transparent_38%,rgba(0,0,0,0.1)_39%,transparent_40%,rgba(0,0,0,0.08)_41%,transparent_42%)] opacity-50" />
                        {/* Center spindle */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-shift5-dark/80 border border-white/10" />
                    </motion.div>
                </div>

                {/* Track info with animated transitions */}
                <div className="flex-1 min-w-0">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentTrack.title}
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            <div className="text-[13px] font-semibold text-white truncate">{currentTrack.title}</div>
                            <div className="text-[11px] text-white/40 truncate">{currentTrack.artist}</div>
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Play/Pause — prevent tap from expanding */}
                <motion.button
                    whileTap={{ scale: 0.85 }}
                    onClick={(e) => { e.stopPropagation(); togglePlayPause(); }}
                    className="w-10 h-10 flex items-center justify-center text-white shrink-0"
                    aria-label={isPlaying ? "Pause" : "Play"}
                >
                    <AnimatePresence mode="wait">
                        <motion.span
                            key={isPlaying ? "pause" : "play"}
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.5, opacity: 0 }}
                            transition={{ duration: 0.12 }}
                            className="flex items-center justify-center"
                        >
                            {isPlaying ? <Pause size={22} fill="currentColor" /> : <Play size={22} fill="currentColor" className="ml-0.5" />}
                        </motion.span>
                    </AnimatePresence>
                </motion.button>

                {/* Skip forward */}
                <motion.button
                    whileTap={{ scale: 0.85 }}
                    onClick={(e) => { e.stopPropagation(); if (canSkipForward) { hasQueue ? nextTrack() : seek(0.9999); } }}
                    className={`w-9 h-9 flex items-center justify-center shrink-0 ${canSkipForward ? 'text-white/60' : 'text-white/15'}`}
                    aria-label="Next"
                >
                    <SkipForward size={18} fill="currentColor" />
                </motion.button>
            </motion.div>
            {/* Safe area spacer */}
            <div className="bg-[#1a1a1a]/95 backdrop-blur-xl h-[env(safe-area-inset-bottom,0px)]" />
        </motion.div>
    );

    // ─── Desktop Player (unchanged) ───────────────────────────────
    const renderDesktopPlayer = () => (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="hidden sm:block fixed bottom-6 right-6 lg:bottom-10 lg:right-10 z-50 pointer-events-auto"
        >
            <div className="bg-white/95 backdrop-blur-xl border border-[#E8E8E8] shadow-[0_16px_64px_rgba(0,0,0,0.15)] rounded-3xl w-[420px] relative group touch-manipulation overflow-hidden">

                {/* Close Button */}
                <button
                    onClick={closePlayer}
                    aria-label="Close player"
                    className="absolute top-2 right-2 p-1.5 opacity-60 hover:opacity-100 transition-opacity z-10"
                >
                    <div className="w-5 h-5 rounded-full bg-black/8 hover:bg-black/15 flex items-center justify-center text-[#1D1D1F] transition-colors">
                        <X size={10} strokeWidth={2.5} />
                    </div>
                </button>

                {/* Top section: Art + Info */}
                <div className="flex items-center gap-3 p-3 pb-0">
                    {/* Album Art - Vinyl */}
                    <div className="relative shrink-0">
                        <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[#E5E5E5] shadow-lg relative bg-[#F0F0F0]" style={{ clipPath: 'circle(50%)', WebkitClipPath: 'circle(50%)' }}>
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
                                    <div className="text-[10px] text-[#C4C4C4] font-medium tracking-tighter">&#9834;</div>
                                )}
                                <div className="absolute inset-0 bg-[radial-gradient(circle,transparent_40%,rgba(0,0,0,0.05)_41%,transparent_42%,rgba(0,0,0,0.05)_43%,transparent_44%)] pointer-events-none opacity-50 rounded-full" />
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
                    <div className="flex-1 min-w-0 pr-6">
                        <div className="flex items-center gap-1.5">
                            <h3 className="text-[15px] font-semibold text-[#1D1D1F] truncate" style={{ letterSpacing: "-0.01em" }}>
                                {currentTrack.title}
                            </h3>
                            {loadingNext && <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse shrink-0" />}
                        </div>
                        <p className="text-xs truncate mt-0.5">
                            <a
                                href={`/artist/${encodeURIComponent(currentTrack.artist)}`}
                                className="text-[#6B7280] hover:text-[#1D1D1F] hover:underline transition-colors"
                            >
                                {currentTrack.artist}
                            </a>
                        </p>
                        {hasQueue && (
                            <p className="text-[10px] font-mono text-[#6B7280] mt-0.5 uppercase tracking-wider">
                                Track {queueIndex + 1} of {queue.length}
                            </p>
                        )}
                        {error && <p className="text-[10px] text-red-500 mt-0.5 truncate">{error}</p>}
                    </div>
                </div>

                {/* Seekbar */}
                <div className="px-3 pt-2.5 pb-1">
                    <div
                        ref={!mobileExpanded ? seekbarRef : undefined}
                        className="w-full h-[6px] bg-[#F0F0F0] rounded-full cursor-pointer group/seek relative"
                        onMouseDown={handleSeekMouseDown}
                        onTouchStart={handleSeekTouch}
                        onTouchMove={handleSeekTouch}
                    >
                        <div
                            className="h-full bg-[#1D1D1F] rounded-full transition-[width] duration-75 ease-linear relative"
                            style={{ width: `${progress * 100}%` }}
                        >
                            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-[#1D1D1F] opacity-0 group-hover/seek:opacity-100 transition-opacity shadow-sm border-2 border-white" />
                        </div>
                    </div>

                    {/* Time display */}
                    <div className="flex items-center justify-between mt-1">
                        <span className="text-[10px] font-mono text-[#4B5563] tabular-nums">
                            {formatTime(currentTime)}
                        </span>
                        <span className="text-[10px] font-mono text-[#4B5563] tabular-nums">
                            {duration > 60 ? `-${formatTime(timeRemaining)}` : formatTime(duration)}
                        </span>
                    </div>
                </div>

                {/* Transport Controls */}
                <div className="flex items-center justify-center gap-4 px-3 pb-1">
                    <button
                        onClick={() => setShuffleMode(!shuffleMode)}
                        className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${shuffleMode ? 'text-shift5-orange' : 'text-[#C4C4C4] hover:text-[#1D1D1F]'}`}
                        aria-label="Shuffle"
                    >
                        <Shuffle size={14} />
                        {shuffleMode && <div className="absolute mt-5 w-1 h-1 rounded-full bg-shift5-orange" />}
                    </button>

                    <button
                        onClick={prevTrack}
                        disabled={!canSkipBack}
                        className={`w-9 h-9 flex items-center justify-center rounded-full transition-colors ${canSkipBack ? 'text-[#6B7280] hover:text-[#1D1D1F] active:scale-95' : 'text-[#E5E5E5] cursor-not-allowed'}`}
                        aria-label="Previous"
                    >
                        <SkipBack size={18} fill="currentColor" />
                    </button>

                    <button
                        onClick={togglePlayPause}
                        aria-label={isPlaying ? "Pause" : "Play"}
                        className="w-12 h-12 rounded-full bg-[#1D1D1F] text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg"
                    >
                        {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-0.5" />}
                    </button>

                    <button
                        onClick={canSkipForward ? () => { hasQueue ? nextTrack() : seek(0.9999); } : undefined}
                        disabled={!canSkipForward}
                        className={`w-9 h-9 flex items-center justify-center rounded-full transition-colors ${canSkipForward ? 'text-[#6B7280] hover:text-[#1D1D1F] active:scale-95' : 'text-[#E5E5E5] cursor-not-allowed'}`}
                        aria-label="Next"
                    >
                        <SkipForward size={18} fill="currentColor" />
                    </button>

                    <button
                        onClick={cycleRepeat}
                        className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors relative ${repeatMode !== 'none' ? 'text-shift5-orange' : 'text-[#C4C4C4] hover:text-[#1D1D1F]'}`}
                        aria-label="Repeat"
                    >
                        {repeatMode === "one" ? <Repeat1 size={14} /> : <Repeat size={14} />}
                        {repeatMode !== "none" && <div className="absolute mt-5 w-1 h-1 rounded-full bg-shift5-orange" />}
                    </button>
                </div>

                {/* Secondary Controls — icon-only row */}
                <div className="flex items-center justify-center gap-1.5 px-3 pb-2.5 pt-0.5">
                    <button
                        onClick={() => setQueueOpen(true)}
                        className={`relative w-8 h-8 flex items-center justify-center rounded-full transition-colors ${hasQueue ? 'bg-[#1D1D1F] text-white' : 'text-[#B0B0B0] hover:text-[#1D1D1F] hover:bg-[#F0F0F0]'}`}
                        aria-label="Queue"
                        title="Queue"
                    >
                        <ListMusic size={14} />
                        {hasQueue && (
                            <span className="absolute -top-1 -right-1 min-w-[14px] h-3.5 px-0.5 rounded-full bg-shift5-orange text-[8px] font-mono font-bold text-white flex items-center justify-center">{queue.length}</span>
                        )}
                    </button>

                    <button
                        onClick={() => setHistoryOpen(true)}
                        className="w-8 h-8 flex items-center justify-center rounded-full transition-colors text-[#B0B0B0] hover:text-[#1D1D1F] hover:bg-[#F0F0F0]"
                        aria-label="History"
                        title="History"
                    >
                        <Clock size={14} />
                    </button>

                    <button
                        onClick={() => setRadioMode(!radioMode)}
                        className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${radioMode ? 'bg-[#1D1D1F] text-white' : 'text-[#B0B0B0] hover:text-[#1D1D1F] hover:bg-[#F0F0F0]'}`}
                        aria-label="Radio"
                        title="Radio"
                    >
                        <Radio size={14} />
                    </button>

                    <button
                        onClick={handleSurge}
                        disabled={isSurging}
                        className={`w-8 h-8 flex items-center justify-center rounded-full transition-all ${isSurging ? 'bg-shift5-orange text-white animate-pulse' : 'text-[#B0B0B0] hover:text-shift5-orange hover:bg-shift5-orange/10'}`}
                        aria-label="Surge"
                        title="Surge"
                    >
                        <Zap size={14} fill={isSurging ? "currentColor" : "none"} />
                    </button>

                    <button
                        onClick={() => setPlaylistModalOpen(true)}
                        className="w-8 h-8 flex items-center justify-center rounded-full transition-colors text-[#B0B0B0] hover:text-[#1D1D1F] hover:bg-[#F0F0F0]"
                        aria-label="Save to playlist"
                        title="Save to playlist"
                    >
                        <Plus size={14} />
                    </button>
                </div>
            </div>
        </motion.div>
    );

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
                        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-12 h-12 rounded-full bg-[#1D1D1F] text-white shadow-lg flex items-center justify-center hover:scale-110 active:scale-95 transition-transform border border-white/10"
                        title="Show Player"
                    >
                        <Music size={18} />
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

            {/* Mobile: expanded full-screen player */}
            <AnimatePresence>
                {mobileExpanded && renderMobileExpanded()}
            </AnimatePresence>

            {/* Mobile: mini bar (when not expanded and not hidden) */}
            <AnimatePresence>
                {!isHidden && !mobileExpanded && renderMobileMiniBar()}
            </AnimatePresence>

            {/* Desktop player */}
            <AnimatePresence>
                {!isHidden && renderDesktopPlayer()}
            </AnimatePresence>

            {/* Queue Panel */}
            <QueuePanel isOpen={queueOpen} onClose={() => setQueueOpen(false)} />

            {/* History Panel */}
            <HistoryPanel isOpen={historyOpen} onClose={() => setHistoryOpen(false)} />

            {/* Playlist Modal */}
            <PlaylistModal isOpen={playlistModalOpen} onClose={() => setPlaylistModalOpen(false)} />
        </>
    );
}
