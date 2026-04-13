"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import ArtistInitials from "@/components/ArtistInitials";
import ArtistDrawer from "@/components/ArtistDrawer";
import GenreDrawer from "@/components/GenreDrawer";
import Breadcrumbs from "@/components/Breadcrumbs";
import { useJourney } from "@/contexts/JourneyContext";
import { ArrowUpDown, X, ChevronLeft } from "lucide-react";
import ErrorBoundary from "@/components/ErrorBoundary";

export type ViewState =
    | { type: 'artist'; id: string }
    | { type: 'genre'; id: string };

type SortMode = "date" | "name" | "genre";

export default function MyAtlasClient({
    bookmarks: initialBookmarks,
}: {
    bookmarks: { id: string; name: string; genres?: string; imageUrl?: string | null; createdAt?: string | Date }[];
}) {
    const [bookmarks, setBookmarks] = useState(initialBookmarks);
    const [viewStack, setViewStack] = useState<ViewState[]>([]);
    const [sortMode, setSortMode] = useState<SortMode>("date");
    const [genreFilter, setGenreFilter] = useState<string | null>(null);

    const currentView = viewStack.length > 0 ? viewStack[viewStack.length - 1] : null;
    const selectedArtist = viewStack.findLast(v => v.type === 'artist')?.id || null;
    const { pushNode } = useJourney();

    // ─── Taste DNA: genre breakdown from bookmarks ───────────────
    const tasteDNA = useMemo(() => {
        const genreCounts = new Map<string, number>();
        bookmarks.forEach((b) => {
            try {
                const genres: string[] = JSON.parse(b.genres || "[]");
                genres.forEach(g => {
                    const gl = g.toLowerCase();
                    genreCounts.set(gl, (genreCounts.get(gl) || 0) + 1);
                });
            } catch { }
        });
        const sorted = [...genreCounts.entries()]
            .sort((a, b) => b[1] - a[1]);
        const total = sorted.reduce((sum, [, c]) => sum + c, 0);
        return {
            topGenres: sorted.slice(0, 5).map(([genre, count]) => ({
                genre,
                count,
                percentage: total > 0 ? Math.round((count / total) * 100) : 0,
            })),
            allGenres: sorted.map(([genre]) => genre),
            totalGenres: genreCounts.size,
        };
    }, [bookmarks]);

    // ─── Sorted & Filtered Bookmarks ─────────────────────────────
    const displayedBookmarks = useMemo(() => {
        let filtered = [...bookmarks];

        // Genre filter
        if (genreFilter) {
            filtered = filtered.filter((b) => {
                try {
                    const genres: string[] = JSON.parse(b.genres || "[]");
                    return genres.some(g => g.toLowerCase() === genreFilter);
                } catch { return false; }
            });
        }

        // Sort
        if (sortMode === "name") {
            filtered.sort((a, b) => a.name.localeCompare(b.name));
        } else if (sortMode === "genre") {
            filtered.sort((a, b) => {
                const aGenres = JSON.parse(a.genres || "[]");
                const bGenres = JSON.parse(b.genres || "[]");
                return (aGenres[0] || "zzz").localeCompare(bGenres[0] || "zzz");
            });
        }
        // "date" is default order (createdAt desc from API)

        return filtered;
    }, [bookmarks, sortMode, genreFilter]);

    const fetchBookmarks = async () => {
        try {
            const res = await fetch("/api/bookmarks");
            if (res.ok) {
                const data = await res.json();
                setBookmarks(data);
            }
        } catch {
            // silently fail
        }
    };

    useEffect(() => {
        if (viewStack.length === 1 && viewStack[0].type === "artist") {
            pushNode({
                name: viewStack[0].id,
                type: "artist",
                url: `/my-atlas`,
            });
        }
    }, [viewStack, pushNode]);

    const handleSelectArtist = (name: string) => {
        setViewStack([...viewStack, { type: 'artist', id: name }]);
        pushNode({ name, type: "artist", url: `/artist/${encodeURIComponent(name)}` });
    };

    const handleSelectGenre = (genre: string) => {
        setViewStack([...viewStack, { type: 'genre', id: genre }]);
        pushNode({ name: genre, type: "genre", url: `/genre/${encodeURIComponent(genre)}` });
    };

    const handleBack = () => {
        if (viewStack.length > 0) setViewStack(viewStack.slice(0, -1));
    };

    const handleBreadcrumbClick = (_node: unknown, index: number) => {
        if (index < viewStack.length) setViewStack(viewStack.slice(0, index + 1));
    };

    const handleSidebarClick = (name: string) => {
        setViewStack([{ type: 'artist', id: name }]);
    };

    const SORT_OPTIONS: { key: SortMode; label: string }[] = [
        { key: "date", label: "Recent" },
        { key: "name", label: "A→Z" },
        { key: "genre", label: "Genre" },
    ];

    // ─── Shared Sidebar Content ──────────────────────────────────
    const renderSidebarContent = () => (
        <>
            {/* Header */}
            <div className="px-4 sm:px-6 py-3 sm:py-5 border-b border-white/5 sticky top-0 bg-shift5-dark/95 backdrop-blur-sm z-10">
                <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                    <span className="text-[9px] sm:text-[10px] font-mono text-shift5-orange uppercase tracking-[0.2em] bg-shift5-orange/10 px-2 py-0.5 border border-shift5-orange/20">My_Atlas</span>
                    <span className="text-[9px] font-mono text-white/20 uppercase">{bookmarks.length} saved</span>
                </div>
                <h1 className="text-lg sm:text-2xl font-bold text-white tracking-tighter uppercase leading-none">My Atlas</h1>
            </div>

            {/* ─── Taste DNA Card ─── */}
            {bookmarks.length > 0 && (
                <div className="px-4 sm:px-5 py-2.5 sm:py-4 border-b border-white/5 bg-white/[0.01]">
                    <div className="flex items-center justify-between mb-2 sm:mb-3">
                        <span className="text-[8px] sm:text-[9px] font-mono font-bold text-white/25 uppercase tracking-widest">Taste_DNA</span>
                        <span className="text-[8px] sm:text-[9px] font-mono text-white/15 uppercase">{tasteDNA.totalGenres} genres</span>
                    </div>

                    {/* Genre Bars */}
                    <div className="space-y-1 sm:space-y-1.5 mb-2 sm:mb-3">
                        {tasteDNA.topGenres.map(({ genre, percentage }) => (
                            <button
                                key={genre}
                                onClick={() => setGenreFilter(genreFilter === genre ? null : genre)}
                                className={`w-full flex items-center gap-2 group transition-all active:scale-[0.98] touch-manipulation ${genreFilter === genre ? "opacity-100" : "opacity-70 hover:opacity-100"}`}
                            >
                                <div className="flex-1 h-1.5 bg-white/8 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-700 ${genreFilter === genre ? "bg-shift5-orange" : "bg-shift5-orange/60 group-hover:bg-shift5-orange/80"}`}
                                        style={{ width: `${percentage}%` }}
                                    />
                                </div>
                                <span className={`text-[8px] font-mono uppercase w-20 truncate text-right transition-colors ${genreFilter === genre ? "text-shift5-orange font-bold" : "text-white/50 group-hover:text-white/70"}`}>
                                    {genre}
                                </span>
                                <span className={`text-[9px] font-mono w-7 text-right transition-colors ${genreFilter === genre ? "text-shift5-orange font-black" : "text-white/40"}`}>
                                    {percentage}%
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* Active Filter Indicator */}
                    {genreFilter && (
                        <button
                            onClick={() => setGenreFilter(null)}
                            className="flex items-center gap-1.5 text-[8px] font-mono text-shift5-orange uppercase tracking-widest active:text-white transition-colors touch-manipulation"
                        >
                            <X size={8} />
                            Clear filter: {genreFilter}
                        </button>
                    )}
                </div>
            )}

            {/* ─── Sort Controls ─── */}
            {bookmarks.length > 1 && (
                <div className="px-4 sm:px-5 py-2 sm:py-2.5 border-b border-white/5 flex items-center gap-1.5 sm:gap-2">
                    <ArrowUpDown size={10} className="text-white/15 shrink-0" />
                    {SORT_OPTIONS.map(opt => (
                        <button
                            key={opt.key}
                            onClick={() => setSortMode(opt.key)}
                            className={`text-[8px] font-mono font-bold uppercase tracking-widest px-2 py-1 border transition-colors active:scale-95 touch-manipulation ${sortMode === opt.key
                                ? "border-shift5-orange/40 text-shift5-orange bg-shift5-orange/5"
                                : "border-white/5 text-white/20 hover:text-white/40 hover:border-white/10"
                                }`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            )}

            {/* ─── Bookmark List ─── */}
            <div className="flex-1 overflow-y-auto overscroll-contain p-2.5 sm:p-4 space-y-1.5 sm:space-y-2 pb-24 sm:pb-4" style={{ WebkitOverflowScrolling: "touch" }}>
                {displayedBookmarks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center mt-12 sm:mt-10 p-6 border border-dashed border-white/5">
                        <div className="text-white/10 text-2xl mb-3">♪</div>
                        <div className="text-[10px] text-white/20 font-mono uppercase tracking-widest text-center">
                            {genreFilter ? "No artists match this filter" : "No artists saved yet"}
                        </div>
                        <div className="text-[9px] text-white/10 font-mono uppercase tracking-wider mt-1">
                            {genreFilter ? "Try clearing the filter" : "Search and save artists to build your atlas"}
                        </div>
                    </div>
                ) : (
                    displayedBookmarks.map((b) => {
                        const genres = b.genres ? JSON.parse(b.genres) : [];
                        const isActive = selectedArtist === b.name;
                        return (
                            <button
                                key={b.id}
                                onClick={() => handleSidebarClick(b.name)}
                                className={`w-full flex items-center gap-3 p-2.5 sm:p-3 transition-all border group text-left active:scale-[0.98] touch-manipulation ${isActive ? "bg-shift5-orange/10 border-shift5-orange/30" : "bg-white/[0.01] border-white/5 hover:border-white/10 hover:bg-white/[0.03] active:bg-white/[0.06]"}`}
                            >
                                <div className="w-10 h-10 sm:w-12 sm:h-12 shrink-0 border border-white/10 p-0.5 bg-shift5-dark relative overflow-hidden">
                                    {b.imageUrl ? (
                                        <Image src={b.imageUrl} alt={b.name} width={48} height={48} className={`object-cover w-full h-full transition-all duration-500 ${isActive ? 'grayscale-0' : 'grayscale'}`} unoptimized />
                                    ) : (
                                        <ArtistInitials name={b.name} size={48} />
                                    )}
                                    {isActive && <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-shift5-orange animate-pulse" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="hidden sm:block text-[9px] font-mono text-white/20 uppercase tracking-widest mb-0.5">Node_Ident</div>
                                    <h3 className={`text-[12px] sm:text-sm font-bold truncate transition-colors uppercase tracking-tight ${isActive ? "text-shift5-orange" : "text-white/80 group-hover:text-white"}`}>{b.name}</h3>
                                    {genres.length > 0 && (
                                        <div className="flex gap-1 mt-0.5 overflow-hidden h-3.5 sm:h-4">
                                            {genres.slice(0, 2).map((g: string) => (
                                                <span key={g} className="text-[7px] sm:text-[9px] font-mono text-white/20 uppercase whitespace-nowrap">#{g}</span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className={`transition-colors shrink-0 ${isActive ? "text-shift5-orange" : "text-white/10 group-hover:text-white/30"}`}>
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                                </div>
                            </button>
                        );
                    })
                )}
            </div>
        </>
    );

    // ─── Mobile: full-screen artist/genre detail with back gesture ─
    const renderMobileDetail = () => {
        if (!currentView) return null;
        return (
            <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 30, stiffness: 300 }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={{ left: 0, right: 0.35 }}
                onDragEnd={(_: unknown, info: { offset: { x: number }; velocity: { x: number } }) => {
                    if (info.offset.x > 80 || info.velocity.x > 400) {
                        handleBack();
                    }
                }}
                className="fixed inset-0 z-50 bg-shift5-dark flex flex-col lg:hidden"
            >
                {/* Edge swipe hint */}
                <div className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1 h-10 rounded-full bg-white/8 z-20 pointer-events-none" />

                {/* Back bar */}
                <div className="flex items-center gap-2 px-3 py-2.5 border-b border-white/5 bg-shift5-dark/95 backdrop-blur-sm shrink-0">
                    <button
                        onClick={handleBack}
                        className="flex items-center gap-1 text-[10px] font-mono text-white/50 active:text-white uppercase tracking-widest touch-manipulation active:scale-95 -ml-1 p-1"
                    >
                        <ChevronLeft size={16} />
                        Back
                    </button>
                    <div className="flex-1" />
                    <span className="text-[9px] font-mono text-white/15 uppercase tracking-wider truncate max-w-[45vw]">
                        {currentView.id}
                    </span>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-hidden">
                    <ErrorBoundary>
                        {currentView.type === 'artist' ? (
                            <ArtistDrawer
                                artistName={currentView.id}
                                onClose={handleBack}
                                showCloseAsBack={viewStack.length > 1}
                                onSelectArtist={handleSelectArtist}
                                onSelectGenre={handleSelectGenre}
                                onBookmarksChange={fetchBookmarks}
                                className="w-full h-full bg-shift5-dark flex flex-col overflow-hidden"
                            />
                        ) : (
                            <GenreDrawer
                                genreName={currentView.id}
                                onClose={handleBack}
                                showCloseAsBack={viewStack.length > 1}
                                onSelectArtist={handleSelectArtist}
                                onBookmarksChange={fetchBookmarks}
                                className="w-full h-full bg-shift5-dark flex flex-col overflow-hidden"
                            />
                        )}
                    </ErrorBoundary>
                </div>
            </motion.div>
        );
    };

    return (
        <>
            <main className="flex-1 flex flex-col lg:flex-row overflow-hidden relative" style={{ height: "calc(100vh - 64px)" }}>
                {/* Background Grid */}
                <div className="fixed inset-0 pointer-events-none opacity-[0.02] overflow-hidden z-0">
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#888_1px,transparent_1px),linear-gradient(to_bottom,#888_1px,transparent_1px)] bg-[size:40px_40px]" />
                </div>

                {/* ═══ Sidebar: Full-screen on mobile, fixed-width on desktop ═══ */}
                <div className="flex flex-col h-full w-full lg:w-[380px] bg-shift5-dark lg:border-r border-white/5 shrink-0 z-10 relative">
                    {renderSidebarContent()}
                </div>

                {/* ═══ Desktop: Right Content Panel ═══ */}
                <div className="hidden lg:flex flex-1 relative bg-shift5-dark flex-col min-h-0 overflow-hidden transition-all duration-300 ease-in-out">
                    <div className="shrink-0 bg-shift5-dark z-20 relative">
                        <Breadcrumbs onNodeClick={handleBreadcrumbClick} />
                    </div>

                    {currentView ? (
                        <div className="flex-1 flex flex-col bg-shift5-dark z-10 relative">
                            <ErrorBoundary>
                                {currentView.type === 'artist' ? (
                                    <ArtistDrawer
                                        artistName={currentView.id}
                                        onClose={handleBack}
                                        showCloseAsBack={viewStack.length > 1}
                                        onSelectArtist={handleSelectArtist}
                                        onSelectGenre={handleSelectGenre}
                                        onBookmarksChange={fetchBookmarks}
                                        className="flex-1 w-full bg-shift5-dark flex flex-col z-10 relative overflow-hidden"
                                    />
                                ) : (
                                    <GenreDrawer
                                        genreName={currentView.id}
                                        onClose={handleBack}
                                        showCloseAsBack={viewStack.length > 1}
                                        onSelectArtist={handleSelectArtist}
                                        onBookmarksChange={fetchBookmarks}
                                        className="flex-1 w-full bg-shift5-dark flex flex-col z-10 relative overflow-hidden"
                                    />
                                )}
                            </ErrorBoundary>
                        </div>
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-transparent z-10">
                            <div className="px-8 py-5 border border-white/10 bg-white/[0.01] text-[10px] font-mono text-white/30 uppercase tracking-[0.2em] backdrop-blur-md">
                                Waiting_For_Node_Command...
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* Mobile detail overlay — slides over the list */}
            <AnimatePresence>
                {currentView && renderMobileDetail()}
            </AnimatePresence>
        </>
    );
}
