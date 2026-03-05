"use client";

import { useState, useEffect } from "react";
import type { TourStatus } from "@/lib/ticketmaster";

interface TourBadgeProps {
    artistName: string;
    compact?: boolean;
}

export default function TourBadge({ artistName, compact = false }: TourBadgeProps) {
    const [tourData, setTourData] = useState<TourStatus | null>(null);

    useEffect(() => {
        if (!artistName) return;
        fetch(`/api/artist/${encodeURIComponent(artistName)}/events`)
            .then(r => r.json())
            .then(data => setTourData(data))
            .catch(() => { });
    }, [artistName]);

    if (!tourData?.hasEvents) return null;

    // ─── Compact mode: small dot for similar artist cards ──────
    if (compact) {
        return (
            <span
                className="inline-flex items-center gap-1 text-[8px] font-mono font-bold uppercase tracking-wider text-green-400"
                title={`${tourData.eventCount} upcoming event${tourData.eventCount !== 1 ? "s" : ""}`}
            >
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                LIVE
            </span>
        );
    }

    // ─── Full mode: hero section badge ─────────────────────────
    const next = tourData.nextEvent;

    return (
        <a
            href={next?.url || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-3 px-4 py-2.5 border-2 border-green-500/50 bg-green-500/10 hover:bg-green-500/20 hover:border-green-400 transition-all cursor-pointer no-underline w-full"
        >
            <span className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
                </span>
                <span className="text-[10px] font-mono font-black text-green-500 uppercase tracking-[0.2em]">
                    TOUR_ACTIVE
                </span>
            </span>
            <span className="text-[9px] font-mono text-shift5-dark/40 uppercase">
        //
            </span>
            <span className="text-[9px] font-mono text-shift5-dark/60 uppercase tracking-wider font-bold">
                {tourData.eventCount} DATE{tourData.eventCount !== 1 ? "S" : ""}
            </span>
            {next && (
                <>
                    <span className="text-[9px] font-mono text-shift5-dark/40 uppercase">
            //
                    </span>
                    <span className="text-[9px] font-mono text-shift5-dark/50 uppercase tracking-wider truncate max-w-[200px] group-hover:text-shift5-dark/80 transition-colors">
                        NEXT: {next.city}
                    </span>
                </>
            )}
        </a>
    );
}
