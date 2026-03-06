"use client";

import { useMemo, useState } from "react";
import { getInitials } from "@/lib/utils";
import type { ConstellationNode } from "@/components/ConstellationGraph";

interface ResonanceGraphProps {
    center: string;
    similar: ConstellationNode[];
    highlightedId: string | null;
    onHover: (id: string | null) => void;
    onExplore: (name: string) => void;
    width?: number;
    height?: number;
}

interface TieredNode extends ConstellationNode {
    tierIndex: number;
    angle: number;
    r: number;
    x: number;
    y: number;
}

const TIERS = [
    { label: "AUTHORITATIVE_ORBIT", min: 0.8, color: "#ffffff" },
    { label: "RESONANCE_BAND", min: 0.6, color: "#dedede" },
    { label: "SPECTRAL_SIGNAL", min: 0.4, color: "#888888" },
    { label: "OUTER_HORIZON", min: 0, color: "#444444" },
];

export default function ResonanceGraph({
    similar,
    center,
    highlightedId,
    onHover,
    onExplore,
    width = 600,
    height = 400,
}: ResonanceGraphProps) {
    const shift5Orange = "#ff5841";

    const { tieredNodes, tierRadii } = useMemo(() => {
        const padding = 40;
        const innerRadius = 60;
        const availableHeight = height - padding * 2 - innerRadius;
        const step = availableHeight / (TIERS.length - 1);

        const radii = TIERS.map((_, i) => innerRadius + i * step);

        // Group nodes by tier
        const nodes: TieredNode[] = similar.map((s) => {
            const tierIndex = TIERS.findIndex(t => s.similarity >= t.min);
            return { ...s, tierIndex, angle: 0, r: radii[tierIndex], x: 0, y: 0 };
        });

        // Distribute nodes along arcs
        // Arcs go from roughly 200 degrees to 340 degrees (bottom-anchored semi-circles)
        const tierCounts: Record<number, number> = {};
        nodes.forEach(n => {
            tierCounts[n.tierIndex] = (tierCounts[n.tierIndex] || 0) + 1;
        });

        const tierProgress: Record<number, number> = {};
        const finalNodes = nodes.map(n => {
            const count = tierCounts[n.tierIndex];
            const progress = tierProgress[n.tierIndex] || 0;
            tierProgress[n.tierIndex] = progress + 1;

            // Calculate angle
            // We want to distribute them evenly across a 140 degree arc centered at the top
            // But looking at the screenshots, it's more like a stack of nesting bowls.
            // Let's anchor the center at (width/2, height) and draw arcs upwards.
            const startAngle = Math.PI + 0.4; // Slightly past 180deg
            const endAngle = 2 * Math.PI - 0.4; // Slightly before 360deg

            let angle = startAngle;
            if (count > 1) {
                angle = startAngle + (progress / (count - 1)) * (endAngle - startAngle);
            } else {
                angle = (startAngle + endAngle) / 2;
            }

            // Add a tiny bit of jitter to radius so they aren't perfectly on the line
            const jitteredR = n.r + (Math.random() - 0.5) * 15;

            return {
                ...n,
                angle,
                x: width / 2 + jitteredR * Math.cos(angle),
                y: height - 20 + jitteredR * Math.sin(angle),
            };
        });

        return { tieredNodes: finalNodes, tierRadii: radii };
    }, [similar, width, height]);

    return (
        <div className="w-full h-full relative overflow-hidden bg-shift5-dark rounded-lg border border-white/5">
            <svg
                width="100%"
                height="100%"
                viewBox={`0 0 ${width} ${height}`}
                className="block"
            >
                {/* Shaded Band Fills (Screenshot style) */}
                {tierRadii.map((r, i) => {
                    const hoveredNode = tieredNodes.find(n => n.id === highlightedId);
                    const activeTierIndex = hoveredNode ? hoveredNode.tierIndex : -1;

                    // Fill all tiers up to the active one (or just the outermost background)
                    const isFilled = activeTierIndex !== -1 && i >= activeTierIndex;

                    return (
                        <path
                            key={`fill-${i}`}
                            d={`M ${width / 2 - r} ${height - 20} A ${r} ${r} 0 0 1 ${width / 2 + r} ${height - 20} L ${width / 2} ${height - 20} Z`}
                            fill="white"
                            fillOpacity={isFilled ? 0.08 : 0}
                            style={{ transition: "fill-opacity 0.4s ease" }}
                        />
                    );
                }).reverse()}

                {/* Background Arcs */}
                {tierRadii.map((r, i) => (
                    <g key={`tier-${i}`}>
                        <path
                            d={`M ${width / 2 - r} ${height - 20} A ${r} ${r} 0 0 1 ${width / 2 + r} ${height - 20}`}
                            fill="none"
                            stroke="white"
                            strokeWidth={0.5}
                            strokeOpacity={0.1}
                            strokeDasharray="2,4"
                        />
                        <text
                            x={width / 2}
                            y={height - 20 - r - 8}
                            textAnchor="middle"
                            fontSize="7"
                            fontFamily="var(--font-dm-mono)"
                            fill="white"
                            fillOpacity={0.2}
                            className="uppercase tracking-[0.2em]"
                        >
                            {TIERS[i].label}
                        </text>
                    </g>
                ))}

                {/* Center Node (Core) */}
                <g transform={`translate(${width / 2}, ${height - 20})`}>
                    <circle r={25} fill="#111" stroke={shift5Orange} strokeWidth={1} />
                    <circle r={30} fill="none" stroke={shift5Orange} strokeWidth={0.5} strokeOpacity={0.2} strokeDasharray="2,2" />
                    <text
                        textAnchor="middle"
                        dominantBaseline="central"
                        fontSize="10"
                        fontWeight="bold"
                        fill={shift5Orange}
                        fontFamily="var(--font-dm-mono)"
                    >
                        {getInitials(center)}
                    </text>
                    <text
                        y={12}
                        textAnchor="middle"
                        fontSize="6"
                        fill="white"
                        fillOpacity={0.4}
                        fontFamily="var(--font-dm-mono)"
                        className="uppercase tracking-widest"
                    >
                        CORE_REF
                    </text>
                </g>

                {/* Connections */}
                {tieredNodes.map((node) => {
                    const isHl = highlightedId === node.id;
                    return (
                        <line
                            key={`line-${node.id}`}
                            x1={width / 2}
                            y1={height - 20}
                            x2={node.x}
                            y2={node.y}
                            stroke={isHl ? shift5Orange : "white"}
                            strokeWidth={isHl ? 0.8 : 0.3}
                            strokeOpacity={isHl ? 0.6 : 0.05}
                            strokeDasharray={isHl ? "none" : "1,3"}
                            style={{ transition: "all 0.2s ease" }}
                        />
                    );
                })}

                {/* Nodes */}
                {tieredNodes.map((node) => {
                    const isHl = highlightedId === node.id;
                    const tierColor = TIERS[node.tierIndex].color;

                    return (
                        <g
                            key={node.id}
                            className="cursor-pointer"
                            onMouseEnter={() => onHover(node.id)}
                            onMouseLeave={() => onHover(null)}
                            onClick={() => onExplore(node.name)}
                        >
                            {/* Glow effect for highlighted */}
                            {isHl && (
                                <circle
                                    cx={node.x}
                                    cy={node.y}
                                    r={12}
                                    fill={shift5Orange}
                                    fillOpacity={0.15}
                                    className="animate-pulse"
                                />
                            )}

                            <circle
                                cx={node.x}
                                cy={node.y}
                                r={isHl ? 5 : 3.5}
                                fill={isHl ? shift5Orange : "#111"}
                                stroke={isHl ? shift5Orange : tierColor}
                                strokeWidth={1}
                                strokeOpacity={isHl ? 1 : 0.6}
                                style={{ transition: "all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)" }}
                            />

                            {/* Label */}
                            <text
                                x={node.x}
                                y={node.y - (isHl ? 10 : 8)}
                                textAnchor="middle"
                                fontSize={isHl ? 10 : 8}
                                fontFamily="var(--font-dm-mono)"
                                fill={isHl ? shift5Orange : "white"}
                                fillOpacity={isHl ? 1 : 0.5}
                                className="uppercase tracking-wider font-bold"
                                style={{ transition: "all 0.2s ease" }}
                            >
                                {node.name}
                            </text>

                            {isHl && (
                                <text
                                    x={node.x}
                                    y={node.y + 14}
                                    textAnchor="middle"
                                    fontSize="7"
                                    fontFamily="var(--font-dm-mono)"
                                    fill="white"
                                    fillOpacity={0.4}
                                >
                                    {Math.round(node.similarity * 100)}% MATCH
                                </text>
                            )}
                        </g>
                    );
                })}
            </svg>

            {/* Control Overlay */}
            <div className="absolute top-3 right-3 flex flex-col gap-1 items-end pointer-events-none">
                <span className="text-[8px] font-mono text-white/20 uppercase tracking-[0.3em]">Resonance_Spectrum // Active</span>
                <div className="flex gap-2">
                    {TIERS.map(t => (
                        <div key={t.label} className="flex items-center gap-1">
                            <div className="w-1 h-1 rounded-full" style={{ backgroundColor: t.color, opacity: 0.3 }} />
                            <span className="text-[6px] font-mono text-white/10 uppercase tracking-tighter">{t.label.split('_')[0]}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
