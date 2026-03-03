"use client";

import Link from "next/link";
import { useJourney, type JourneyNode } from "@/contexts/JourneyContext";

interface BreadcrumbsProps {
    onNodeClick?: (node: JourneyNode, index: number) => void;
}

export default function Breadcrumbs({ onNodeClick }: BreadcrumbsProps) {
    const { path } = useJourney();

    if (path.length === 0) return null;

    return (
        <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap px-4 sm:px-10 py-4 bg-shift5-dark/50 border-b border-white/5 text-[10px] uppercase font-mono tracking-widest hide-scrollbar w-full z-30 relative">
            {path.map((node, i) => {
                const isLast = i === path.length - 1;

                return (
                    <div key={`${node.url}-${i}`} className="flex items-center gap-2">
                        <Link
                            href={node.url}
                            className={`transition-colors duration-300 ${isLast
                                ? "text-shift5-orange cursor-default"
                                : "text-white/30 hover:text-white"
                                }`}
                            onClick={(e) => {
                                if (isLast) {
                                    e.preventDefault();
                                    return;
                                }

                                if (onNodeClick) {
                                    e.preventDefault();
                                    onNodeClick(node, i);
                                }
                            }}
                        >
                            {node.name}
                        </Link>
                        {!isLast && <span className="text-white/10">/</span>}
                    </div>
                );
            })}
            <style jsx>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
        </div>
    );
}
