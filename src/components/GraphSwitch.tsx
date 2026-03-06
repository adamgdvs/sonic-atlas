"use client";

import type { ConstellationNode } from "@/components/ConstellationGraph";
import ConstellationGraph from "@/components/ConstellationGraph";
import ResonanceGraph from "@/components/charts/ResonanceGraph";
import BubbleChart from "@/components/charts/BubbleChart";
import WordCloud from "@/components/charts/WordCloud";

export type GraphMode =
  | "resonance"
  | "cloud"
  | "constellation"
  | "bubble";

export const GRAPH_MODES: { key: GraphMode; label: string; description: string }[] = [
  { key: "resonance", label: "Resonance", description: "Concentric similarity bands" },
  { key: "cloud", label: "Word Cloud", description: "Artist names sized by match" },
  { key: "constellation", label: "Constellation", description: "Two-ring orbital layout" },
  { key: "bubble", label: "Bubble Chart", description: "Packed circles by similarity" },
];

interface GraphSwitchProps {
  center: string;
  centerGenres?: string[];
  similar: ConstellationNode[];
  highlightedId: string | null;
  onHover: (id: string | null) => void;
  onExplore: (name: string) => void;
  width?: number;
  height?: number;
}

export default function GraphSwitch({ center, centerGenres, similar, highlightedId, onHover, onExplore, width, height, mode = "resonance" as GraphMode }: GraphSwitchProps & { mode?: GraphMode }) {
  const props = { center, centerGenres, similar, highlightedId, onHover, onExplore, width, height };

  switch (mode) {
    case "resonance":
      return <ResonanceGraph {...props} />;
    case "bubble":
      return <BubbleChart {...props} />;
    case "constellation":
      return <ConstellationGraph {...props} />;
    case "cloud":
    default:
      return <WordCloud {...props} />;
  }
}
