"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import ArtistInitials from "@/components/ArtistInitials";
import ArtistDrawer from "@/components/ArtistDrawer";
import GenreDrawer from "@/components/GenreDrawer";
import Breadcrumbs from "@/components/Breadcrumbs";
import { useJourney } from "@/contexts/JourneyContext";

export type ViewState =
    | { type: 'artist'; id: string }
    | { type: 'genre'; id: string };

export default function MyAtlasClient({
    bookmarks: initialBookmarks,
}: {
    bookmarks: any[];
}) {
    // Local state for bookmarks to allow real-time refresh
    const [bookmarks, setBookmarks] = useState(initialBookmarks);

    // We maintain a stack of views to allow deep "Back" navigation.
    const [viewStack, setViewStack] = useState<ViewState[]>(
        bookmarks.length > 0 ? [{ type: 'artist', id: bookmarks[0].name }] : []
    );

    const currentView = viewStack.length > 0 ? viewStack[viewStack.length - 1] : null;

    // We still keep selectedArtist specifically for highlighting the active item in the left Sidebar
    const selectedArtist = viewStack.findLast(v => v.type === 'artist')?.id || null;
    const { pushNode } = useJourney();

    const fetchBookmarks = async () => {
        try {
            const res = await fetch("/api/bookmarks");
            if (res.ok) {
                const data = await res.json();
                setBookmarks(data);
            }
        } catch (err) {
            console.error("Failed to refresh bookmarks:", err);
        }
    };

    // Sync root dashboard entry back to history
    useEffect(() => {
        if (viewStack.length === 1 && viewStack[0].type === "artist") {
            pushNode({
                name: viewStack[0].id,
                type: "artist",
                url: `/my-atlas`, // Root of my-atlas
            });
        }
    }, [viewStack, pushNode]);

    const handleSelectArtist = (name: string) => {
        setViewStack([...viewStack, { type: 'artist', id: name }]);
        pushNode({
            name,
            type: "artist",
            url: `/artist/${encodeURIComponent(name)}`
        });
    };

    const handleSelectGenre = (genre: string) => {
        setViewStack([...viewStack, { type: 'genre', id: genre }]);
        pushNode({
            name: genre,
            type: "genre",
            url: `/genre/${encodeURIComponent(genre)}`
        });
    };

    const handleBack = () => {
        if (viewStack.length > 1) {
            setViewStack(viewStack.slice(0, -1));
        }
    };

    const handleBreadcrumbClick = (_node: any, index: number) => {
        // Only allow clicking nodes that are already in our stack
        // Breadcrumbs often start with HOME which isn't in viewStack, so we adjust
        if (index < viewStack.length) {
            setViewStack(viewStack.slice(0, index + 1));
        }
    };

    // When the user clicks an item directly in the left sidebar, we reset the stack to just that artist
    const handleSidebarClick = (name: string) => {
        setViewStack([{ type: 'artist', id: name }]);
    };

    return (
        <main className="flex-1 flex flex-col lg:flex-row overflow-hidden relative" style={{ height: "calc(100vh - 56px)" }}>
            {/* Background Decorative Grid */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.02] overflow-hidden z-0">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#888_1px,transparent_1px),linear-gradient(to_bottom,#888_1px,transparent_1px)] bg-[size:40px_40px]" />
            </div>

            {/* Left Sidebar - List */}
            <div className="w-full lg:w-[380px] bg-shift5-dark border-r border-white/5 flex flex-col h-[400px] lg:h-full shrink-0 z-10 relative">
                <div className="px-6 py-5 border-b border-white/5 sticky top-0 bg-shift5-dark/95 backdrop-blur-sm z-10">
                    <div className="flex items-center gap-3 mb-2">
                        <span className="text-[10px] font-mono text-shift5-orange uppercase tracking-[0.2em] bg-shift5-orange/10 px-2 py-0.5 border border-shift5-orange/20">Operational_Atlas</span>
                    </div>
                    <h1 className="text-2xl font-bold text-white tracking-tighter uppercase mb-1">My Atlas</h1>
                    <p className="text-[10px] text-white/40 font-mono uppercase tracking-widest">
                        Detected_Signals // {bookmarks.length.toString().padStart(2, '0')}
                    </p>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {bookmarks.length === 0 ? (
                        <div className="text-[10px] text-white/20 font-mono uppercase tracking-widest text-center mt-10 p-6 border border-dashed border-white/5">
                            Zero_Identifiers_Saved
                        </div>
                    ) : (
                        bookmarks.map((b) => {
                            const genres = b.genres ? JSON.parse(b.genres) : [];
                            const isActive = selectedArtist === b.name;
                            return (
                                <button
                                    key={b.id}
                                    onClick={() => handleSidebarClick(b.name)}
                                    className={`w-full flex items-center gap-4 p-3 transition-all border group text-left ${isActive ? "bg-shift5-orange/10 border-shift5-orange/30" : "bg-white/[0.01] border-white/5 hover:border-white/10 hover:bg-white/[0.03]"}`}
                                >
                                    <div className="w-12 h-12 shrink-0 border border-white/10 p-0.5 bg-shift5-dark relative">
                                        {b.imageUrl ? (
                                            <Image src={b.imageUrl} alt={b.name} width={48} height={48} className={`object-cover w-full h-full transition-all duration-500 ${isActive ? 'grayscale-0' : 'grayscale'}`} unoptimized />
                                        ) : (
                                            <ArtistInitials name={b.name} size={48} />
                                        )}
                                        {isActive && <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-shift5-orange animate-pulse" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-[9px] font-mono text-white/20 uppercase tracking-widest mb-0.5">Node_Ident</div>
                                        <h3 className={`text-sm font-bold truncate transition-colors uppercase tracking-tight ${isActive ? "text-shift5-orange" : "text-white/80 group-hover:text-white"}`}>{b.name}</h3>
                                        {genres.length > 0 && (
                                            <div className="flex gap-1 mt-1 overflow-hidden h-4">
                                                {genres.slice(0, 2).map((g: string) => (
                                                    <span key={g} className="text-[9px] font-mono text-white/20 uppercase whitespace-nowrap">#{g}</span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <div className={`transition-colors pr-2 ${isActive ? "text-shift5-orange" : "text-white/10 group-hover:text-white/30"}`}>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                                    </div>
                                </button>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Right Content */}
            <div className={`flex-1 relative bg-shift5-dark flex flex-col min-h-[500px] lg:min-h-0 overflow-hidden transition-all duration-300 ease-in-out`}>
                <div className="shrink-0 bg-shift5-dark z-20 relative">
                    <Breadcrumbs onNodeClick={handleBreadcrumbClick} />
                </div>

                {currentView ? (
                    <div className="flex-1 flex flex-col bg-shift5-dark z-10 relative">
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
    );
}
