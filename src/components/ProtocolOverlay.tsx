"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sliders, Compass, Fingerprint, Zap, Heart, ExternalLink, Shuffle } from "lucide-react";
import { useJourney } from "@/contexts/JourneyContext";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface ProtocolOverlayProps {
    isOpen: boolean;
    onClose: () => void;
}

interface BookmarkData {
    id: string;
    name: string;
    imageUrl: string | null;
    genres: string;
}

export default function ProtocolOverlay({ isOpen, onClose }: ProtocolOverlayProps) {
    const [activeTab, setActiveTab] = useState<"DISCOVERY" | "ACCESS" | "TASTE">("DISCOVERY");
    const { history } = useJourney();
    const { data: session } = useSession();
    const router = useRouter();

    // ─── Discovery Controls (wired to real functionality) ────────
    const [nicheDepth, setNicheDepth] = useState(() => {
        if (typeof window !== "undefined") {
            return parseInt(localStorage.getItem("sonic_nicheDepth") || "60");
        }
        return 60;
    });
    const [resultCount, setResultCount] = useState<15 | 30 | 50>(() => {
        if (typeof window !== "undefined") {
            const stored = localStorage.getItem("sonic_resultCount");
            return (stored ? parseInt(stored) : 30) as 15 | 30 | 50;
        }
        return 30;
    });

    // Persist controls
    useEffect(() => {
        if (typeof window !== "undefined") {
            localStorage.setItem("sonic_nicheDepth", nicheDepth.toString());
            localStorage.setItem("sonic_resultCount", resultCount.toString());
        }
    }, [nicheDepth, resultCount]);

    // ─── Bookmarks (Quick Access) ────────────────────────────────
    const [bookmarks, setBookmarks] = useState<BookmarkData[]>([]);
    const [bookmarksLoading, setBookmarksLoading] = useState(false);

    useEffect(() => {
        if (isOpen && activeTab === "ACCESS" && session?.user) {
            setBookmarksLoading(true);
            fetch("/api/bookmarks")
                .then(r => r.json())
                .then((data) => {
                    if (Array.isArray(data)) setBookmarks(data.slice(0, 8));
                })
                .catch(() => { })
                .finally(() => setBookmarksLoading(false));
        }
    }, [isOpen, activeTab, session]);

    // ─── Taste Profile ───────────────────────────────────────────
    const genreFingerprint = useCallback(() => {
        const genreCounts = new Map<string, number>();

        // From browsing history
        history.forEach(node => {
            if (node.type === "genre") {
                const g = node.name.toLowerCase();
                genreCounts.set(g, (genreCounts.get(g) || 0) + 2);
            }
        });

        // From bookmarks
        bookmarks.forEach(b => {
            try {
                const genres: string[] = JSON.parse(b.genres || "[]");
                genres.slice(0, 3).forEach(g => {
                    const gl = g.toLowerCase();
                    genreCounts.set(gl, (genreCounts.get(gl) || 0) + 1);
                });
            } catch { }
        });

        const sorted = [...genreCounts.entries()]
            .sort((a, b) => b[1] - a[1])
            .slice(0, 6);

        const total = sorted.reduce((sum, [, c]) => sum + c, 0);
        return sorted.map(([genre, count]) => ({
            genre,
            percentage: total > 0 ? Math.round((count / total) * 100) : 0,
        }));
    }, [history, bookmarks]);

    const uniqueArtists = new Set(history.filter(h => h.type === "artist").map(h => h.name)).size;
    const uniqueGenres = new Set(history.filter(h => h.type === "genre").map(h => h.name)).size;

    // ─── Surprise Me ─────────────────────────────────────────────
    const handleSurprise = () => {
        const fingerprint = genreFingerprint();
        if (fingerprint.length > 0) {
            const randomGenre = fingerprint[Math.floor(Math.random() * Math.min(3, fingerprint.length))];
            router.push(`/genre/${encodeURIComponent(randomGenre.genre)}`);
            onClose();
        }
    };

    // ─── Navigate ────────────────────────────────────────────────
    const handleNavigate = (url: string) => {
        router.push(url);
        onClose();
    };

    // Close on Escape
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleEsc);
        return () => window.removeEventListener("keydown", handleEsc);
    }, [onClose]);

    const tabs = [
        { id: "DISCOVERY" as const, label: "Discovery", icon: Sliders },
        { id: "ACCESS" as const, label: "Quick Access", icon: Compass },
        { id: "TASTE" as const, label: "Taste Profile", icon: Fingerprint },
    ];

    const RESULT_OPTIONS: (15 | 30 | 50)[] = [15, 30, 50];

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] pointer-events-none">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -20, x: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -20, x: 20 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="absolute top-24 right-6 w-full max-w-[340px] bg-[#dcdcdc] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] overflow-hidden border border-black/5 pointer-events-auto rounded-2xl"
                    >
                        {/* Header / Close */}
                        <div className="p-5 pb-0 flex justify-end">
                            <button
                                onClick={onClose}
                                className="flex items-center gap-2 text-shift5-dark/60 hover:text-shift5-dark transition-colors group"
                            >
                                <X size={12} className="group-hover:rotate-90 transition-transform duration-300" />
                                <span className="text-[8px] font-mono font-bold tracking-[0.2em] uppercase">Close</span>
                            </button>
                        </div>

                        {/* Navigation */}
                        <div className="px-8 py-4">
                            <nav className="space-y-2">
                                {tabs.map((tab, idx) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`block w-full text-left group transition-all duration-300 ${activeTab === tab.id
                                            ? "text-shift5-dark translate-x-1"
                                            : "text-shift5-dark/30 hover:text-shift5-dark/50"
                                            }`}
                                    >
                                        <div className="flex items-start gap-0.5">
                                            <span className="text-3xl sm:text-4xl font-medium font-sans uppercase tracking-tight leading-[0.95]">
                                                {tab.label}
                                            </span>
                                            <span className="text-[9px] font-mono font-bold mt-0 text-shift5-orange">
                                                {idx + 1}
                                            </span>
                                        </div>
                                    </button>
                                ))}
                            </nav>
                        </div>

                        {/* Tab Content */}
                        <div className="px-8 py-6 border-t border-black/5 bg-black/[0.03] min-h-[180px] flex flex-col justify-center">
                            <AnimatePresence mode="wait">

                                {/* ═══ DISCOVERY ═══ */}
                                {activeTab === "DISCOVERY" && (
                                    <motion.div
                                        key="discovery"
                                        initial={{ opacity: 0, x: 5 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -5 }}
                                        className="space-y-5"
                                    >
                                        {/* Niche Depth Slider */}
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-end">
                                                <span className="text-[9px] font-mono font-bold text-shift5-dark/40 uppercase tracking-widest">Niche_Depth</span>
                                                <span className="text-lg font-black text-shift5-dark">{nicheDepth}%</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="10"
                                                max="100"
                                                value={nicheDepth}
                                                onChange={(e) => setNicheDepth(parseInt(e.target.value))}
                                                className="w-full accent-shift5-orange bg-black/10 h-1 appearance-none cursor-pointer"
                                            />
                                            <div className="flex justify-between text-[7px] font-mono text-shift5-dark/25 uppercase tracking-wider">
                                                <span>Broad</span>
                                                <span>Deep Niche</span>
                                            </div>
                                        </div>

                                        {/* Result Count */}
                                        <div className="flex items-center justify-between">
                                            <span className="text-[9px] font-mono font-bold text-shift5-dark/40 uppercase tracking-widest">Results</span>
                                            <div className="flex gap-1">
                                                {RESULT_OPTIONS.map(n => (
                                                    <button
                                                        key={n}
                                                        onClick={() => setResultCount(n)}
                                                        className={`text-[9px] font-mono font-bold uppercase tracking-widest px-2.5 py-1 border-2 transition-colors ${resultCount === n
                                                            ? "bg-shift5-dark border-shift5-dark text-white"
                                                            : "border-shift5-dark/10 text-shift5-dark/40 hover:border-shift5-dark/30"
                                                            }`}
                                                    >
                                                        {n}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {/* ═══ QUICK ACCESS ═══ */}
                                {activeTab === "ACCESS" && (
                                    <motion.div
                                        key="access"
                                        initial={{ opacity: 0, x: 5 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -5 }}
                                        className="space-y-4"
                                    >
                                        {/* Recently Viewed */}
                                        {history.filter(h => h.type === "artist").length > 0 && (
                                            <div className="space-y-2">
                                                <span className="text-[9px] font-mono font-bold text-shift5-dark/40 uppercase tracking-widest">Recent_Nodes</span>
                                                <div className="space-y-1">
                                                    {[...new Map(
                                                        history
                                                            .filter(h => h.type === "artist")
                                                            .reverse()
                                                            .map(h => [h.name, h])
                                                    ).values()]
                                                        .slice(0, 5)
                                                        .map((node) => (
                                                            <button
                                                                key={node.url}
                                                                onClick={() => handleNavigate(node.url)}
                                                                className="w-full flex items-center justify-between py-1.5 px-2 text-left hover:bg-black/5 transition-colors group rounded"
                                                            >
                                                                <span className="text-[11px] font-mono font-bold text-shift5-dark/70 group-hover:text-shift5-dark truncate">{node.name}</span>
                                                                <ExternalLink size={10} className="text-shift5-dark/20 group-hover:text-shift5-orange shrink-0 ml-2" />
                                                            </button>
                                                        ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Bookmarks */}
                                        {session?.user ? (
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[9px] font-mono font-bold text-shift5-dark/40 uppercase tracking-widest">Saved_Nodes</span>
                                                    {bookmarks.length > 0 && (
                                                        <span className="text-[9px] font-mono font-bold text-shift5-dark/25">{bookmarks.length}</span>
                                                    )}
                                                </div>
                                                {bookmarksLoading ? (
                                                    <div className="text-[9px] font-mono text-shift5-dark/30 uppercase tracking-widest animate-pulse">Loading...</div>
                                                ) : bookmarks.length > 0 ? (
                                                    <div className="space-y-1">
                                                        {bookmarks.slice(0, 5).map((b) => (
                                                            <button
                                                                key={b.id}
                                                                onClick={() => handleNavigate(`/artist/${encodeURIComponent(b.name)}`)}
                                                                className="w-full flex items-center justify-between py-1.5 px-2 text-left hover:bg-black/5 transition-colors group rounded"
                                                            >
                                                                <div className="flex items-center gap-2 truncate">
                                                                    <Heart size={9} className="text-shift5-orange shrink-0 fill-current" />
                                                                    <span className="text-[11px] font-mono font-bold text-shift5-dark/70 group-hover:text-shift5-dark truncate">{b.name}</span>
                                                                </div>
                                                                <ExternalLink size={10} className="text-shift5-dark/20 group-hover:text-shift5-orange shrink-0 ml-2" />
                                                            </button>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="text-[9px] font-mono text-shift5-dark/30 uppercase tracking-widest">No saved artists yet</div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="text-[9px] font-mono text-shift5-dark/30 uppercase tracking-widest">Sign in to view saved nodes</div>
                                        )}

                                        {/* Export */}
                                        {history.length > 0 && (
                                            <button
                                                onClick={() => {
                                                    const manifest = {
                                                        timestamp: new Date().toISOString(),
                                                        session_id: Math.random().toString(36).substring(7).toUpperCase(),
                                                        nodes_logged: history.length,
                                                        path: history.map((h, i) => ({
                                                            step: i + 1,
                                                            name: h.name,
                                                            type: h.type,
                                                            resource_url: h.url
                                                        }))
                                                    };
                                                    const blob = new Blob([JSON.stringify(manifest, null, 2)], { type: "application/json" });
                                                    const url = URL.createObjectURL(blob);
                                                    const a = document.createElement("a");
                                                    a.href = url;
                                                    a.download = `SONIC_MANIFEST_${new Date().getTime()}.json`;
                                                    a.click();
                                                    URL.revokeObjectURL(url);
                                                }}
                                                className="w-full py-2 bg-shift5-dark text-white text-[9px] font-mono font-bold uppercase tracking-widest hover:bg-shift5-orange transition-colors flex items-center justify-center gap-2 group"
                                            >
                                                <Zap size={10} className="group-hover:animate-pulse" />
                                                Export_Session
                                            </button>
                                        )}
                                    </motion.div>
                                )}

                                {/* ═══ TASTE PROFILE ═══ */}
                                {activeTab === "TASTE" && (
                                    <motion.div
                                        key="taste"
                                        initial={{ opacity: 0, x: 5 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -5 }}
                                        className="space-y-5"
                                    >
                                        {/* Genre Fingerprint */}
                                        <div className="space-y-2.5">
                                            <span className="text-[9px] font-mono font-bold text-shift5-dark/40 uppercase tracking-widest">Genre_Fingerprint</span>
                                            {genreFingerprint().length > 0 ? (
                                                <div className="space-y-1.5">
                                                    {genreFingerprint().map(({ genre, percentage }) => (
                                                        <div key={genre} className="flex items-center gap-3">
                                                            <div className="flex-1 h-1.5 bg-black/5 rounded-full overflow-hidden">
                                                                <motion.div
                                                                    initial={{ width: 0 }}
                                                                    animate={{ width: `${percentage}%` }}
                                                                    transition={{ duration: 0.8, ease: "easeOut" }}
                                                                    className="h-full bg-shift5-orange/60 rounded-full"
                                                                />
                                                            </div>
                                                            <span className="text-[9px] font-mono font-bold text-shift5-dark/50 uppercase w-24 truncate text-right">{genre}</span>
                                                            <span className="text-[10px] font-mono font-black text-shift5-dark w-8 text-right">{percentage}%</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-[9px] font-mono text-shift5-dark/30 uppercase tracking-widest">Browse artists to build your fingerprint</div>
                                            )}
                                        </div>

                                        {/* Discovery Stats */}
                                        <div className="flex gap-4">
                                            <div className="flex-1 text-center py-2 bg-black/[0.04] rounded">
                                                <div className="text-xl font-black text-shift5-dark">{uniqueArtists}</div>
                                                <div className="text-[7px] font-mono font-bold text-shift5-dark/30 uppercase tracking-widest mt-0.5">Artists</div>
                                            </div>
                                            <div className="flex-1 text-center py-2 bg-black/[0.04] rounded">
                                                <div className="text-xl font-black text-shift5-dark">{uniqueGenres}</div>
                                                <div className="text-[7px] font-mono font-bold text-shift5-dark/30 uppercase tracking-widest mt-0.5">Genres</div>
                                            </div>
                                            <div className="flex-1 text-center py-2 bg-black/[0.04] rounded">
                                                <div className="text-xl font-black text-shift5-dark">{history.length}</div>
                                                <div className="text-[7px] font-mono font-bold text-shift5-dark/30 uppercase tracking-widest mt-0.5">Steps</div>
                                            </div>
                                        </div>

                                        {/* Surprise Me */}
                                        {genreFingerprint().length > 0 && (
                                            <button
                                                onClick={handleSurprise}
                                                className="w-full py-2 bg-shift5-dark text-white text-[9px] font-mono font-bold uppercase tracking-widest hover:bg-shift5-orange transition-colors flex items-center justify-center gap-2 group"
                                            >
                                                <Shuffle size={10} className="group-hover:rotate-180 transition-transform duration-500" />
                                                Surprise_Protocol
                                            </button>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
