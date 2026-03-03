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
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex justify-end"
                >
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-shift5-dark/40 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    {/* Main Panel */}
                    <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", damping: 30, stiffness: 300, mass: 0.8 }}
                        className="relative w-full max-w-[480px] h-full bg-[#dcdcdc] shadow-2xl flex flex-col overflow-hidden"
                    >
                        {/* Header / Close */}
                        <div className="p-8 pb-4 flex justify-end">
                            <button
                                onClick={onClose}
                                className="flex items-center gap-2 text-shift5-dark/60 hover:text-shift5-dark transition-colors group"
                            >
                                <X size={18} className="group-hover:rotate-90 transition-transform duration-300" />
                                <span className="text-[10px] font-mono font-bold tracking-[0.2em] uppercase">Close</span>
                            </button>
                        </div>

                        {/* Navigation Section */}
                        <div className="flex-1 flex flex-col px-12 py-12 justify-center">
                            <nav className="space-y-6">
                                {tabs.map((tab, idx) => {
                                    return (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)}
                                            className={`block w-full text-left group transition-all duration-300 ${activeTab === tab.id
                                                    ? "text-shift5-dark"
                                                    : "text-shift5-dark/40 hover:text-shift5-dark/70"
                                                }`}
                                        >
                                            <div className="flex items-start gap-1">
                                                <span className="text-4xl sm:text-6xl font-black uppercase tracking-tighter leading-[0.9]">
                                                    {tab.id === "VIBE" && "Platform"}
                                                    {tab.id === "PATH" && "Journey"}
                                                    {tab.id === "DIAG" && "Systems"}
                                                    {tab.id === "LABS" && "Insights"}
                                                </span>
                                                <span className="text-xs font-mono font-bold mt-1 text-shift5-orange">
                                                    {idx + 1}
                                                </span>
                                            </div>
                                        </button>
                                    );
                                })}
                            </nav>
                        </div>

                        {/* Bottom Content / Details (Conditional based on activeTab) */}
                        <div className="px-12 py-12 border-t border-black/5 bg-black/5">
                            <AnimatePresence mode="wait">
                                {activeTab === "VIBE" && (
                                    <motion.div
                                        key="vibe-detail"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="space-y-4"
                                    >
                                        <div className="flex justify-between items-end">
                                            <span className="text-[10px] font-mono font-bold text-shift5-dark/40 uppercase tracking-widest">Signal_Chaos</span>
                                            <span className="text-xl font-black text-shift5-dark">{chaos}%</span>
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
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="flex justify-between items-center"
                                    >
                                        <span className="text-[10px] font-mono font-bold text-shift5-dark/40 uppercase tracking-widest">Active_History</span>
                                        <span className="text-xl font-black text-shift5-dark">{history.length} Nodes</span>
                                    </motion.div>
                                )}

                                {activeTab === "DIAG" && (
                                    <motion.div
                                        key="diag-detail"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="flex items-center gap-4"
                                    >
                                        <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]" />
                                        <span className="text-[10px] font-mono font-bold text-shift5-dark/60 uppercase tracking-widest">Telemetry_Stable_OK</span>
                                    </motion.div>
                                )}

                                {activeTab === "LABS" && (
                                    <motion.div
                                        key="labs-detail"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="flex items-center justify-between"
                                    >
                                        <span className="text-[10px] font-mono font-bold text-shift5-dark/40 uppercase tracking-widest">Tactical_Override</span>
                                        <button
                                            onClick={() => setHighContrast(!highContrast)}
                                            className={`text-[10px] font-mono font-bold uppercase tracking-widest px-3 py-1 border-2 transition-colors ${highContrast ? 'bg-shift5-dark border-shift5-dark text-white' : 'border-shift5-dark/10 text-shift5-dark/40'
                                                }`}
                                        >
                                            {highContrast ? "ON" : "OFF"}
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
