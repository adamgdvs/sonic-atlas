"use client";

import type { ConstellationNode } from "@/components/ConstellationGraph";
import ConstellationGraph from "@/components/ConstellationGraph";
import BubbleChart from "@/components/charts/BubbleChart";
import WordCloud from "@/components/charts/WordCloud";

export type GraphMode =
  | "cloud"
  | "constellation"
  | "bubble";

export const GRAPH_MODES: { key: GraphMode; label: string; description: string }[] = [
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
  size?: number;
}

export default function GraphSwitch({ center, centerGenres, similar, highlightedId, onHover, onExplore, size = 320, mode = "cloud" as GraphMode }: GraphSwitchProps & { mode?: GraphMode }) {
  const props = { center, centerGenres, similar, highlightedId, onHover, onExplore, size };

  switch (mode) {
    case "bubble":
      return <BubbleChart {...props} />;
    case "constellation":
      return <ConstellationGraph {...props} />;
    case "cloud":
    default:
      return <WordCloud {...props} />;
  }
}
