"use client";

import { useState, useEffect } from "react";
import type { TourStatus } from "@/lib/ticketmaster";

interface TourBadgeProps {
    artistName: string;
}

export default function TourBadge({ artistName }: TourBadgeProps) {
    const [tourData, setTourData] = useState<TourStatus | null>(null);

    useEffect(() => {
        if (!artistName) return;
        fetch(`/api/artist/${encodeURIComponent(artistName)}/events`)
            .then(r => r.json())
            .then(data => setTourData(data))
            .catch(() => { });
    }, [artistName]);

    if (!tourData?.hasEvents) return null;

    const next = tourData.nextEvent;

    return (
        <a
            href={next?.url || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-[9px] font-mono font-bold uppercase tracking-wider no-underline text-green-700 hover:text-green-900 transition-colors"
            title={`${tourData.eventCount} upcoming event${tourData.eventCount !== 1 ? "s" : ""}${next ? ` · Next: ${next.venue}, ${next.city}` : ""}`}
        >
            <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-600 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-600" />
            </span>
            ON_TOUR
        </a>
    );
}
