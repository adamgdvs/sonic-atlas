"use client";

import { useState, useRef } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import Image from "next/image";
import type { Album } from "@/lib/api";

interface MobileDiscographyProps {
    albums: Album[];
    expandedAlbum: number | null;
    onAlbumClick: (albumId: number) => void;
    onToggleDisco: (albumId: number, opening: boolean) => void;
}

export default function MobileDiscography({
    albums,
    expandedAlbum,
    onAlbumClick,
    onToggleDisco,
}: MobileDiscographyProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const x = useMotionValue(0);
    const [activeIndex, setActiveIndex] = useState(0);

    // Card dimensions
    const CARD_W = 140;
    const GAP = 12;
    const TOTAL = CARD_W + GAP;

    // Clamp drag boundaries
    const maxDrag = 0;
    const minDrag = -((albums.length - 1) * TOTAL);

    const handleDragEnd = (_: unknown, info: { offset: { x: number }; velocity: { x: number } }) => {
        const currentX = x.get();
        const projected = currentX + info.velocity.x * 0.3;
        let targetIndex = Math.round(-projected / TOTAL);
        targetIndex = Math.max(0, Math.min(albums.length - 1, targetIndex));
        setActiveIndex(targetIndex);
        animate(x, -targetIndex * TOTAL, {
            type: "spring",
            stiffness: 300,
            damping: 30,
        });
    };

    // Scale transform for each card based on distance from center
    const CardItem = ({ album, index }: { album: Album; index: number }) => {
        const isSelected = expandedAlbum === album.id;
        const cardX = useTransform(x, (latest) => {
            const cardCenter = index * TOTAL + CARD_W / 2;
            const viewCenter = -latest + (typeof window !== "undefined" ? window.innerWidth / 2 : 200);
            const distance = Math.abs(cardCenter - viewCenter);
            return distance;
        });

        const scale = useTransform(cardX, [0, TOTAL, TOTAL * 2], [1, 0.92, 0.85]);
        const opacity = useTransform(cardX, [0, TOTAL, TOTAL * 2.5], [1, 0.7, 0.4]);

        return (
            <motion.div
                style={{ scale, opacity }}
                className="shrink-0 select-none"
                onTap={() => {
                    // Snap to this card first
                    setActiveIndex(index);
                    animate(x, -index * TOTAL, {
                        type: "spring",
                        stiffness: 300,
                        damping: 30,
                    });
                    onToggleDisco(album.id, expandedAlbum !== album.id);
                }}
            >
                <div
                    className={`relative bg-shift5-dark/10 border-2 transition-colors duration-200 ${isSelected
                        ? "border-shift5-dark shadow-lg"
                        : "border-shift5-dark/20"
                        }`}
                    style={{ width: CARD_W, height: CARD_W }}
                >
                    {album.cover_medium ? (
                        <Image
                            src={album.cover_medium}
                            alt={album.title}
                            fill
                            className={`object-cover transition-all duration-500 ${isSelected ? "contrast-125 brightness-110" : "contrast-110"
                                }`}
                            unoptimized
                            draggable={false}
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] font-mono text-shift5-dark/20 uppercase">
                            No_Signal
                        </div>
                    )}

                    {/* Title overlay — always visible on mobile */}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-shift5-dark/80 to-transparent px-2 pb-2 pt-6">
                        <span className="text-[9px] font-mono text-white uppercase leading-tight line-clamp-2">
                            {album.title}
                        </span>
                    </div>

                    {isSelected && (
                        <div className="absolute -top-2 -right-2 w-5 h-5 bg-shift5-dark border-2 border-shift5-orange flex items-center justify-center">
                            <span className="text-[10px] text-shift5-orange animate-pulse">■</span>
                        </div>
                    )}
                </div>
            </motion.div>
        );
    };

    // Dot indicators
    const totalDots = Math.min(albums.length, 12);
    const dotStep = albums.length > totalDots ? Math.floor(albums.length / totalDots) : 1;

    return (
        <div className="space-y-3">
            {/* Draggable carousel */}
            <div ref={containerRef} className="overflow-hidden -mx-3">
                <motion.div
                    className="flex gap-3 px-[calc(50vw-70px)]"
                    style={{ x }}
                    drag="x"
                    dragConstraints={{ left: minDrag - 40, right: maxDrag + 40 }}
                    dragElastic={0.15}
                    onDragEnd={handleDragEnd}
                >
                    {albums.map((album, i) => (
                        <CardItem key={album.id} album={album} index={i} />
                    ))}
                </motion.div>
            </div>

            {/* Dot indicators */}
            <div className="flex items-center justify-center gap-1.5">
                {albums.slice(0, totalDots).map((_, i) => {
                    const mappedIndex = i * dotStep;
                    const isActive = activeIndex >= mappedIndex && activeIndex < mappedIndex + dotStep;
                    return (
                        <button
                            key={i}
                            className={`rounded-full transition-all duration-200 ${isActive
                                ? "w-4 h-1.5 bg-shift5-dark"
                                : "w-1.5 h-1.5 bg-shift5-dark/20"
                                }`}
                            onClick={() => {
                                setActiveIndex(mappedIndex);
                                animate(x, -mappedIndex * TOTAL, {
                                    type: "spring",
                                    stiffness: 300,
                                    damping: 30,
                                });
                            }}
                        />
                    );
                })}
            </div>

            {/* Swipe hint */}
            <div className="text-center text-[9px] font-mono text-shift5-dark/25 uppercase tracking-widest">
                Swipe to browse
            </div>
        </div>
    );
}
