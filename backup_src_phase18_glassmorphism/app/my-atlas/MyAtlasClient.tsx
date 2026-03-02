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
    bookmarks,
}: {
    bookmarks: any[];
}) {
    // We maintain a stack of views to allow deep "Back" navigation.
    const [viewStack, setViewStack] = useState<ViewState[]>(
        bookmarks.length > 0 ? [{ type: 'artist', id: bookmarks[0].name }] : []
    );

    const currentView = viewStack.length > 0 ? viewStack[viewStack.length - 1] : null;

    // We still keep selectedArtist specifically for highlighting the active item in the left Sidebar
    const selectedArtist = viewStack.findLast(v => v.type === 'artist')?.id || null;
    const { pushNode } = useJourney();

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

    // When the user clicks an item directly in the left sidebar, we reset the stack to just that artist
    const handleSidebarClick = (name: string) => {
        setViewStack([{ type: 'artist', id: name }]);
    };

    return (
        <main className="flex-1 flex flex-col lg:flex-row overflow-hidden relative" style={{ height: "calc(100vh - 56px)" }}>
            {/* Left Sidebar - List */}
            <div className="w-full lg:w-[380px] bg-white border-r border-[#F0F0F0] flex flex-col h-[400px] lg:h-full shrink-0 z-10 shadow-[4px_0_24px_rgba(0,0,0,0.02)] relative">
                <div className="px-6 py-5 border-b border-[#F0F0F0] sticky top-0 bg-white/80 backdrop-blur-md z-10">
                    <h1 className="text-xl font-bold text-[#1D1D1F] tracking-tight mb-1" style={{ letterSpacing: "-0.02em" }}>My Atlas</h1>
                    <p className="text-[13px] text-[#9CA3AF]">
                        {bookmarks.length} saved artist{bookmarks.length === 1 ? '' : 's'}
                    </p>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-1">
                    {bookmarks.length === 0 ? (
                        <div className="text-[13px] text-[#9CA3AF] text-center mt-10">
                            You haven&apos;t bookmarked any artists yet.
                        </div>
                    ) : (
                        bookmarks.map((b) => {
                            const genres = b.genres ? JSON.parse(b.genres) : [];
                            const isActive = selectedArtist === b.name;
                            return (
                                <button
                                    key={b.id}
                                    onClick={() => handleSidebarClick(b.name)}
                                    className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-all border group text-left ${isActive ? "bg-[#F8F8FA] border-[#E5E5E5]" : "bg-transparent border-transparent hover:bg-[#FAFAFA]"}`}
                                >
                                    <div className="w-10 h-10 shrink-0 rounded-full overflow-hidden bg-[#F0F0F0]">
                                        {b.imageUrl ? (
                                            <Image src={b.imageUrl} alt={b.name} width={40} height={40} className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300" unoptimized />
                                        ) : (
                                            <ArtistInitials name={b.name} size={40} />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-[14px] font-semibold text-[#1D1D1F] truncate group-hover:text-blue-600 transition-colors" style={{ letterSpacing: "-0.01em" }}>{b.name}</h3>
                                        {genres.length > 0 && (
                                            <p className="text-[11px] text-[#9CA3AF] truncate mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis">
                                                {genres.slice(0, 4).join(", ")}
                                            </p>
                                        )}
                                    </div>
                                    <div className={`transition-colors pr-2 ${isActive ? "text-[#1D1D1F]" : "text-[#E5E5E5] group-hover:text-[#9CA3AF]"}`}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                                    </div>
                                </button>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Right Content */}
            <div className={`flex-1 relative bg-[#FAFAFA] flex flex-col min-h-[500px] lg:min-h-0 overflow-hidden transition-all duration-300 ease-in-out`}>
                <div className="shrink-0 bg-white z-20 shadow-sm relative">
                    <Breadcrumbs />
                </div>

                {currentView ? (
                    <div className="absolute inset-0 flex flex-col bg-white">
                        {currentView.type === 'artist' ? (
                            <ArtistDrawer
                                artistName={currentView.id}
                                onClose={handleBack}
                                showCloseAsBack={viewStack.length > 1}
                                onSelectArtist={handleSelectArtist}
                                onSelectGenre={handleSelectGenre}
                                className="flex-1 w-full bg-white flex flex-col z-10 relative overflow-hidden"
                            />
                        ) : (
                            <GenreDrawer
                                genreName={currentView.id}
                                onClose={handleBack}
                                showCloseAsBack={viewStack.length > 1}
                                onSelectArtist={handleSelectArtist}
                                className="flex-1 w-full bg-white flex flex-col z-10 relative overflow-hidden"
                            />
                        )}
                    </div>
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-[radial-gradient(#E5E5E5_1px,transparent_1px)] [background-size:24px_24px]">
                        <div className="px-6 py-4 rounded-full bg-white border border-[#F0F0F0] text-[13px] font-medium text-[#9CA3AF] shadow-sm">
                            Bookmark an artist to view your atlas.
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
