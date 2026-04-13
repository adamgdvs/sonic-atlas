"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { useAudio, type TrackParams } from "@/contexts/AudioContext";
import { useSession, signIn } from "next-auth/react";
import { X, Plus, ListMusic, Check, ExternalLink } from "lucide-react";

interface PlaylistSummary {
    id: string;
    name: string;
    description: string | null;
    _count: { tracks: number };
}

export default function PlaylistModal({
    isOpen,
    onClose,
    trackToSave,
}: {
    isOpen: boolean;
    onClose: () => void;
    trackToSave?: TrackParams | null;
}) {
    const { data: session } = useSession();
    const { currentTrack } = useAudio();
    const [playlists, setPlaylists] = useState<PlaylistSummary[]>([]);
    const [loading, setLoading] = useState(false);
    const [creating, setCreating] = useState(false);
    const [newName, setNewName] = useState("");
    const [savedTo, setSavedTo] = useState<string | null>(null);
    const [saving, setSaving] = useState<string | null>(null);

    const track = trackToSave || currentTrack;

    useEffect(() => {
        if (isOpen && session?.user) {
            setLoading(true);
            setSavedTo(null);
            fetch("/api/playlists")
                .then(res => res.json())
                .then(data => {
                    if (Array.isArray(data)) setPlaylists(data);
                })
                .finally(() => setLoading(false));
        }
    }, [isOpen, session]);

    const handleCreatePlaylist = async () => {
        if (!newName.trim()) return;
        setCreating(true);
        const res = await fetch("/api/playlists", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: newName.trim() }),
        });
        if (res.ok) {
            const pl = await res.json();
            setPlaylists(prev => [{ ...pl, _count: { tracks: 0 } }, ...prev]);
            setNewName("");
            // Auto-save current track to new playlist
            if (track) {
                await saveToPlaylist(pl.id);
            }
        }
        setCreating(false);
    };

    const saveToPlaylist = async (playlistId: string) => {
        if (!track) return;
        setSaving(playlistId);
        const res = await fetch(`/api/playlists/${playlistId}/tracks`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                title: track.title,
                artist: track.artist,
                url: track.url,
                videoId: track.videoId,
                coverUrl: track.coverUrl,
                genres: track.genres,
            }),
        });
        if (res.ok) {
            setSavedTo(playlistId);
            setPlaylists(prev => prev.map(p =>
                p.id === playlistId ? { ...p, _count: { tracks: p._count.tracks + 1 } } : p
            ));
        }
        setSaving(null);
    };

    const generateSpotifySearchUrl = () => {
        if (!track) return "";
        return `https://open.spotify.com/search/${encodeURIComponent(`${track.title} ${track.artist}`)}`;
    };

    const generateAppleMusicSearchUrl = () => {
        if (!track) return "";
        return `https://music.apple.com/search?term=${encodeURIComponent(`${track.title} ${track.artist}`)}`;
    };

    if (!session?.user && isOpen) {
        return (
            <AnimatePresence>
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-6"
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        onClick={e => e.stopPropagation()}
                        className="bg-shift5-dark border border-white/10 p-6 max-w-sm w-full text-center"
                    >
                        <ListMusic size={24} className="text-shift5-orange mx-auto mb-3" />
                        <p className="text-[12px] font-mono text-white/60 uppercase tracking-wider mb-4">Sign in to create playlists</p>
                        <button
                            onClick={() => signIn(undefined, { callbackUrl: window.location.pathname })}
                            className="px-6 py-2.5 bg-shift5-orange text-white font-mono text-[11px] font-bold uppercase tracking-widest active:scale-95 touch-manipulation"
                        >
                            Sign In
                        </button>
                    </motion.div>
                </motion.div>
            </AnimatePresence>
        );
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70]"
                    />

                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 30, stiffness: 300 }}
                        drag="y"
                        dragConstraints={{ top: 0, bottom: 0 }}
                        dragElastic={{ top: 0, bottom: 0.3 }}
                        onDragEnd={(_: unknown, info: PanInfo) => {
                            if (info.offset.y > 120 || info.velocity.y > 400) onClose();
                        }}
                        className="fixed bottom-0 left-0 right-0 sm:left-auto sm:right-4 sm:bottom-4 sm:w-[380px] z-[71] bg-shift5-dark border-t sm:border border-white/10 flex flex-col max-h-[75vh] sm:max-h-[500px] touch-manipulation sm:rounded-lg"
                    >
                        {/* Drag handle */}
                        <div className="sm:hidden flex justify-center py-2">
                            <div className="w-10 h-1 rounded-full bg-white/15" />
                        </div>

                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 shrink-0">
                            <div className="flex items-center gap-2">
                                <ListMusic size={14} className="text-shift5-orange" />
                                <h3 className="text-[10px] font-mono text-white/50 uppercase tracking-[0.2em]">
                                    Save to Playlist
                                </h3>
                            </div>
                            <button onClick={onClose} className="text-white/30 hover:text-white p-1 active:scale-90 touch-manipulation">
                                <X size={16} />
                            </button>
                        </div>

                        {/* Current track info */}
                        {track && (
                            <div className="px-4 py-2.5 border-b border-white/5 bg-white/[0.02]">
                                <div className="text-[11px] font-mono text-white/80 uppercase tracking-tight truncate">{track.title}</div>
                                <div className="text-[9px] font-mono text-white/30 uppercase tracking-wider truncate">{track.artist}</div>
                            </div>
                        )}

                        {/* Create new playlist */}
                        <div className="px-4 py-3 border-b border-white/5">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newName}
                                    onChange={e => setNewName(e.target.value)}
                                    onKeyDown={e => e.key === "Enter" && handleCreatePlaylist()}
                                    placeholder="New playlist name..."
                                    className="flex-1 bg-white/5 border border-white/10 px-3 py-2 text-[11px] font-mono text-white placeholder-white/20 uppercase tracking-wider focus:border-shift5-orange/50 focus:outline-none transition-colors"
                                />
                                <button
                                    onClick={handleCreatePlaylist}
                                    disabled={!newName.trim() || creating}
                                    className="px-3 py-2 bg-shift5-orange/80 text-white text-[10px] font-mono font-bold uppercase tracking-wider disabled:opacity-30 active:scale-95 touch-manipulation hover:bg-shift5-orange transition-colors"
                                >
                                    <Plus size={14} />
                                </button>
                            </div>
                        </div>

                        {/* Playlist list */}
                        <div className="flex-1 overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: "touch" }}>
                            {loading ? (
                                <div className="p-8 text-center text-[10px] font-mono text-white/20 uppercase animate-pulse">Loading...</div>
                            ) : playlists.length === 0 ? (
                                <div className="p-8 text-center text-[10px] font-mono text-white/20 uppercase tracking-widest">
                                    No playlists yet — create one above
                                </div>
                            ) : (
                                playlists.map(pl => (
                                    <button
                                        key={pl.id}
                                        onClick={() => saveToPlaylist(pl.id)}
                                        disabled={saving === pl.id || savedTo === pl.id}
                                        className={`w-full flex items-center gap-3 px-4 py-3 border-b border-white/5 text-left transition-colors touch-manipulation active:bg-white/[0.06] ${savedTo === pl.id ? "bg-shift5-orange/10" : "hover:bg-white/[0.03]"}`}
                                    >
                                        <div className="w-10 h-10 bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                                            {savedTo === pl.id ? (
                                                <Check size={16} className="text-shift5-orange" />
                                            ) : (
                                                <ListMusic size={14} className="text-white/20" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-[11px] font-mono text-white/80 uppercase tracking-tight truncate">{pl.name}</div>
                                            <div className="text-[9px] font-mono text-white/25 uppercase tracking-wider">
                                                {pl._count.tracks} track{pl._count.tracks !== 1 ? "s" : ""}
                                            </div>
                                        </div>
                                        {saving === pl.id && (
                                            <div className="w-4 h-4 border-2 border-shift5-orange/30 border-t-shift5-orange rounded-full animate-spin shrink-0" />
                                        )}
                                        {savedTo === pl.id && (
                                            <span className="text-[8px] font-mono text-shift5-orange uppercase tracking-widest shrink-0">Saved</span>
                                        )}
                                    </button>
                                ))
                            )}
                        </div>

                        {/* Export links */}
                        {track && (
                            <div className="px-4 py-2.5 border-t border-white/5 bg-white/[0.01] flex items-center gap-2">
                                <span className="text-[8px] font-mono text-white/20 uppercase tracking-widest">Find on:</span>
                                <a
                                    href={generateSpotifySearchUrl()}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 text-[9px] font-mono text-[#1DB954] hover:text-[#1ed760] uppercase tracking-wider transition-colors"
                                >
                                    Spotify <ExternalLink size={9} />
                                </a>
                                <a
                                    href={generateAppleMusicSearchUrl()}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 text-[9px] font-mono text-[#FA57C1] hover:text-[#fc6ccf] uppercase tracking-wider transition-colors"
                                >
                                    Apple Music <ExternalLink size={9} />
                                </a>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
