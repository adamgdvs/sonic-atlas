"use client";

import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { useAudio, type HistoryEntry } from "@/contexts/AudioContext";
import { X, Clock, Trash2 } from "lucide-react";
import Image from "next/image";

function formatTimeAgo(timestamp: number): string {
    const diff = Date.now() - timestamp;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}

function HistoryRow({
    entry,
    onPlay,
    onAddToQueue,
}: {
    entry: HistoryEntry;
    onPlay: () => void;
    onAddToQueue: () => void;
}) {
    return (
        <div className="flex items-center gap-3 p-3 border-b border-white/5 hover:bg-white/[0.03] active:bg-white/[0.06] transition-colors touch-manipulation group">
            {/* Album art */}
            <button onClick={onPlay} className="w-10 h-10 shrink-0 bg-white/5 border border-white/10 overflow-hidden relative group/art touch-manipulation">
                {entry.track.coverUrl ? (
                    <Image src={entry.track.coverUrl} alt="" width={40} height={40} className="object-cover w-full h-full grayscale group-hover/art:grayscale-0 transition-all duration-300" unoptimized />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/10 text-[10px] font-mono">♪</div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/art:opacity-100 flex items-center justify-center transition-opacity">
                    <span className="text-white text-xs">▶</span>
                </div>
            </button>

            {/* Track info */}
            <button onClick={onPlay} className="flex-1 min-w-0 text-left touch-manipulation">
                <div className="text-[11px] font-mono uppercase tracking-tight truncate text-white/80 group-hover:text-white transition-colors">
                    {entry.track.title}
                </div>
                <div className="text-[9px] font-mono text-white/30 uppercase tracking-wider truncate">
                    {entry.track.artist}
                </div>
            </button>

            {/* Time ago */}
            <div className="flex items-center gap-2 shrink-0">
                <span className="text-[8px] font-mono text-white/15 uppercase tracking-wider">
                    {formatTimeAgo(entry.playedAt)}
                </span>
                <button
                    onClick={onAddToQueue}
                    className="text-[8px] font-mono text-white/20 hover:text-shift5-orange uppercase tracking-wider transition-colors touch-manipulation active:scale-95 hidden sm:block"
                    title="Add to queue"
                >
                    +Q
                </button>
            </div>
        </div>
    );
}

export default function HistoryPanel({
    isOpen,
    onClose,
}: {
    isOpen: boolean;
    onClose: () => void;
}) {
    const { history, clearHistory, playTrack, addToQueue } = useAudio();

    // Group by time: "Just Now", "Earlier Today", "Yesterday", etc.
    const groupedHistory = (() => {
        const now = Date.now();
        const groups: { label: string; entries: HistoryEntry[] }[] = [];
        const recent: HistoryEntry[] = [];
        const earlier: HistoryEntry[] = [];
        const yesterday: HistoryEntry[] = [];
        const older: HistoryEntry[] = [];

        for (const entry of history) {
            const diff = now - entry.playedAt;
            const hours = diff / (1000 * 60 * 60);
            if (hours < 1) recent.push(entry);
            else if (hours < 12) earlier.push(entry);
            else if (hours < 36) yesterday.push(entry);
            else older.push(entry);
        }

        if (recent.length > 0) groups.push({ label: "Recent", entries: recent });
        if (earlier.length > 0) groups.push({ label: "Earlier", entries: earlier });
        if (yesterday.length > 0) groups.push({ label: "Yesterday", entries: yesterday });
        if (older.length > 0) groups.push({ label: "Older", entries: older });

        return groups;
    })();

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

                    {/* Panel */}
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
                                <Clock size={14} className="text-shift5-orange" />
                                <h3 className="text-[10px] font-mono text-white/50 uppercase tracking-[0.2em]">
                                    History // {history.length.toString().padStart(2, "0")} played
                                </h3>
                            </div>
                            <div className="flex items-center gap-2">
                                {history.length > 0 && (
                                    <button
                                        onClick={clearHistory}
                                        className="text-[9px] font-mono text-white/30 hover:text-red-400 uppercase tracking-widest transition-colors touch-manipulation active:scale-95 flex items-center gap-1"
                                    >
                                        <Trash2 size={10} />
                                        Clear
                                    </button>
                                )}
                                <button onClick={onClose} className="text-white/30 hover:text-white transition-colors p-1 touch-manipulation active:scale-90">
                                    <X size={16} />
                                </button>
                            </div>
                        </div>

                        {/* History content */}
                        <div className="flex-1 overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: "touch" }}>
                            {history.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 px-6">
                                    <Clock size={28} className="text-white/10 mb-3" />
                                    <div className="text-[10px] font-mono text-white/20 uppercase tracking-widest text-center">
                                        No listening history
                                    </div>
                                    <div className="text-[9px] font-mono text-white/10 uppercase tracking-wider mt-1 text-center">
                                        Tracks you play will appear here
                                    </div>
                                </div>
                            ) : (
                                groupedHistory.map((group) => (
                                    <div key={group.label}>
                                        <div className="px-4 py-2 border-b border-white/5 bg-white/[0.01] sticky top-0 z-10 backdrop-blur-sm">
                                            <span className="text-[8px] font-mono text-white/25 uppercase tracking-[0.2em]">
                                                {group.label}
                                            </span>
                                        </div>
                                        {group.entries.map((entry, i) => (
                                            <HistoryRow
                                                key={`${entry.track.videoId || entry.track.url}-${entry.playedAt}-${i}`}
                                                entry={entry}
                                                onPlay={() => playTrack(entry.track)}
                                                onAddToQueue={() => addToQueue(entry.track)}
                                            />
                                        ))}
                                    </div>
                                ))
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
