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
  size?: number;
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

export default function BubbleChart({ similar, highlightedId, onHover, onExplore, size = 320 }: BubbleChartProps) {
  const scale = size / 320;

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
      .size([size - 4, size - 4])
      .padding(2 * scale);

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
  }, [similar, size, scale]);

  return (
    <div className="relative">
      <svg width={size} height={size} className="block bg-neutral-900/40 rounded-lg">
        {packed.map((node) => {
          const shift5Orange = "#ff5841";
          const isHl = highlightedId === node.id;
          const showLabel = node.r > 10 * scale;

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
                  fontSize={Math.min(node.r * 0.6, 7 * scale)}
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
                    x={node.x} y={node.y + node.r + 8 * scale}
                    textAnchor="middle" fontSize={6 * scale} fontWeight="700"
                    fill={shift5Orange}
                    fontFamily="'Roboto Mono', monospace"
                    style={{ pointerEvents: "none" }}
                  >
                    {node.name.toUpperCase()}
                  </text>
                  <text
                    x={node.x} y={node.y + node.r + 16 * scale}
                    textAnchor="middle" fontSize={4.5 * scale}
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
