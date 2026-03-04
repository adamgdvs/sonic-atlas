"use client";

import { useMemo } from "react";
import * as d3 from "d3";
import { getInitials, getGenreColor } from "@/lib/utils";
import type { ConstellationNode } from "@/components/ConstellationGraph";

interface BubbleChartProps {
  center: string;
  centerGenres?: string[];
  similar: ConstellationNode[];
  highlightedId: string | null;
  onHover: (id: string | null) => void;
  onExplore: (name: string) => void;
  width?: number;
  height?: number;
}

interface PackedNode {
  id: string;
  name: string;
  genres: string[];
  similarity: number;
  x: number;
  y: number;
  r: number;
}

export default function BubbleChart({ similar, highlightedId, onHover, onExplore, width = 320, height = 350 }: BubbleChartProps) {
  const scale = width / 320;

  const packed = useMemo(() => {
    if (similar.length === 0) return [];

    const data = {
      name: "root",
      children: similar.map((s) => ({
        name: s.name,
        id: s.id,
        genres: s.genres,
        similarity: s.similarity,
        // Value drives bubble size — ensure minimum so small similarities are still visible
        value: Math.max(0.15, s.similarity),
      })),
    };

    const root = d3.hierarchy(data)
      .sum((d: unknown) => (d as { value?: number }).value || 0);

    const pack = d3.pack<typeof data>()
      .size([width - 4, height - 4])
      .padding(6 * scale); // Increased padding for technical spacing

    const packed = pack(root);

    return packed.leaves().map((leaf): PackedNode => {
      const d = leaf.data as unknown as { id: string; name: string; genres: string[]; similarity: number };
      return {
        id: d.id,
        name: d.name,
        genres: d.genres,
        similarity: d.similarity,
        x: leaf.x + 2,
        y: leaf.y + 2,
        r: leaf.r,
      };
    });
  }, [similar, width, height, scale]);

  return (
    <div className="w-full h-full relative">
      <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} className="block bg-neutral-900/40 rounded-lg">
        {packed.map((node) => {
          const shift5Orange = "#ff5841";
          const isHl = highlightedId === node.id;
          const showLabel = node.r > 12; // Fixed threshold — show initials in all but tiniest bubbles

          return (
            <g
              key={node.id}
              onMouseEnter={() => onHover(node.id)}
              onMouseLeave={() => onHover(null)}
              onClick={(e) => { e.stopPropagation(); onExplore(node.name); }}
              style={{ cursor: "pointer" }}
            >
              <circle
                cx={node.x} cy={node.y}
                r={isHl ? node.r + 2 : node.r}
                fill={isHl ? `${shift5Orange}20` : "transparent"}
                stroke={isHl ? shift5Orange : "#333"}
                strokeWidth={isHl ? 1.5 : 0.75}
                style={{ transition: "all 0.15s ease" }}
              />
              {showLabel && (
                <text
                  x={node.x} y={node.y}
                  textAnchor="middle" dominantBaseline="central"
                  fontSize={Math.min(node.r * 0.45, 14)}
                  fontWeight="600"
                  fill={isHl ? shift5Orange : "#666"}
                  fontFamily="'Roboto Mono', monospace"
                  style={{ pointerEvents: "none", transition: "fill 0.15s ease" }}
                >
                  {getInitials(node.name)}
                </text>
              )}
              {isHl && (
                <>
                  <text
                    x={node.x} y={node.y + node.r + Math.min(8, 6 * scale)}
                    textAnchor="middle" fontSize={Math.min(14, 4.5 * scale)} fontWeight="700"
                    fill={shift5Orange}
                    fontFamily="'Roboto Mono', monospace"
                    style={{ pointerEvents: "none" }}
                  >
                    {node.name.toUpperCase()}
                  </text>
                  <text
                    x={node.x} y={node.y + node.r + Math.min(16, 12 * scale)}
                    textAnchor="middle" fontSize={Math.min(10, 3.2 * scale)}
                    fill="#444"
                    style={{ pointerEvents: "none" }}
                    fontFamily="'Roboto Mono', monospace"
                  >
                    [{node.genres[0]?.toUpperCase() || "UNKNOWN"}] · {Math.round(node.similarity * 100)}%
                  </text>
                </>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
