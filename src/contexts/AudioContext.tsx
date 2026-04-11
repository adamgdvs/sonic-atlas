"use client";

import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from "react";

export interface TrackParams {
    url: string;
    title: string;
    artist: string;
    coverUrl?: string | null;
    genres?: string[];
    id?: string;
    videoId?: string; // YouTube Music videoId for full song playback
}

export type RepeatMode = "none" | "all" | "one";

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
    // Queue state
    queue: TrackParams[];
    queueIndex: number;
    hasQueue: boolean;
    // Shuffle & Repeat
    shuffleMode: boolean;
    setShuffleMode: (active: boolean) => void;
    repeatMode: RepeatMode;
    setRepeatMode: (mode: RepeatMode) => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

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

    const audioRef = useRef<HTMLAudioElement | null>(null);

    const hasQueue = queue.length > 1;

    // Internal play function that actually starts audio
    const startPlayback = useCallback((track: TrackParams) => {
        if (!audioRef.current) return;
        setCurrentTrack(track);
        setProgress(0);
        setCurrentTime(0);
        setWasManuallyStopped(false);
        setIsPlaying(true);
        setHasEverPlayed(true);

        const audioSrc = track.videoId
            ? `/api/stream/${track.videoId}`
            : track.url;

        audioRef.current.src = audioSrc;
        audioRef.current.load();
        audioRef.current.play().catch(() => {
            setIsPlaying(false);
        });
    }, []);

    // Handle track ended — auto-advance queue or repeat
    const handleTrackEnded = useCallback(() => {
        setIsPlaying(false);
        setProgress(0);
        setCurrentTime(0);

        if (repeatMode === "one") {
            // Replay same track
            if (audioRef.current) {
                audioRef.current.currentTime = 0;
                audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
            }
            return;
        }

        if (queue.length > 1) {
            // Queue mode: advance to next track
            let nextIdx: number;
            if (shuffleMode) {
                // Pick a random track that isn't the current one
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

        // No queue or end of queue — signal for radio mode
        setTrackEndedRaw(prev => prev + 1);
    }, [queue, queueIndex, shuffleMode, repeatMode, startPlayback]);

    useEffect(() => {
        const audio = new Audio();
        audioRef.current = audio;

        const handleTimeUpdate = () => {
            if (!audioRef.current) return;
            setCurrentTime(audioRef.current.currentTime);
            setProgress(audioRef.current.currentTime / (audioRef.current.duration || 30));
        };

        const handleLoadedMetadata = () => {
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

    // Attach/detach ended handler (needs latest closure)
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;
        audio.addEventListener("ended", handleTrackEnded);
        return () => audio.removeEventListener("ended", handleTrackEnded);
    }, [handleTrackEnded]);

    const playTrack = useCallback((track: TrackParams) => {
        if (!audioRef.current) return;

        // If same track, toggle pause/play
        const isSameTrack = track.videoId
            ? currentTrack?.videoId === track.videoId
            : currentTrack?.url === track.url;
        if (isSameTrack) {
            if (isPlaying) {
                audioRef.current.pause();
                setIsPlaying(false);
                setWasManuallyStopped(true);
            } else {
                audioRef.current.play().then(() => {
                    setIsPlaying(true);
                    setWasManuallyStopped(false);
                }).catch(() => setIsPlaying(false));
            }
            return;
        }

        // Clear queue when playing a single track directly
        setQueue([]);
        setQueueIndex(-1);

        startPlayback(track);
    }, [currentTrack, isPlaying, startPlayback]);

    const playQueue = useCallback((tracks: TrackParams[], startIndex: number) => {
        if (tracks.length === 0) return;
        const idx = Math.max(0, Math.min(startIndex, tracks.length - 1));

        // Check if clicking same track that's already playing
        const target = tracks[idx];
        const isSameTrack = target.videoId
            ? currentTrack?.videoId === target.videoId
            : currentTrack?.url === target.url;
        if (isSameTrack && audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
                setIsPlaying(false);
                setWasManuallyStopped(true);
            } else {
                audioRef.current.play().then(() => {
                    setIsPlaying(true);
                    setWasManuallyStopped(false);
                }).catch(() => setIsPlaying(false));
            }
            return;
        }

        setQueue(tracks);
        setQueueIndex(idx);
        startPlayback(tracks[idx]);
    }, [currentTrack, isPlaying, startPlayback]);

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
        if (audioRef.current && audioRef.current.currentTime > 3) {
            audioRef.current.currentTime = 0;
            setCurrentTime(0);
            setProgress(0);
            return;
        }

        if (queue.length <= 1) {
            // No queue, just restart
            if (audioRef.current) {
                audioRef.current.currentTime = 0;
                setCurrentTime(0);
                setProgress(0);
            }
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
        if (!audioRef.current || !currentTrack) return;
        if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
            setWasManuallyStopped(true);
        } else {
            audioRef.current.play().then(() => {
                setIsPlaying(true);
                setWasManuallyStopped(false);
            }).catch(() => setIsPlaying(false));
        }
    }, [currentTrack, isPlaying]);

    const seek = useCallback((ratio: number) => {
        if (!audioRef.current) return;
        const time = ratio * duration;
        audioRef.current.currentTime = time;
        setCurrentTime(time);
        setProgress(ratio);
    }, [duration]);

    const closePlayer = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.pause();
        }
        setIsPlaying(false);
        setCurrentTrack(null);
        setQueue([]);
        setQueueIndex(-1);
        setWasManuallyStopped(false);
    }, []);

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
