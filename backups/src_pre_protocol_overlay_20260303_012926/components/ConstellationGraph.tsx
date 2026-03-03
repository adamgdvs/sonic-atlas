"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { getInitials, getGenreColor } from "@/lib/utils";
import * as d3 from "d3";

export interface ConstellationNode {
  id: string;
  name: string;
  genres: string[];
  similarity: number;
}

interface LayoutNode extends ConstellationNode {
  x: number;
  y: number;
}

export default function ConstellationGraph({
  center,
  centerGenres,
  similar,
  highlightedId,
  onHover,
  onExplore,
  size = 320,
}: {
  center: string;
  centerGenres?: string[];
  similar: ConstellationNode[];
  highlightedId: string | null;
  onHover: (id: string | null) => void;
  onExplore: (name: string) => void;
  size?: number;
}) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const lastMouse = useRef({ x: 0, y: 0 });

  const width = size;
  const height = size;
  const cx = width / 2;
  const cy = height / 2;
  const scale = size / 320;

  const sorted = [...similar].sort((a, b) => b.similarity - a.similarity);

  // ─── D3 Force Layout ─────────────────────────────────────────────

  const { nodes: layoutNodes, links: layoutLinks } = useMemo(() => {
    // Center node
    const _nodes: any[] = [{
      id: "CENTER_NODE",
      name: center,
      genres: centerGenres || [],
      similarity: 1.0,
      fx: cx,
      fy: cy, // lock center node
      isCenter: true
    }];

    // Create a copy of similar nodes
    sorted.forEach((node) => {
      _nodes.push({ ...node, isCenter: false });
    });

    // Links from center to all similar artists
    // Use similarity (0.0 to 1.0) to determine ideal distance
    const _links = sorted.map((node) => ({
      source: "CENTER_NODE",
      target: node.id,
      // higher similarity = shorter distance
      distance: Math.max(size * 0.15, size * 0.45 * (1 - (node.similarity || 0.5)))
    }));

    // Links between similar nodes if they share genres
    for (let i = 0; i < sorted.length; i++) {
      for (let j = i + 1; j < sorted.length; j++) {
        const a = sorted[i];
        const b = sorted[j];
        const shared = a.genres.filter(g => b.genres.includes(g)).length;
        if (shared > 0) {
          // If they share genres, they should cluster closer
          _links.push({
            source: a.id,
            target: b.id,
            distance: size * 0.2
          });
        }
      }
    }

    const simulation = d3.forceSimulation(_nodes)
      .force("link", d3.forceLink(_links).id((d: any) => d.id).distance((d: any) => d.distance).strength((d: any) => d.source.id === "CENTER_NODE" ? 1 : 0.2))
      .force("charge", d3.forceManyBody().strength(-200)) // Repel each other
      .force("collide", d3.forceCollide().radius(25)) // Prevent overlap
      .stop();

    // Run the simulation synchronously
    simulation.tick(300);

    return {
      nodes: _nodes,
      links: _links
    };
  }, [center, centerGenres, sorted, cx, cy, size]);

  // ─── Node rendering ────────────────────────────────────────────

  const nodeR = 10 * scale;
  const nodeRHl = 13 * scale;
  const centerR = 15 * scale;

  function nodeColor(genres: string[]): string {
    if (genres.length === 0) return "#6B7280";
    return getGenreColor(genres[0]);
  }

  const centerColor = centerGenres?.length ? getGenreColor(centerGenres[0]) : "#1D1D1F";

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

  const vbW = width / zoom;
  const vbH = height / zoom;
  const vbX = (width - vbW) / 2 - pan.x;
  const vbY = (height - vbH) / 2 - pan.y;

  function renderNode(node: LayoutNode, i: number, keyPrefix: string) {
    const isHl = highlightedId === node.id;
    const color = nodeColor(node.genres);
    const r = isHl ? nodeRHl : nodeR;

    return (
      <g
        key={`${keyPrefix}-${i}`}
        onMouseEnter={() => onHover(node.id)}
        onMouseLeave={() => onHover(null)}
        onClick={(e) => { e.stopPropagation(); onExplore(node.name); }}
        style={{ cursor: "pointer" }}
      >
        <circle
          cx={node.x} cy={node.y} r={r}
          fill={isHl ? color : `${color}18`}
          stroke={color}
          strokeWidth={isHl ? 1.5 : 0.75}
          style={{ transition: "all 0.2s ease" }}
        />
        <text
          x={node.x} y={node.y}
          textAnchor="middle" dominantBaseline="central"
          fontSize={5.5 * scale} fontWeight="600" letterSpacing="0.02em"
          fill={isHl ? "#FFF" : color}
          style={{ transition: "fill 0.2s ease", pointerEvents: "none" }}
        >
          {getInitials(node.name)}
        </text>
        {isHl && (
          <>
            <text
              x={node.x} y={node.y + r + 7 * scale}
              textAnchor="middle" fontSize={6.5 * scale} fontWeight="600" fill="#1D1D1F"
              style={{ pointerEvents: "none" }}
            >
              {node.name}
            </text>
            {node.genres.length > 0 && (
              <text
                x={node.x} y={node.y + r + 15 * scale}
                textAnchor="middle" fontSize={5 * scale} fontWeight="400" fill={color}
                style={{ pointerEvents: "none" }}
              >
                {node.genres[0]}
              </text>
            )}
          </>
        )}
        {!isHl && node.genres.length > 0 && (
          <text
            x={node.x} y={node.y + r + 6 * scale}
            textAnchor="middle" fontSize={4 * scale} fontWeight="400" fill={`${color}99`}
            style={{ pointerEvents: "none" }}
          >
            {node.genres[0]}
          </text>
        )}
      </g>
    );
  }

  return (
    <div className="relative">
      <svg
        width={width} height={height}
        viewBox={`${vbX} ${vbY} ${vbW} ${vbH}`}
        className="block"
        style={{ cursor: isPanning ? "grabbing" : "grab" }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Draw Links */}
        {layoutLinks.map((link: any, i: number) => {
          // highlight primary links, fade secondary links
          const isPrimary = link.source.id === "CENTER_NODE";
          const isHighlighted = highlightedId === link.target.id || highlightedId === link.source.id;

          let stroke = "#F0F0F0";
          let strokeWidth = 0.5;

          if (isHighlighted) {
            // Highlight the full path from the hovered node
            stroke = nodeColor(link.target.genres);
            strokeWidth = 1.0;
          } else if (isPrimary) {
            stroke = "#E5E5E5";
          }

          return (
            <line key={`link-${i}`} x1={link.source.x} y1={link.source.y} x2={link.target.x} y2={link.target.y}
              stroke={stroke}
              strokeWidth={strokeWidth}
              style={{ transition: "all 0.2s ease", opacity: isPrimary || isHighlighted ? 1 : 0.3 }}
            />
          );
        })}
        {/* Draw Nodes (skip center, render later for z-index) */}
        {layoutNodes.filter((n) => !n.isCenter).map((node, i) => renderNode(node, i, "n"))}

        {/* Center node */}
        <circle cx={cx} cy={cy} r={centerR} fill={centerColor} style={{ filter: "drop-shadow(0px 4px 12px rgba(0,0,0,0.15))" }} />
        <text
          x={cx} y={cy - 1.5 * scale}
          textAnchor="middle" dominantBaseline="central"
          fontSize={6.5 * scale} fontWeight="700" fill="#FFF" letterSpacing="0.02em"
        >
          {getInitials(center)}
        </text>
        <text
          x={cx} y={cy + 6 * scale}
          textAnchor="middle" fontSize={3.5 * scale}
          fill="rgba(255,255,255,0.6)" letterSpacing="0.04em"
        >
          CENTER
        </text>
      </svg>

      {/* Zoom controls */}
      <div className="absolute bottom-2 right-2 flex gap-1">
        <button
          onClick={() => setZoom((z) => Math.min(4, z + 0.25))}
          className="w-6 h-6 flex items-center justify-center bg-white border border-[#E5E5E5] text-[#6B7280] text-xs cursor-pointer hover:border-[#1D1D1F] hover:text-[#1D1D1F] transition-all duration-150"
          title="Zoom in"
        >
          +
        </button>
        <button
          onClick={() => setZoom((z) => Math.max(0.4, z - 0.25))}
          className="w-6 h-6 flex items-center justify-center bg-white border border-[#E5E5E5] text-[#6B7280] text-xs cursor-pointer hover:border-[#1D1D1F] hover:text-[#1D1D1F] transition-all duration-150"
          title="Zoom out"
        >
          −
        </button>
        {(zoom !== 1 || pan.x !== 0 || pan.y !== 0) && (
          <button
            onClick={handleReset}
            className="w-6 h-6 flex items-center justify-center bg-white border border-[#E5E5E5] text-[#6B7280] text-[9px] cursor-pointer hover:border-[#1D1D1F] hover:text-[#1D1D1F] transition-all duration-150"
            title="Reset view"
          >
            ⟲
          </button>
        )}
      </div>

      {zoom !== 1 && (
        <div className="absolute top-2 right-2 text-[10px] text-[#C4C4C4] font-[family-name:var(--font-dm-mono)]">
          {Math.round(zoom * 100)}%
        </div>
      )}
    </div>
  );
}
