"use client";

import Link from "next/link";
import { useJourney } from "@/contexts/JourneyContext";

export default function Breadcrumbs() {
    const { path } = useJourney();

    if (path.length === 0) return null;

    return (
        <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap px-4 sm:px-10 py-3 bg-[#FCFCFC] border-b border-[#F0F0F0] text-xs hide-scrollbar w-full">
            {path.map((node, i) => {
                const isLast = i === path.length - 1;

                return (
                    <div key={`${node.url}-${i}`} className="flex items-center gap-2">
                        <Link
                            href={node.url}
                            className={`transition-colors duration-150 ${isLast
                                    ? "text-[#1D1D1F] font-semibold cursor-default"
                                    : "text-[#9CA3AF] hover:text-[#1D1D1F]"
                                }`}
                            onClick={(e) => {
                                if (isLast) e.preventDefault();
                            }}
                        >
                            {node.name}
                        </Link>
                        {!isLast && <span className="text-[#E5E5E5]">/</span>}
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
