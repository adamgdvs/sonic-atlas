"use client";

import { AudioProvider } from "@/contexts/AudioContext";
import { AuthProvider } from "./AuthProvider";

export function GlobalProviders({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            <AudioProvider>
                {children}
            </AudioProvider>
        </AuthProvider>
    );
}
