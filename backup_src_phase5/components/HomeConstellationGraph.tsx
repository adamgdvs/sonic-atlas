"use client";

import { useState, useRef, useCallback, useMemo } from "react";
import { getInitials, getGenreColor } from "@/lib/utils";
import * as d3 from "d3";
import { useRouter } from "next/navigation";

export interface BookmarkNode {
    id: string; // artistId
    name: string;
    genres: string[];
    imageUrl?: string | null;
}

interface LayoutNode extends BookmarkNode {
    x: number;
    y: number;
}

export default function HomeConstellationGraph({
    bookmarks,
    size = 600, // Make it larger for the dashboard
}: {
    bookmarks: BookmarkNode[];
    size?: number;
}) {
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const [hoveredId, setHoveredId] = useState<string | null>(null);
    const lastMouse = useRef({ x: 0, y: 0 });
    const router = useRouter();

    const width = size;
    const height = size;
    const cx = width / 2;
    const cy = height / 2;
    const scale = size / 320; // Used to scale standard node sizes up

    // ─── D3 Force Layout ─────────────────────────────────────────────

    const { nodes: layoutNodes, links: layoutLinks } = useMemo(() => {
        if (bookmarks.length === 0) return { nodes: [], links: [] };

        const _nodes: any[] = bookmarks.map((b) => ({ ...b }));
        const _links: any[] = [];

        // Links between bookmarked nodes if they share genres
        for (let i = 0; i < bookmarks.length; i++) {
            for (let j = i + 1; j < bookmarks.length; j++) {
                const a = bookmarks[i];
                const b = bookmarks[j];
                const sharedGenres = a.genres.filter((g) => b.genres.includes(g)).length;
                if (sharedGenres > 0) {
                    // If they share genres, they should cluster closer
                    // More shared genres = closer together
                    _links.push({
                        source: a.id,
                        target: b.id,
                        distance: Math.max(size * 0.1, size * 0.3 - (sharedGenres * 20)),
                        value: sharedGenres
                    });
                }
            }
        }

        const simulation = d3
            .forceSimulation(_nodes)
            .force(
                "link",
                d3
                    .forceLink(_links)
                    .id((d: any) => d.id)
                    .distance((d: any) => d.distance)
                    .strength(0.5) // Adjust strength so they pull together nicely
            )
            .force("charge", d3.forceManyBody().strength(-300)) // Repel each other to spread out
            .force("center", d3.forceCenter(cx, cy)) // Keep the whole cluster centered
            .force("collide", d3.forceCollide().radius(30)) // Prevent nodes from physically overlapping
            .stop();

        // Run the simulation synchronously
        simulation.tick(300);

        return {
            nodes: _nodes,
            links: _links,
        };
    }, [bookmarks, cx, cy, size]);

    // ─── Node rendering ────────────────────────────────────────────

    const nodeR = 12 * scale;
    const nodeRHl = 15 * scale;

    function nodeColor(genres: string[]): string {
        if (genres.length === 0) return "#6B7280";
        return getGenreColor(genres[0]);
    }

    const handleWheel = useCallback((e: React.WheelEvent) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        setZoom((z) => Math.min(4, Math.max(0.4, z + delta)));
    }, []);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if (e.button !== 0) return;
        setIsPanning(true);
        lastMouse.current = { x: e.clientX, y: e.clientY };
    }, []);

    const handleMouseMove = useCallback(
        (e: React.MouseEvent) => {
            if (!isPanning) return;
            const dx = e.clientX - lastMouse.current.x;
            const dy = e.clientY - lastMouse.current.y;
            lastMouse.current = { x: e.clientX, y: e.clientY };
            setPan((p) => ({ x: p.x + dx / zoom, y: p.y + dy / zoom }));
        },
        [isPanning, zoom]
    );

    const handleMouseUp = useCallback(() => {
        setIsPanning(false);
    }, []);

    const handleReset = useCallback(() => {
        setZoom(1);
        setPan({ x: 0, y: 0 });
    }, []);

    const handleExplore = (name: string) => {
        router.push(`/artist/${encodeURIComponent(name)}`);
    };

    const vbW = width / zoom;
    const vbH = height / zoom;
    const vbX = (width - vbW) / 2 - pan.x;
    const vbY = (height - vbH) / 2 - pan.y;

    function renderNode(node: LayoutNode, i: number) {
        const isHl = hoveredId === node.id;
        const color = nodeColor(node.genres);
        const r = isHl ? nodeRHl : nodeR;

        return (
            <g
                key={`node-${node.id}`}
                onMouseEnter={() => setHoveredId(node.id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={(e) => {
                    e.stopPropagation();
                    handleExplore(node.name);
                }}
                style={{ cursor: "pointer" }}
            >
                <circle
                    cx={node.x}
                    cy={node.y}
                    r={r}
                    fill={isHl ? color : `${color}18`}
                    stroke={color}
                    strokeWidth={isHl ? 1.5 : 0.75}
                    style={{ transition: "all 0.2s ease" }}
                />
                <text
                    x={node.x}
                    y={node.y}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize={6 * scale}
                    fontWeight="600"
                    letterSpacing="0.02em"
                    fill={isHl ? "#FFF" : color}
                    style={{ transition: "fill 0.2s ease", pointerEvents: "none" }}
                >
                    {getInitials(node.name)}
                </text>
                {isHl && (
                    <>
                        <text
                            x={node.x}
                            y={node.y + r + 10 * scale}
                            textAnchor="middle"
                            fontSize={7 * scale}
                            fontWeight="600"
                            fill="#1D1D1F"
                            style={{ pointerEvents: "none" }}
                        >
                            {node.name}
                        </text>
                        {node.genres.length > 0 && (
                            <text
                                x={node.x}
                                y={node.y + r + 20 * scale}
                                textAnchor="middle"
                                fontSize={5 * scale}
                                fontWeight="400"
                                fill={color}
                                style={{ pointerEvents: "none" }}
                            >
                                {node.genres[0]}
                            </text>
                        )}
                    </>
                )}
            </g>
        );
    }

    if (bookmarks.length === 0) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center text-[#9CA3AF] text-sm">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mb-4 opacity-50"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                <p>Your atlas is empty. Bookmark artists to see them here.</p>
            </div>
        );
    }

    return (
        <div
            className="relative w-full h-full bg-[#FAFAFA] overflow-hidden"
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{
                cursor: isPanning ? "grabbing" : "grab",
                touchAction: "none",
                border: "1px solid #F0F0F0"
            }}
        >
            <svg width="100%" height="100%" viewBox={`${vbX} ${vbY} ${vbW} ${vbH}`}>
                <defs>
                    <filter id="glow-atlas">
                        <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                {/* Links */}
                <g opacity={0.6}>
                    {layoutLinks.map((link: any, i: number) => {
                        const opacity = 0.15 + (link.value * 0.05); // slightly thicker/brighter for more shared genres
                        return (
                            <line
                                key={`link-${i}`}
                                x1={link.source.x}
                                y1={link.source.y}
                                x2={link.target.x}
                                y2={link.target.y}
                                stroke="#E5E5E5"
                                strokeWidth={Math.min(3, 1 + link.value * 0.5) * scale}
                                strokeOpacity={hoveredId ? (link.source.id === hoveredId || link.target.id === hoveredId ? 0.6 : 0.05) : opacity}
                                style={{ transition: "stroke-opacity 0.2s ease" }}
                            />
                        );
                    })}
                </g>

                {/* Nodes */}
                <g>
                    {layoutNodes.map((node, i) => renderNode(node, i))}
                </g>
            </svg>

            {/* Controls */}
            <div className="absolute bottom-4 right-4 flex gap-2">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setZoom((z) => Math.max(0.4, z - 0.2));
                    }}
                    className="w-8 h-8 rounded-full bg-white border border-[#E5E5E5] flex items-center justify-center text-[#6B7280] shadow-sm hover:text-[#1D1D1F] hover:border-[#1D1D1F] transition-all cursor-pointer"
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                </button>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        handleReset();
                    }}
                    className="px-3 h-8 rounded-full bg-white border border-[#E5E5E5] flex items-center justify-center text-[#6B7280] text-xs font-semibold shadow-sm hover:text-[#1D1D1F] hover:border-[#1D1D1F] transition-all cursor-pointer"
                >
                    Reset
                </button>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setZoom((z) => Math.min(4, z + 0.2));
                    }}
                    className="w-8 h-8 rounded-full bg-white border border-[#E5E5E5] flex items-center justify-center text-[#6B7280] shadow-sm hover:text-[#1D1D1F] hover:border-[#1D1D1F] transition-all cursor-pointer"
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                </button>
            </div>
        </div>
    );
}
