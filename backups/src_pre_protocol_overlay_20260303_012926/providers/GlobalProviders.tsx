"use client";

import { AudioProvider } from "@/contexts/AudioContext";
import { AuthProvider } from "./AuthProvider";
import { JourneyProvider } from "@/contexts/JourneyContext";
import GlobalPlayer from "@/components/GlobalPlayer";

export function GlobalProviders({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            <JourneyProvider>
                <AudioProvider>
                    {children}
                    <GlobalPlayer />
                </AudioProvider>
            </JourneyProvider>
        </AuthProvider>
    );
}
