"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Activity, History, Settings, FlaskConical, Wifi, Shield, Zap } from "lucide-react";
import { useJourney } from "@/contexts/JourneyContext";
import { useSession } from "next-auth/react";

interface ProtocolOverlayProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function ProtocolOverlay({ isOpen, onClose }: ProtocolOverlayProps) {
    const [activeTab, setActiveTab] = useState<"VIBE" | "PATH" | "DIAG" | "LABS">("VIBE");
    const { history, clearJourney } = useJourney();
    const { data: session } = useSession();

    // Mock settings for now
    const [chaos, setChaos] = useState(40);
    const [persistence, setPersistence] = useState(true);
    const [highContrast, setHighContrast] = useState(false);

    // Close on Escape
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleEsc);
        return () => window.removeEventListener("keydown", handleEsc);
    }, [onClose]);

    const tabs = [
        { id: "VIBE", label: "01_VIBE_CTRL", icon: Settings },
        { id: "PATH", label: "02_PATH_LOG", icon: History },
        { id: "DIAG", label: "03_SYS_DIAG", icon: Activity },
        { id: "LABS", label: "04_SIGNAL_LABS", icon: FlaskConical },
    ] as const;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] pointer-events-none">
                    {/* Main Panel */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -20, x: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -20, x: 20 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="absolute top-24 right-6 w-full max-w-[400px] bg-[#dcdcdc] shadow-2xl overflow-hidden border border-black/5 pointer-events-auto"
                    >
                        {/* Header / Close */}
                        <div className="p-6 pb-2 flex justify-end">
                            <button
                                onClick={onClose}
                                className="flex items-center gap-2 text-shift5-dark/60 hover:text-shift5-dark transition-colors group"
                            >
                                <X size={14} className="group-hover:rotate-90 transition-transform duration-300" />
                                <span className="text-[9px] font-mono font-bold tracking-[0.2em] uppercase">Close</span>
                            </button>
                        </div>

                        {/* Navigation Section */}
                        <div className="px-10 py-6">
                            <nav className="space-y-4">
                                {tabs.map((tab, idx) => {
                                    return (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)}
                                            className={`block w-full text-left group transition-all duration-300 ${activeTab === tab.id
                                                    ? "text-shift5-dark"
                                                    : "text-shift5-dark/35 hover:text-shift5-dark/60"
                                                }`}
                                        >
                                            <div className="flex items-start gap-1">
                                                <span className="text-3xl sm:text-5xl font-black uppercase tracking-tighter leading-[0.85]">
                                                    {tab.id === "VIBE" && "Platform"}
                                                    {tab.id === "PATH" && "Journey"}
                                                    {tab.id === "DIAG" && "Systems"}
                                                    {tab.id === "LABS" && "Insights"}
                                                </span>
                                                <span className="text-[10px] font-mono font-bold mt-0.5 text-shift5-orange">
                                                    {idx + 1}
                                                </span>
                                            </div>
                                        </button>
                                    );
                                })}
                            </nav>
                        </div>

                        {/* Bottom Content / Details */}
                        <div className="px-10 py-8 border-t border-black/5 bg-black/5 min-h-[120px] flex flex-col justify-center">
                            <AnimatePresence mode="wait">
                                {activeTab === "VIBE" && (
                                    <motion.div
                                        key="vibe-detail"
                                        initial={{ opacity: 0, x: 5 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -5 }}
                                        className="space-y-3"
                                    >
                                        <div className="flex justify-between items-end">
                                            <span className="text-[9px] font-mono font-bold text-shift5-dark/40 uppercase tracking-widest">Signal_Chaos</span>
                                            <span className="text-lg font-black text-shift5-dark">{chaos}%</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0"
                                            max="100"
                                            value={chaos}
                                            onChange={(e) => setChaos(parseInt(e.target.value))}
                                            className="w-full accent-shift5-orange bg-black/10 h-1 appearance-none cursor-pointer"
                                        />
                                    </motion.div>
                                )}

                                {activeTab === "PATH" && (
                                    <motion.div
                                        key="path-detail"
                                        initial={{ opacity: 0, x: 5 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -5 }}
                                        className="space-y-3"
                                    >
                                        <div className="flex justify-between items-center">
                                            <span className="text-[9px] font-mono font-bold text-shift5-dark/40 uppercase tracking-widest">Active_Nodes</span>
                                            <span className="text-lg font-black text-shift5-dark">{history.length}</span>
                                        </div>
                                        <div className="flex gap-1 h-1 bg-black/5 rounded-full overflow-hidden">
                                            {Array.from({ length: Math.min(history.length, 20) }).map((_, i) => (
                                                <div key={i} className="flex-1 bg-shift5-orange/40 shadow-[0_0_8px_rgba(255,88,65,0.2)]" />
                                            ))}
                                        </div>
                                    </motion.div>
                                )}

                                {activeTab === "DIAG" && (
                                    <motion.div
                                        key="diag-detail"
                                        initial={{ opacity: 0, x: 5 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -5 }}
                                        className="flex items-center gap-3"
                                    >
                                        <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]" />
                                        <span className="text-[9px] font-mono font-bold text-shift5-dark/60 uppercase tracking-widest leading-none">Telemetry_Stable_PING_OK</span>
                                    </motion.div>
                                )}

                                {activeTab === "LABS" && (
                                    <motion.div
                                        key="labs-detail"
                                        initial={{ opacity: 0, x: 5 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -5 }}
                                        className="flex items-center justify-between"
                                    >
                                        <span className="text-[9px] font-mono font-bold text-shift5-dark/40 uppercase tracking-widest">Tactical_Mode</span>
                                        <button
                                            onClick={() => setHighContrast(!highContrast)}
                                            className={`text-[9px] font-mono font-bold uppercase tracking-widest px-2.5 py-1 border-2 transition-colors ${highContrast ? 'bg-shift5-dark border-shift5-dark text-white' : 'border-shift5-dark/10 text-shift5-dark/40'
                                                }`}
                                        >
                                            {highContrast ? "On" : "Off"}
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
