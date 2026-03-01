"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { usePathname } from "next/navigation";

export interface JourneyNode {
    name: string;
    type: "artist" | "genre";
    url: string;
}

interface JourneyContextType {
    path: JourneyNode[];
    pushNode: (node: JourneyNode) => void;
    clearJourney: () => void;
}

const JourneyContext = createContext<JourneyContextType>({
    path: [],
    pushNode: () => { },
    clearJourney: () => { },
});

export function JourneyProvider({ children }: { children: React.ReactNode }) {
    const [path, setPath] = useState<JourneyNode[]>([]);
    const pathname = usePathname();

    // Reset journey when explicitly returning to home or My Atlas
    useEffect(() => {
        if (pathname === "/" || pathname === "/my-atlas") {
            setPath([]);
        }
    }, [pathname]);

    const pushNode = (node: JourneyNode) => {
        setPath((prev) => {
            // If we are pushing the same node we are already on, do nothing
            if (prev.length > 0 && prev[prev.length - 1].url === node.url) return prev;

            // If we are navigating *back* to a node already in the path, truncate the path to that node
            const existingIndex = prev.findIndex((n) => n.url === node.url);
            if (existingIndex !== -1) {
                return prev.slice(0, existingIndex + 1);
            }

            // Otherwise append up to a limit
            return [...prev, node].slice(-8); // Keep max 8 to prevent infinite wrapping
        });
    };

    const clearJourney = () => setPath([]);

    return (
        <JourneyContext.Provider value={{ path, pushNode, clearJourney }}>
            {children}
        </JourneyContext.Provider>
    );
}

export function useJourney() {
    return useContext(JourneyContext);
}
