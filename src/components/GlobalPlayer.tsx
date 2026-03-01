"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useAudio } from "@/contexts/AudioContext";
import { getSimilarArtists, getArtistPreviewData } from "@/lib/api";
import { Play, Pause, X, Radio } from "lucide-react";

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
    } = useAudio();

    const [loadingNext, setLoadingNext] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Radio Mode Engine
    useEffect(() => {
        if (!radioMode || trackEndedRaw === 0 || !currentTrack) return;

        let cancelled = false;
        const fetchNextTrack = async () => {
            setLoadingNext(true);
            setError(null);

            try {
                // 1. Get Similar Artists using the current artist
                const similar = await getSimilarArtists(currentTrack.artist, 10);
                if (cancelled) return;

                if (similar.length === 0) {
                    setError("No similar artists found.");
                    setLoadingNext(false);
                    return;
                }

                // Try iterating through top similar artists until we find one with a preview track
                let nextTrack = null;
                let nextArtistName = "";

                for (const artist of similar) {
                    const previewData = await getArtistPreviewData(artist.name);
                    if (cancelled) return;

                    const playableTrack = previewData.tracks.find((t) => t.preview);
                    if (playableTrack) {
                        nextTrack = playableTrack;
                        nextArtistName = artist.name;
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
                    // We could fetch artist image here, but for speed we'll let it fallback to default styling
                    coverUrl: null,
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

    // Don't render until a track exists
    if (!currentTrack) return null;

    return (
        <div
            className="fixed bottom-6 right-6 lg:bottom-10 lg:right-10 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300 pointer-events-auto"
            style={{ animationTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)" }}
        >
            <div className="bg-white/90 backdrop-blur-xl border border-[#F0F0F0] shadow-[0_12px_48px_rgba(0,0,0,0.12)] rounded-3xl p-3 flex items-center gap-4 w-[340px] relative overflow-hidden group">

                {/* Progress Bar Background */}
                <div className="absolute top-0 left-0 w-full h-[3px] bg-[#F8F8FA]">
                    <div
                        className="h-full bg-[#1D1D1F] transition-all duration-150 ease-linear"
                        style={{ width: `${progress * 100}%` }}
                    />
                </div>

                {/* Art */}
                <div className={`w-14 h-14 rounded-full overflow-hidden shrink-0 bg-[#F0F0F0] border border-[#E5E5E5] flex items-center justify-center ${isPlaying ? 'animate-[spin_8s_linear_infinite]' : ''}`}>
                    {currentTrack.coverUrl ? (
                        <Image
                            src={currentTrack.coverUrl}
                            alt={currentTrack.title}
                            width={56}
                            height={56}
                            className="object-cover w-full h-full"
                            unoptimized
                        />
                    ) : (
                        <div className="text-[10px] text-[#C4C4C4] font-medium tracking-tighter">♪</div>
                    )}
                </div>

                {/* Track Info */}
                <div className="flex-1 min-w-0 pr-2">
                    <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-[#1D1D1F] truncate" style={{ letterSpacing: "-0.01em" }}>
                            {currentTrack.title}
                        </h3>
                        {loadingNext && <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />}
                    </div>
                    <p className="text-xs text-[#9CA3AF] truncate mt-0.5">
                        {currentTrack.artist}
                    </p>
                    {error && <p className="text-[10px] text-red-500 mt-1 truncate">{error}</p>}
                </div>

                {/* Controls */}
                <div className="flex items-center gap-3 shrink-0">
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
        </div>
    );
}
