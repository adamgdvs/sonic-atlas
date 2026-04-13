"use client";

import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from "react";

export interface TrackParams {
    url: string;
    title: string;
    artist: string;
    coverUrl?: string | null;
    genres?: string[];
    id?: string;
    videoId?: string;
}

export type RepeatMode = "none" | "all" | "one";

export interface HistoryEntry {
    track: TrackParams;
    playedAt: number; // timestamp
}

interface AudioContextType {
    currentTrack: TrackParams | null;
    isPlaying: boolean;
    progress: number;
    currentTime: number;
    duration: number;
    playTrack: (track: TrackParams) => void;
    playQueue: (tracks: TrackParams[], startIndex: number) => void;
    togglePlayPause: () => void;
    seek: (progressRatio: number) => void;
    closePlayer: () => void;
    nextTrack: () => void;
    prevTrack: () => void;
    radioMode: boolean;
    setRadioMode: (active: boolean) => void;
    trackEndedRaw: number;
    wasManuallyStopped: boolean;
    hasEverPlayed: boolean;
    queue: TrackParams[];
    queueIndex: number;
    hasQueue: boolean;
    shuffleMode: boolean;
    setShuffleMode: (active: boolean) => void;
    repeatMode: RepeatMode;
    setRepeatMode: (mode: RepeatMode) => void;
    // Queue management
    addToQueue: (track: TrackParams) => void;
    removeFromQueue: (index: number) => void;
    reorderQueue: (fromIndex: number, toIndex: number) => void;
    clearQueue: () => void;
    playQueueIndex: (index: number) => void;
    // Listening history
    history: HistoryEntry[];
    clearHistory: () => void;
}

// YouTube IFrame Player API types
interface YTPlayer {
    playVideo(): void;
    pauseVideo(): void;
    seekTo(seconds: number, allowSeekAhead: boolean): void;
    getCurrentTime(): number;
    getDuration(): number;
    getPlayerState(): number;
    loadVideoById(videoId: string): void;
    destroy(): void;
    setVolume(volume: number): void;
    getVolume(): number;
}

interface YTPlayerEvent {
    data: number;
    target: YTPlayer;
}

declare global {
    interface Window {
        YT?: {
            Player: new (
                elementId: string,
                config: {
                    height: string;
                    width: string;
                    videoId?: string;
                    playerVars?: Record<string, unknown>;
                    events?: {
                        onReady?: (event: { target: YTPlayer }) => void;
                        onStateChange?: (event: YTPlayerEvent) => void;
                        onError?: (event: YTPlayerEvent) => void;
                    };
                }
            ) => YTPlayer;
            PlayerState: {
                ENDED: number;
                PLAYING: number;
                PAUSED: number;
                BUFFERING: number;
                CUED: number;
            };
        };
        onYouTubeIframeAPIReady?: () => void;
    }
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

// Track whether YT API script has been loaded
let ytApiLoaded = false;
let ytApiReady = false;
const ytReadyCallbacks: (() => void)[] = [];

function loadYTApi(): Promise<void> {
    return new Promise((resolve) => {
        if (ytApiReady && window.YT) {
            resolve();
            return;
        }

        ytReadyCallbacks.push(resolve);

        if (!ytApiLoaded) {
            ytApiLoaded = true;
            const tag = document.createElement("script");
            tag.src = "https://www.youtube.com/iframe_api";
            document.head.appendChild(tag);

            window.onYouTubeIframeAPIReady = () => {
                ytApiReady = true;
                ytReadyCallbacks.forEach((cb) => cb());
                ytReadyCallbacks.length = 0;
            };
        }
    });
}

export function AudioProvider({ children }: { children: React.ReactNode }) {
    const [currentTrack, setCurrentTrack] = useState<TrackParams | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(30);
    const [radioMode, setRadioMode] = useState(false);
    const [trackEndedRaw, setTrackEndedRaw] = useState(0);
    const [wasManuallyStopped, setWasManuallyStopped] = useState(false);
    const [hasEverPlayed, setHasEverPlayed] = useState(false);

    // Queue
    const [queue, setQueue] = useState<TrackParams[]>([]);
    const [queueIndex, setQueueIndex] = useState(-1);

    // Shuffle & Repeat
    const [shuffleMode, setShuffleMode] = useState(false);
    const [repeatMode, setRepeatMode] = useState<RepeatMode>("none");

    // Listening history (persisted in localStorage)
    const [history, setHistory] = useState<HistoryEntry[]>(() => {
        if (typeof window === "undefined") return [];
        try {
            const stored = localStorage.getItem("sonic_history");
            return stored ? JSON.parse(stored) : [];
        } catch { return []; }
    });

    // Audio element for Deezer previews
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // YouTube IFrame player for full songs
    const ytPlayerRef = useRef<YTPlayer | null>(null);
    const ytContainerRef = useRef<HTMLDivElement | null>(null);
    const ytTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Which playback engine is active: "audio" (Deezer preview) or "yt" (YouTube)
    const activeEngineRef = useRef<"audio" | "yt">("audio");

    // Refs for callbacks that need latest state
    const handleTrackEndedRef = useRef<() => void>(() => {});

    const hasQueue = queue.length > 1;

    // Stop whichever engine is currently active
    const stopCurrentEngine = useCallback(() => {
        if (activeEngineRef.current === "audio" && audioRef.current) {
            audioRef.current.pause();
            audioRef.current.src = "";
        }
        if (activeEngineRef.current === "yt" && ytPlayerRef.current) {
            try {
                ytPlayerRef.current.pauseVideo();
            } catch { /* player might not be ready */ }
        }
        if (ytTimerRef.current) {
            clearInterval(ytTimerRef.current);
            ytTimerRef.current = null;
        }
    }, []);

    // Start YT time tracking interval
    const startYTTimeTracking = useCallback(() => {
        if (ytTimerRef.current) clearInterval(ytTimerRef.current);
        ytTimerRef.current = setInterval(() => {
            if (!ytPlayerRef.current) return;
            try {
                const ct = ytPlayerRef.current.getCurrentTime();
                const dur = ytPlayerRef.current.getDuration();
                if (dur > 0) {
                    setCurrentTime(ct);
                    setDuration(dur);
                    setProgress(ct / dur);
                }
            } catch { /* player might be destroyed */ }
        }, 250);
    }, []);

    // Add track to history when it starts playing
    const addToHistory = useCallback((track: TrackParams) => {
        setHistory(prev => {
            const entry: HistoryEntry = { track, playedAt: Date.now() };
            // Dedupe: remove if same track was last played
            const filtered = prev.length > 0 && (prev[0].track.videoId === track.videoId && track.videoId || prev[0].track.url === track.url)
                ? prev.slice(1)
                : prev;
            return [entry, ...filtered].slice(0, 100);
        });
    }, []);

    const clearHistory = useCallback(() => {
        setHistory([]);
        try { localStorage.removeItem("sonic_history"); } catch {}
    }, []);

    // Internal play function
    const startPlayback = useCallback((track: TrackParams) => {
        stopCurrentEngine();
        setCurrentTrack(track);
        setProgress(0);
        setCurrentTime(0);
        setWasManuallyStopped(false);
        setHasEverPlayed(true);
        addToHistory(track);

        if (track.videoId) {
            // Use YouTube IFrame Player for full songs
            activeEngineRef.current = "yt";
            setIsPlaying(false); // Will be set true when YT starts playing

            loadYTApi().then(() => {
                if (!window.YT) return;

                // If player exists, just load new video
                if (ytPlayerRef.current) {
                    try {
                        ytPlayerRef.current.loadVideoById(track.videoId!);
                        startYTTimeTracking();
                        return;
                    } catch {
                        // Player might be in bad state, recreate
                    }
                }

                // Create container if needed
                if (!ytContainerRef.current) {
                    const div = document.createElement("div");
                    div.id = "yt-player-container";
                    div.style.position = "fixed";
                    div.style.top = "-9999px";
                    div.style.left = "-9999px";
                    div.style.width = "1px";
                    div.style.height = "1px";
                    div.style.opacity = "0";
                    div.style.pointerEvents = "none";
                    document.body.appendChild(div);
                    ytContainerRef.current = div;

                    // Create inner div for player
                    const playerDiv = document.createElement("div");
                    playerDiv.id = "yt-player";
                    div.appendChild(playerDiv);
                }

                ytPlayerRef.current = new window.YT.Player("yt-player", {
                    height: "1",
                    width: "1",
                    videoId: track.videoId,
                    playerVars: {
                        autoplay: 1,
                        controls: 0,
                        disablekb: 1,
                        fs: 0,
                        modestbranding: 1,
                        playsinline: 1,
                        rel: 0,
                    },
                    events: {
                        onReady: (event) => {
                            event.target.playVideo();
                            startYTTimeTracking();
                        },
                        onStateChange: (event) => {
                            const state = event.data;
                            if (state === window.YT!.PlayerState.PLAYING) {
                                setIsPlaying(true);
                            } else if (state === window.YT!.PlayerState.PAUSED) {
                                setIsPlaying(false);
                            } else if (state === window.YT!.PlayerState.ENDED) {
                                setIsPlaying(false);
                                if (ytTimerRef.current) {
                                    clearInterval(ytTimerRef.current);
                                    ytTimerRef.current = null;
                                }
                                handleTrackEndedRef.current();
                            }
                        },
                        onError: () => {
                            // YouTube embed failed — fall back to preview
                            console.log("[Audio] YouTube embed failed, falling back to preview");
                            activeEngineRef.current = "audio";
                            if (audioRef.current && track.url) {
                                audioRef.current.src = track.url;
                                audioRef.current.load();
                                audioRef.current.play().then(() => {
                                    setIsPlaying(true);
                                }).catch(() => {
                                    setIsPlaying(false);
                                });
                            }
                        },
                    },
                });
            });
        } else {
            // Use HTML audio for Deezer previews
            activeEngineRef.current = "audio";
            if (!audioRef.current) return;
            setIsPlaying(true);
            audioRef.current.src = track.url;
            audioRef.current.load();
            audioRef.current.play().catch(() => {
                setIsPlaying(false);
            });
        }
    }, [stopCurrentEngine, startYTTimeTracking, addToHistory]);

    // Handle track ended — auto-advance queue or repeat
    const handleTrackEnded = useCallback(() => {
        setIsPlaying(false);
        setProgress(0);
        setCurrentTime(0);

        if (repeatMode === "one") {
            if (activeEngineRef.current === "yt" && ytPlayerRef.current) {
                ytPlayerRef.current.seekTo(0, true);
                ytPlayerRef.current.playVideo();
                setIsPlaying(true);
                startYTTimeTracking();
            } else if (audioRef.current) {
                audioRef.current.currentTime = 0;
                audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
            }
            return;
        }

        if (queue.length > 1) {
            let nextIdx: number;
            if (shuffleMode) {
                const candidates = queue.map((_, i) => i).filter(i => i !== queueIndex);
                nextIdx = candidates[Math.floor(Math.random() * candidates.length)];
            } else {
                nextIdx = queueIndex + 1;
            }

            if (nextIdx < queue.length) {
                setQueueIndex(nextIdx);
                startPlayback(queue[nextIdx]);
                return;
            } else if (repeatMode === "all") {
                const firstIdx = shuffleMode ? Math.floor(Math.random() * queue.length) : 0;
                setQueueIndex(firstIdx);
                startPlayback(queue[firstIdx]);
                return;
            }
        }

        setTrackEndedRaw(prev => prev + 1);
    }, [queue, queueIndex, shuffleMode, repeatMode, startPlayback, startYTTimeTracking]);

    // Keep the ref up to date for YT callback
    useEffect(() => {
        handleTrackEndedRef.current = handleTrackEnded;
    }, [handleTrackEnded]);

    // Persist history to localStorage
    useEffect(() => {
        try {
            localStorage.setItem("sonic_history", JSON.stringify(history.slice(0, 100)));
        } catch { /* storage full or unavailable */ }
    }, [history]);

    // Set up HTML audio element for previews
    useEffect(() => {
        const audio = new Audio();
        audioRef.current = audio;

        const handleTimeUpdate = () => {
            if (activeEngineRef.current !== "audio") return;
            if (!audioRef.current) return;
            setCurrentTime(audioRef.current.currentTime);
            setProgress(audioRef.current.currentTime / (audioRef.current.duration || 30));
        };

        const handleLoadedMetadata = () => {
            if (activeEngineRef.current !== "audio") return;
            if (audioRef.current && audioRef.current.duration && isFinite(audioRef.current.duration)) {
                setDuration(audioRef.current.duration);
            }
        };

        audio.addEventListener("timeupdate", handleTimeUpdate);
        audio.addEventListener("loadedmetadata", handleLoadedMetadata);

        return () => {
            audio.removeEventListener("timeupdate", handleTimeUpdate);
            audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
            audio.pause();
            audio.src = "";
        };
    }, []);

    // Attach/detach ended handler for HTML audio
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;
        const onEnded = () => {
            if (activeEngineRef.current === "audio") {
                handleTrackEnded();
            }
        };
        audio.addEventListener("ended", onEnded);
        return () => audio.removeEventListener("ended", onEnded);
    }, [handleTrackEnded]);

    const playTrack = useCallback((track: TrackParams) => {
        const isSameTrack = track.videoId
            ? currentTrack?.videoId === track.videoId
            : currentTrack?.url === track.url;

        if (isSameTrack) {
            if (isPlaying) {
                if (activeEngineRef.current === "yt" && ytPlayerRef.current) {
                    ytPlayerRef.current.pauseVideo();
                } else if (audioRef.current) {
                    audioRef.current.pause();
                }
                setIsPlaying(false);
                setWasManuallyStopped(true);
            } else {
                if (activeEngineRef.current === "yt" && ytPlayerRef.current) {
                    ytPlayerRef.current.playVideo();
                    setIsPlaying(true);
                    setWasManuallyStopped(false);
                    startYTTimeTracking();
                } else if (audioRef.current) {
                    audioRef.current.play().then(() => {
                        setIsPlaying(true);
                        setWasManuallyStopped(false);
                    }).catch(() => setIsPlaying(false));
                }
            }
            return;
        }

        setQueue([]);
        setQueueIndex(-1);
        startPlayback(track);
    }, [currentTrack, isPlaying, startPlayback, startYTTimeTracking]);

    const playQueue = useCallback((tracks: TrackParams[], startIndex: number) => {
        if (tracks.length === 0) return;
        const idx = Math.max(0, Math.min(startIndex, tracks.length - 1));

        const target = tracks[idx];
        const isSameTrack = target.videoId
            ? currentTrack?.videoId === target.videoId
            : currentTrack?.url === target.url;

        if (isSameTrack) {
            if (isPlaying) {
                if (activeEngineRef.current === "yt" && ytPlayerRef.current) {
                    ytPlayerRef.current.pauseVideo();
                } else if (audioRef.current) {
                    audioRef.current.pause();
                }
                setIsPlaying(false);
                setWasManuallyStopped(true);
            } else {
                if (activeEngineRef.current === "yt" && ytPlayerRef.current) {
                    ytPlayerRef.current.playVideo();
                    setIsPlaying(true);
                    setWasManuallyStopped(false);
                    startYTTimeTracking();
                } else if (audioRef.current) {
                    audioRef.current.play().then(() => {
                        setIsPlaying(true);
                        setWasManuallyStopped(false);
                    }).catch(() => setIsPlaying(false));
                }
            }
            return;
        }

        setQueue(tracks);
        setQueueIndex(idx);
        startPlayback(tracks[idx]);
    }, [currentTrack, isPlaying, startPlayback, startYTTimeTracking]);

    const nextTrack = useCallback(() => {
        if (queue.length <= 1) return;

        let nextIdx: number;
        if (shuffleMode) {
            const candidates = queue.map((_, i) => i).filter(i => i !== queueIndex);
            nextIdx = candidates[Math.floor(Math.random() * candidates.length)];
        } else {
            nextIdx = queueIndex + 1;
            if (nextIdx >= queue.length) {
                nextIdx = repeatMode === "all" ? 0 : queueIndex;
                if (nextIdx === queueIndex && repeatMode !== "all") return;
            }
        }

        setQueueIndex(nextIdx);
        startPlayback(queue[nextIdx]);
    }, [queue, queueIndex, shuffleMode, repeatMode, startPlayback]);

    const prevTrack = useCallback(() => {
        // If > 3 seconds in, restart current track
        const ct = activeEngineRef.current === "yt" && ytPlayerRef.current
            ? ytPlayerRef.current.getCurrentTime()
            : audioRef.current?.currentTime || 0;

        if (ct > 3) {
            if (activeEngineRef.current === "yt" && ytPlayerRef.current) {
                ytPlayerRef.current.seekTo(0, true);
            } else if (audioRef.current) {
                audioRef.current.currentTime = 0;
            }
            setCurrentTime(0);
            setProgress(0);
            return;
        }

        if (queue.length <= 1) {
            if (activeEngineRef.current === "yt" && ytPlayerRef.current) {
                ytPlayerRef.current.seekTo(0, true);
            } else if (audioRef.current) {
                audioRef.current.currentTime = 0;
            }
            setCurrentTime(0);
            setProgress(0);
            return;
        }

        let prevIdx = queueIndex - 1;
        if (prevIdx < 0) {
            prevIdx = repeatMode === "all" ? queue.length - 1 : 0;
        }

        setQueueIndex(prevIdx);
        startPlayback(queue[prevIdx]);
    }, [queue, queueIndex, repeatMode, startPlayback]);

    const togglePlayPause = useCallback(() => {
        if (!currentTrack) return;

        if (isPlaying) {
            if (activeEngineRef.current === "yt" && ytPlayerRef.current) {
                ytPlayerRef.current.pauseVideo();
            } else if (audioRef.current) {
                audioRef.current.pause();
            }
            setIsPlaying(false);
            setWasManuallyStopped(true);
        } else {
            if (activeEngineRef.current === "yt" && ytPlayerRef.current) {
                ytPlayerRef.current.playVideo();
                setIsPlaying(true);
                setWasManuallyStopped(false);
                startYTTimeTracking();
            } else if (audioRef.current) {
                audioRef.current.play().then(() => {
                    setIsPlaying(true);
                    setWasManuallyStopped(false);
                }).catch(() => setIsPlaying(false));
            }
        }
    }, [currentTrack, isPlaying, startYTTimeTracking]);

    const seek = useCallback((ratio: number) => {
        const time = ratio * duration;
        if (activeEngineRef.current === "yt" && ytPlayerRef.current) {
            ytPlayerRef.current.seekTo(time, true);
        } else if (audioRef.current) {
            audioRef.current.currentTime = time;
        }
        setCurrentTime(time);
        setProgress(ratio);
    }, [duration]);

    // Queue management
    const addToQueue = useCallback((track: TrackParams) => {
        setQueue(prev => {
            if (prev.length === 0) {
                // If nothing in queue, start playing immediately
                setQueueIndex(0);
                startPlayback(track);
                return [track];
            }
            return [...prev, track];
        });
    }, [startPlayback]);

    const removeFromQueue = useCallback((index: number) => {
        setQueue(prev => {
            if (index < 0 || index >= prev.length) return prev;
            const next = [...prev];
            next.splice(index, 1);

            // Adjust queueIndex
            if (index === queueIndex) {
                // Removing currently playing — play next or stop
                if (next.length === 0) {
                    stopCurrentEngine();
                    setIsPlaying(false);
                    setCurrentTrack(null);
                    setQueueIndex(-1);
                } else {
                    const newIdx = Math.min(index, next.length - 1);
                    setQueueIndex(newIdx);
                    startPlayback(next[newIdx]);
                }
            } else if (index < queueIndex) {
                setQueueIndex(qi => qi - 1);
            }
            return next;
        });
    }, [queueIndex, stopCurrentEngine, startPlayback]);

    const reorderQueue = useCallback((fromIndex: number, toIndex: number) => {
        setQueue(prev => {
            if (fromIndex === toIndex) return prev;
            const next = [...prev];
            const [moved] = next.splice(fromIndex, 1);
            next.splice(toIndex, 0, moved);

            // Adjust queueIndex to follow the currently playing track
            let newIdx = queueIndex;
            if (queueIndex === fromIndex) {
                newIdx = toIndex;
            } else {
                if (fromIndex < queueIndex && toIndex >= queueIndex) newIdx--;
                else if (fromIndex > queueIndex && toIndex <= queueIndex) newIdx++;
            }
            setQueueIndex(newIdx);
            return next;
        });
    }, [queueIndex]);

    const clearQueue = useCallback(() => {
        if (currentTrack) {
            // Keep only the currently playing track
            setQueue([currentTrack]);
            setQueueIndex(0);
        } else {
            setQueue([]);
            setQueueIndex(-1);
        }
    }, [currentTrack]);

    const playQueueIndex = useCallback((index: number) => {
        if (index < 0 || index >= queue.length) return;
        setQueueIndex(index);
        startPlayback(queue[index]);
    }, [queue, startPlayback]);

    const closePlayer = useCallback(() => {
        stopCurrentEngine();
        setIsPlaying(false);
        setCurrentTrack(null);
        setQueue([]);
        setQueueIndex(-1);
        setWasManuallyStopped(false);
    }, [stopCurrentEngine]);

    return (
        <AudioContext.Provider value={{
            currentTrack,
            isPlaying,
            progress,
            currentTime,
            duration,
            playTrack,
            playQueue,
            togglePlayPause,
            seek,
            closePlayer,
            nextTrack,
            prevTrack,
            radioMode,
            setRadioMode,
            trackEndedRaw,
            wasManuallyStopped,
            hasEverPlayed,
            queue,
            queueIndex,
            hasQueue,
            shuffleMode,
            setShuffleMode,
            repeatMode,
            setRepeatMode,
            addToQueue,
            removeFromQueue,
            reorderQueue,
            clearQueue,
            playQueueIndex,
            history,
            clearHistory,
        }}>
            {children}
        </AudioContext.Provider>
    );
}

export function useAudio() {
    const context = useContext(AudioContext);
    if (context === undefined) {
        throw new Error("useAudio must be used within an AudioProvider");
    }
    return context;
}
