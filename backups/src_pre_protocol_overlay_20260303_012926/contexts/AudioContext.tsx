"use client";

import React, { createContext, useContext, useState, useRef, useEffect } from "react";

export interface TrackParams {
    url: string;
    title: string;
    artist: string;
    coverUrl?: string | null;
    id?: string;
}

interface AudioContextType {
    currentTrack: TrackParams | null;
    isPlaying: boolean;
    progress: number;
    currentTime: number;
    duration: number;
    playTrack: (track: TrackParams) => void;
    togglePlayPause: () => void;
    seek: (progressRatio: number) => void;
    closePlayer: () => void;
    radioMode: boolean;
    setRadioMode: (active: boolean) => void;
    trackEndedRaw: number; // A counter that increments when a track finishes naturally to trigger effects
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export function AudioProvider({ children }: { children: React.ReactNode }) {
    const [currentTrack, setCurrentTrack] = useState<TrackParams | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(30); // Default preview length
    const [radioMode, setRadioMode] = useState(false);
    const [trackEndedRaw, setTrackEndedRaw] = useState(0);

    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        // Create the global audio element once
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

        const handleEnded = () => {
            setIsPlaying(false);
            setProgress(0);
            setCurrentTime(0);
            setTrackEndedRaw(prev => prev + 1);
        };

        audio.addEventListener("timeupdate", handleTimeUpdate);
        audio.addEventListener("loadedmetadata", handleLoadedMetadata);
        audio.addEventListener("ended", handleEnded);

        return () => {
            audio.removeEventListener("timeupdate", handleTimeUpdate);
            audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
            audio.removeEventListener("ended", handleEnded);
            audio.pause();
            audio.src = "";
        };
    }, []);

    const playTrack = (track: TrackParams) => {
        if (!audioRef.current) return;

        // If playing the same track, just toggle pause/play
        if (currentTrack?.url === track.url) {
            if (isPlaying) {
                audioRef.current.pause();
                setIsPlaying(false);
            } else {
                audioRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
            }
            return;
        }

        // New track
        setCurrentTrack(track);
        setIsPlaying(true);
        setProgress(0);
        setCurrentTime(0);

        audioRef.current.src = track.url;
        audioRef.current.play().catch((err) => {
            console.error("Audio playback failed:", err);
            setIsPlaying(false);
        });
    };

    const togglePlayPause = () => {
        if (!audioRef.current || !currentTrack) return;
        if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
        } else {
            audioRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
        }
    };

    const seek = (ratio: number) => {
        if (!audioRef.current) return;
        const time = ratio * duration;
        audioRef.current.currentTime = time;
        setCurrentTime(time);
        setProgress(ratio);
    };

    const closePlayer = () => {
        if (audioRef.current) {
            audioRef.current.pause();
        }
        setIsPlaying(false);
        setCurrentTrack(null);
    };

    return (
        <AudioContext.Provider value={{
            currentTrack,
            isPlaying,
            progress,
            currentTime,
            duration,
            playTrack,
            togglePlayPause,
            seek,
            closePlayer,
            radioMode,
            setRadioMode,
            trackEndedRaw
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
