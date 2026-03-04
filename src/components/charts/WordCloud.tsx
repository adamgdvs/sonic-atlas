"use client";

import { useMemo } from "react";
import { getGenreColor } from "@/lib/utils";
import type { ConstellationNode } from "@/components/ConstellationGraph";

interface WordCloudProps {
  center: string;
  centerGenres?: string[];
  similar: ConstellationNode[];
  highlightedId: string | null;
  onHover: (id: string | null) => void;
  onExplore: (name: string) => void;
  width?: number;
  height?: number;
}

interface PlacedWord {
  id: string;
  name: string;
  genres: string[];
  similarity: number;
  x: number;
  y: number;
  fontSize: number;
  rotate: number;
}

export default function WordCloud({ similar, highlightedId, onHover, onExplore, width = 320, height = 350 }: WordCloudProps) {
  const placed = useMemo(() => {
    if (similar.length === 0) return [];

    const sorted = [...similar].sort((a, b) => b.similarity - a.similarity);
    // EXTREME DOWNSIZING for high-end technical aesthetic
    const minFont = Math.max(4, width * 0.012);
    const maxFont = width * 0.045;
    const cx = width / 2;
    const cy = height / 2;

    const results: PlacedWord[] = [];
    // Simple bounding-box collision detection
    const boxes: { x: number; y: number; w: number; h: number }[] = [];

    for (const node of sorted) {
      // Use power scale (x^2) to reward high similarity more dramatically
      const weight = Math.pow(node.similarity, 2);
      const fontSize = minFont + (maxFont - minFont) * weight;
      const rotate = Math.random() < 0.1 ? (Math.random() - 0.5) * 15 : 0;
      // Estimate text dimensions
      const charWidth = fontSize * 0.6;
      const wordW = node.name.length * charWidth;
      const wordH = fontSize * 1.3;

      let placed = false;
      // Spiral placement
      for (let step = 0; step < 600; step++) { // More steps for denser spiral
        const angle = step * 0.2; // Denser angular step
        const radius = step * (width * 0.0015); // Tighter radius increment
        const x = cx + Math.cos(angle) * radius;
        const y = cy + Math.sin(angle) * radius;

        // Check bounds
        if (x - wordW / 2 < 20 || x + wordW / 2 > width - 20 || y - wordH / 2 < 20 || y + wordH / 2 > height - 20) {
          continue;
        }

        // Check collision with existing boxes
        const box = { x: x - wordW / 2, y: y - wordH / 2, w: wordW, h: wordH };
        let collision = false;
        for (const b of boxes) {
          if (
            box.x < b.x + b.w &&
            box.x + box.w > b.x &&
            box.y < b.y + b.h &&
            box.y + box.h > b.y
          ) {
            collision = true;
            break;
          }
        }

        if (!collision) {
          results.push({ id: node.id, name: node.name, genres: node.genres, similarity: node.similarity, x, y, fontSize, rotate });
          boxes.push(box);
          placed = true;
          break;
        }
      }

      // If we couldn't place it, skip
      if (!placed) continue;
    }

    return results;
  }, [similar, width, height]);

  return (
    <div className="w-full h-full relative">
      <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} className="block bg-neutral-900/40 rounded-lg">
        {placed.map((word) => {
          const shift5Orange = "#ff5841";
          const isHl = highlightedId === word.id;

          return (
            <g
              key={word.id}
              onMouseEnter={() => onHover(word.id)}
              onMouseLeave={() => onHover(null)}
              onClick={(e) => { e.stopPropagation(); onExplore(word.name); }}
              style={{ cursor: "pointer" }}
            >
              <text
                x={word.x}
                y={word.y}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={word.fontSize}
                fontWeight={isHl ? "700" : "600"}
                fill={isHl ? shift5Orange : "#666"}
                opacity={isHl ? 1 : 0.8}
                transform={word.rotate !== 0 ? `rotate(${word.rotate}, ${word.x}, ${word.y})` : undefined}
                fontFamily="'Roboto Mono', monospace"
                style={{ transition: "all 0.15s ease", letterSpacing: "0.05em" }}
              >
                {word.name.toUpperCase()}
              </text>
              {isHl && (
                <text
                  x={word.x}
                  y={word.y + word.fontSize * 0.9}
                  textAnchor="middle"
                  fontSize={Math.max(7, word.fontSize * 0.45)}
                  fill={shift5Orange}
                  opacity={0.6}
                  style={{ pointerEvents: "none" }}
                  fontFamily="'Roboto Mono', monospace"
                >
                  [{Math.round(word.similarity * 100)}%_MATCH]
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
