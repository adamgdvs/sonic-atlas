"use client";

import { AudioProvider } from "@/contexts/AudioContext";
import { AuthProvider } from "./AuthProvider";
import { JourneyProvider } from "@/contexts/JourneyContext";
import GlobalPlayer from "@/components/GlobalPlayer";
import { ToastProvider } from "@/components/ToastProvider";

export function GlobalProviders({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            <JourneyProvider>
                <AudioProvider>
                    <ToastProvider>
                        {children}
                        <GlobalPlayer />
                    </ToastProvider>
                </AudioProvider>
            </JourneyProvider>
        </AuthProvider>
    );
}
