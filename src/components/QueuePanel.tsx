"use client";

import { useState } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { useAudio, type TrackParams } from "@/contexts/AudioContext";
import { X, Trash2, ListMusic, ArrowUp, ArrowDown } from "lucide-react";
import Image from "next/image";

function QueueTrackRow({
    track,
    index,
    isActive,
    onPlay,
    onRemove,
    onMoveUp,
    onMoveDown,
    canMoveUp,
    canMoveDown,
}: {
    track: TrackParams;
    index: number;
    isActive: boolean;
    onPlay: () => void;
    onRemove: () => void;
    onMoveUp?: () => void;
    onMoveDown?: () => void;
    canMoveUp?: boolean;
    canMoveDown?: boolean;
}) {
    const [swiped, setSwiped] = useState(false);

    return (
        <motion.div
            layout
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, height: 0, overflow: "hidden" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative"
        >
            {/* Swipe-to-remove reveal */}
            {swiped && (
                <div className="absolute inset-y-0 right-0 w-20 bg-red-500/20 flex items-center justify-center z-0">
                    <button onClick={() => { setSwiped(false); onRemove(); }} className="text-red-400 p-2 touch-manipulation active:scale-90">
                        <Trash2 size={16} />
                    </button>
                </div>
            )}

            <motion.div
                drag="x"
                dragConstraints={{ left: -80, right: 0 }}
                dragElastic={{ left: 0.1, right: 0 }}
                onDragEnd={(_: unknown, info: PanInfo) => {
                    if (info.offset.x < -50) {
                        setSwiped(true);
                    } else {
                        setSwiped(false);
                    }
                }}
                animate={{ x: swiped ? -80 : 0 }}
                className={`relative flex items-center gap-3 p-3 border-b border-white/5 touch-manipulation z-10 ${isActive ? "bg-shift5-orange/10" : "bg-shift5-dark hover:bg-white/[0.03]"}`}
            >
                {/* Reorder buttons — show on non-active tracks */}
                {!isActive && (
                    <div className="flex flex-col gap-0.5 shrink-0">
                        <button
                            onClick={onMoveUp}
                            disabled={!canMoveUp}
                            className={`p-0.5 transition-colors touch-manipulation ${canMoveUp ? "text-white/25 hover:text-white/60 active:scale-90" : "text-white/5"}`}
                        >
                            <ArrowUp size={10} />
                        </button>
                        <button
                            onClick={onMoveDown}
                            disabled={!canMoveDown}
                            className={`p-0.5 transition-colors touch-manipulation ${canMoveDown ? "text-white/25 hover:text-white/60 active:scale-90" : "text-white/5"}`}
                        >
                            <ArrowDown size={10} />
                        </button>
                    </div>
                )}

                {/* Track number / active indicator */}
                <span className={`text-[10px] font-mono w-5 text-center shrink-0 ${isActive ? "text-shift5-orange font-bold animate-pulse" : "text-white/20"}`}>
                    {isActive ? "▶" : (index + 1).toString().padStart(2, "0")}
                </span>

                {/* Album art */}
                <div className="w-9 h-9 shrink-0 bg-white/5 border border-white/10 overflow-hidden">
                    {track.coverUrl ? (
                        <Image src={track.coverUrl} alt="" width={36} height={36} className="object-cover w-full h-full" unoptimized />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-white/10 text-[8px] font-mono">&#9834;</div>
                    )}
                </div>

                {/* Track info */}
                <button onClick={onPlay} className="flex-1 min-w-0 text-left touch-manipulation">
                    <div className={`text-[11px] font-mono uppercase tracking-tight truncate ${isActive ? "text-shift5-orange font-bold" : "text-white/80"}`}>
                        {track.title}
                    </div>
                    <div className="text-[9px] font-mono text-white/30 uppercase tracking-wider truncate">
                        {track.artist}
                    </div>
                </button>

                {/* Remove button (desktop) */}
                <button
                    onClick={onRemove}
                    className="hidden sm:flex items-center justify-center text-white/15 hover:text-red-400 transition-colors p-1 shrink-0"
                >
                    <X size={14} />
                </button>
            </motion.div>
        </motion.div>
    );
}

export default function QueuePanel({
    isOpen,
    onClose,
}: {
    isOpen: boolean;
    onClose: () => void;
}) {
    const {
        queue,
        queueIndex,
        playQueueIndex,
        removeFromQueue,
        reorderQueue,
        clearQueue,
        currentTrack,
        hasQueue,
    } = useAudio();

    // Separate current track and upcoming
    const upcomingStartIndex = queueIndex + 1;
    const upcomingTracks = queue.slice(upcomingStartIndex);
    const previousTracks = queue.slice(0, queueIndex);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
                    />

                    {/* Panel — bottom sheet on mobile, side panel on desktop */}
                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 30, stiffness: 300 }}
                        drag="y"
                        dragConstraints={{ top: 0, bottom: 0 }}
                        dragElastic={{ top: 0, bottom: 0.3 }}
                        onDragEnd={(_: unknown, info: PanInfo) => {
                            if (info.offset.y > 120 || info.velocity.y > 400) {
                                onClose();
                            }
                        }}
                        className="fixed bottom-0 left-0 right-0 sm:left-auto sm:right-0 sm:top-0 sm:w-[400px] z-[61] bg-shift5-dark border-t sm:border-t-0 sm:border-l border-white/10 flex flex-col max-h-[85vh] sm:max-h-full touch-manipulation"
                    >
                        {/* Drag handle — mobile */}
                        <div className="sm:hidden flex justify-center py-2">
                            <div className="w-10 h-1 rounded-full bg-white/15" />
                        </div>

                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 shrink-0">
                            <div className="flex items-center gap-2">
                                <ListMusic size={14} className="text-shift5-orange" />
                                <h3 className="text-[10px] font-mono text-white/50 uppercase tracking-[0.2em]">
                                    Queue // {queue.length.toString().padStart(2, "0")} tracks
                                </h3>
                            </div>
                            <div className="flex items-center gap-2">
                                {queue.length > 1 && (
                                    <button
                                        onClick={clearQueue}
                                        className="text-[9px] font-mono text-white/30 hover:text-red-400 uppercase tracking-widest transition-colors touch-manipulation active:scale-95"
                                    >
                                        Clear
                                    </button>
                                )}
                                <button onClick={onClose} className="text-white/30 hover:text-white transition-colors p-1 touch-manipulation active:scale-90">
                                    <X size={16} />
                                </button>
                            </div>
                        </div>

                        {/* Queue content */}
                        <div className="flex-1 overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: "touch" }}>
                            {queue.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 px-6">
                                    <div className="text-white/10 text-3xl mb-3">&#9834;</div>
                                    <div className="text-[10px] font-mono text-white/20 uppercase tracking-widest text-center">
                                        Queue is empty
                                    </div>
                                    <div className="text-[9px] font-mono text-white/10 uppercase tracking-wider mt-1 text-center">
                                        Play an album or use add-to-queue to build your queue
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {/* Now Playing */}
                                    {currentTrack && queueIndex >= 0 && queueIndex < queue.length && (
                                        <div className="border-b border-white/5">
                                            <div className="px-4 py-2">
                                                <span className="text-[8px] font-mono text-shift5-orange/60 uppercase tracking-[0.2em]">Now Playing</span>
                                            </div>
                                            <QueueTrackRow
                                                track={queue[queueIndex]}
                                                index={queueIndex}
                                                isActive={true}
                                                onPlay={() => {}}
                                                onRemove={() => removeFromQueue(queueIndex)}
                                            />
                                        </div>
                                    )}

                                    {/* Up Next */}
                                    {upcomingTracks.length > 0 && (
                                        <div>
                                            <div className="px-4 py-2 border-b border-white/5 bg-white/[0.01]">
                                                <span className="text-[8px] font-mono text-white/30 uppercase tracking-[0.2em]">
                                                    Up Next // {upcomingTracks.length.toString().padStart(2, "0")}
                                                </span>
                                            </div>
                                            <AnimatePresence mode="popLayout">
                                                {upcomingTracks.map((track, i) => {
                                                    const realIndex = upcomingStartIndex + i;
                                                    return (
                                                        <QueueTrackRow
                                                            key={`${track.videoId || track.url}-${realIndex}`}
                                                            track={track}
                                                            index={realIndex}
                                                            isActive={false}
                                                            onPlay={() => playQueueIndex(realIndex)}
                                                            onRemove={() => removeFromQueue(realIndex)}
                                                            onMoveUp={() => reorderQueue(realIndex, realIndex - 1)}
                                                            onMoveDown={() => reorderQueue(realIndex, realIndex + 1)}
                                                            canMoveUp={i > 0}
                                                            canMoveDown={i < upcomingTracks.length - 1}
                                                        />
                                                    );
                                                })}
                                            </AnimatePresence>
                                        </div>
                                    )}

                                    {/* Previously Played */}
                                    {previousTracks.length > 0 && (
                                        <div className="opacity-50">
                                            <div className="px-4 py-2 border-b border-white/5 bg-white/[0.01]">
                                                <span className="text-[8px] font-mono text-white/20 uppercase tracking-[0.2em]">
                                                    Played
                                                </span>
                                            </div>
                                            {previousTracks.map((track, i) => (
                                                <QueueTrackRow
                                                    key={`prev-${track.videoId || track.url}-${i}`}
                                                    track={track}
                                                    index={i}
                                                    isActive={false}
                                                    onPlay={() => playQueueIndex(i)}
                                                    onRemove={() => removeFromQueue(i)}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Mobile: tip text */}
                        <div className="sm:hidden px-4 py-2 border-t border-white/5 bg-white/[0.01]">
                            <p className="text-[8px] font-mono text-white/15 uppercase tracking-widest text-center">
                                Swipe left to remove // Tap to play
                            </p>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
