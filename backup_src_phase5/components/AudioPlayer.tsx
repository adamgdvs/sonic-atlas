"use client";

import { useAudio } from "@/contexts/AudioContext";
import { Play, Pause, X, Volume2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getInitials } from "@/lib/utils";

export default function AudioPlayer() {
    const {
        currentTrack,
        isPlaying,
        progress,
        togglePlayPause,
        closePlayer,
        seek
    } = useAudio();

    if (!currentTrack) return null;

    const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const ratio = Math.max(0, Math.min(1, x / rect.width));
        seek(ratio);
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-[500px] z-50 flex flex-col rounded-xl overflow-hidden bg-white/80 backdrop-blur-xl border border-black/10 shadow-2xl"
                style={{ boxShadow: "0 20px 40px -10px rgba(0,0,0,0.15)" }}
            >
                {/* Progress Bar Top */}
                <div
                    className="w-full h-1 bg-gray-200 cursor-pointer relative group"
                    onClick={handleProgressBarClick}
                >
                    <div
                        className="h-full bg-black transition-all ease-linear group-hover:bg-blue-600"
                        style={{ width: `${progress * 100}%` }}
                    />
                </div>

                {/* Player Controls */}
                <div className="flex items-center gap-4 px-4 py-3">
                    {/* Cover or Initials */}
                    <div className="w-12 h-12 flex-shrink-0 bg-gray-100 rounded-md overflow-hidden flex items-center justify-center text-xs font-bold text-gray-500 border border-gray-200 shadow-sm relative group">
                        {currentTrack.coverUrl ? (
                            <img src={currentTrack.coverUrl} className="w-full h-full object-cover" alt="cover" />
                        ) : (
                            <span className="opacity-50">{getInitials(currentTrack.artist)}</span>
                        )}

                        {/* Play overlay button on image */}
                        <button
                            onClick={(e) => { e.stopPropagation(); togglePlayPause(); }}
                            className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            {isPlaying ? <Pause size={20} className="text-white fill-white" /> : <Play size={20} className="text-white fill-white ml-0.5" />}
                        </button>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <h4 className="text-[14px] font-semibold text-gray-900 truncate leading-tight">
                            {currentTrack.title}
                        </h4>
                        <div className="flex items-center gap-2">
                            <p className="text-[12px] text-gray-500 truncate leading-tight mt-0.5">
                                {currentTrack.artist}
                            </p>
                            {isPlaying && (
                                <div className="flex gap-0.5 items-end h-2 mt-1 opacity-70">
                                    <motion.div animate={{ height: ["4px", "8px", "4px"] }} transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }} className="w-0.5 bg-blue-600 rounded-full" />
                                    <motion.div animate={{ height: ["3px", "10px", "3px"] }} transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut", delay: 0.2 }} className="w-0.5 bg-blue-600 rounded-full" />
                                    <motion.div animate={{ height: ["6px", "4px", "6px"] }} transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut", delay: 0.4 }} className="w-0.5 bg-blue-600 rounded-full" />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={togglePlayPause}
                            className="w-10 h-10 flex items-center justify-center rounded-full bg-black text-white hover:scale-105 active:scale-95 transition-transform"
                        >
                            {isPlaying ? <Pause size={18} className="fill-white" /> : <Play size={18} className="fill-white ml-1" />}
                        </button>

                        <button
                            onClick={closePlayer}
                            className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
