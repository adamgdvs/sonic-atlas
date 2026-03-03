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
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8"
                >
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-shift5-dark/95 backdrop-blur-xl"
                        onClick={onClose}
                    />

                    {/* Grid Pattern Overlay */}
                    <div className="absolute inset-0 opacity-10 pointer-events-none bg-[linear-gradient(to_right,#888_1px,transparent_1px),linear-gradient(to_bottom,#888_1px,transparent_1px)] bg-[size:40px_40px]" />

                    {/* Main Container */}
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="relative w-full max-w-5xl h-[85vh] bg-shift5-dark border border-white/10 shadow-2xl flex flex-col sm:flex-row overflow-hidden"
                    >
                        {/* Left Sidebar - Navigation */}
                        <div className="w-full sm:w-64 border-b sm:border-b-0 sm:border-r border-white/10 flex flex-col bg-shift5-dark/50">
                            <div className="p-6 border-b border-white/10 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-shift5-orange animate-pulse" />
                                    <span className="text-[10px] font-mono font-bold text-white uppercase tracking-[0.3em]">Protocol_v1.0</span>
                                </div>
                            </div>

                            <nav className="flex-1 p-4 space-y-2">
                                {tabs.map((tab) => {
                                    const Icon = tab.icon;
                                    return (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)}
                                            className={`w-full flex items-center gap-4 px-4 py-4 border transition-all duration-300 group ${activeTab === tab.id
                                                    ? "bg-shift5-orange border-shift5-orange text-shift5-dark shadow-[0_0_20px_rgba(255,88,65,0.2)]"
                                                    : "bg-white/[0.02] border-white/5 text-white/40 hover:border-white/20 hover:text-white"
                                                }`}
                                        >
                                            <Icon size={16} className={activeTab === tab.id ? "text-shift5-dark" : "text-shift5-orange"} />
                                            <span className="text-[11px] font-mono font-bold uppercase tracking-widest">{tab.label}</span>
                                        </button>
                                    );
                                })}
                            </nav>

                            <div className="p-6 border-t border-white/10 mt-auto">
                                <button
                                    onClick={onClose}
                                    className="w-full py-4 border border-white/10 text-white/40 font-mono text-[10px] uppercase hover:bg-white/5 transition-colors"
                                >
                                    Terminate_Session [ESC]
                                </button>
                            </div>
                        </div>

                        {/* Right Side - Content Area */}
                        <div className="flex-1 flex flex-col min-w-0 bg-black/20">
                            {/* Header */}
                            <div className="px-8 py-6 border-b border-white/10 flex items-center justify-between">
                                <div>
                                    <h2 className="text-2xl font-bold text-white uppercase tracking-tighter leading-none mb-1">
                                        {activeTab === "VIBE" && "Discovery_Operational_Flow"}
                                        {activeTab === "PATH" && "Session_Journey_Manifest"}
                                        {activeTab === "DIAG" && "System_Hardware_Telemetry"}
                                        {activeTab === "LABS" && "Signal_Experimental_Unit"}
                                    </h2>
                                    <p className="text-[10px] font-mono text-white/20 uppercase tracking-widest">
                                        Status: Verified_Secure // Node: Atlas_Core
                                    </p>
                                </div>
                                <button onClick={onClose} className="p-2 text-white/20 hover:text-white transition-colors">
                                    <X size={24} />
                                </button>
                            </div>

                            {/* Scrollable Content */}
                            <div className="flex-1 overflow-y-auto p-8">
                                <AnimatePresence mode="wait">
                                    {activeTab === "VIBE" && (
                                        <motion.div
                                            key="vibe"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            className="space-y-12 max-w-2xl"
                                        >
                                            <div className="space-y-6">
                                                <div className="flex justify-between items-end">
                                                    <div>
                                                        <h3 className="text-white text-sm font-bold uppercase tracking-widest mb-1">Recommendation Chaos</h3>
                                                        <p className="text-[10px] font-mono text-white/30 uppercase">Sets the operational variance of neighbor nodes</p>
                                                    </div>
                                                    <span className="text-shift5-orange font-mono font-bold text-xl">{chaos}%</span>
                                                </div>
                                                <input
                                                    type="range"
                                                    min="0"
                                                    max="100"
                                                    value={chaos}
                                                    onChange={(e) => setChaos(parseInt(e.target.value))}
                                                    className="w-full accent-shift5-orange bg-white/5 h-1 appearance-none cursor-pointer"
                                                />
                                                <div className="flex justify-between text-[8px] font-mono text-white/20 uppercase tracking-widest">
                                                    <span>Stable_Signal</span>
                                                    <span>Experimental_Noise</span>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between p-6 bg-white/[0.02] border border-white/5 group hover:border-white/10 transition-colors">
                                                <div>
                                                    <h3 className="text-white text-sm font-bold uppercase tracking-widest mb-1">Persistent Protocols</h3>
                                                    <p className="text-[10px] font-mono text-white/30 uppercase">Locks current filters across all node transitions</p>
                                                </div>
                                                <button
                                                    onClick={() => setPersistence(!persistence)}
                                                    className={`w-12 h-6 border-2 flex items-center transition-all ${persistence ? "bg-shift5-orange border-shift5-orange" : "border-white/10 bg-white/5"}`}
                                                >
                                                    <motion.div
                                                        animate={{ x: persistence ? 24 : 2 }}
                                                        className={`w-4 h-4 shadow-sm ${persistence ? "bg-shift5-dark" : "bg-white/20"}`}
                                                    />
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}

                                    {activeTab === "PATH" && (
                                        <motion.div
                                            key="path"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            className="space-y-4"
                                        >
                                            <div className="flex items-center justify-between mb-8">
                                                <div className="flex items-center gap-4 text-white/60">
                                                    <History size={16} className="text-shift5-orange" />
                                                    <span className="text-[10px] font-mono uppercase tracking-[0.2em]">{history.length} Nodes_Identified</span>
                                                </div>
                                                <button
                                                    onClick={clearJourney}
                                                    className="text-[10px] font-mono text-shift5-orange/60 hover:text-shift5-orange uppercase tracking-widest transition-colors"
                                                >
                                                    [ Purge_Journey_Log ]
                                                </button>
                                            </div>

                                            <div className="space-y-2">
                                                {history.length === 0 ? (
                                                    <div className="py-20 text-center border-2 border-dashed border-white/5">
                                                        <p className="text-[10px] font-mono text-white/20 uppercase tracking-widest">Zero_Data_Points_Detected</p>
                                                    </div>
                                                ) : (
                                                    [...history].reverse().map((node, i) => (
                                                        <div key={i} className="flex items-center gap-6 p-4 bg-white/[0.01] border border-white/5 hover:border-white/10 group transition-all">
                                                            <span className="text-[10px] font-mono text-white/10 w-12 tracking-tighter">0{(history.length - i).toString().slice(-2)}</span>
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-3">
                                                                    <span className="text-white font-bold uppercase tracking-tight group-hover:text-shift5-orange transition-colors">{node.name}</span>
                                                                    <span className="text-[8px] font-mono text-white/20 uppercase bg-white/5 px-1.5 py-0.5">{node.type}</span>
                                                                </div>
                                                            </div>
                                                            <span className="text-[9px] font-mono text-white/20 uppercase">Signal_Link: Stable</span>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </motion.div>
                                    )}

                                    {activeTab === "DIAG" && (
                                        <motion.div
                                            key="diag"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            className="grid grid-cols-1 sm:grid-cols-2 gap-6"
                                        >
                                            <div className="p-6 border border-white/5 bg-white/[0.01] space-y-4">
                                                <div className="flex items-center gap-3 text-shift5-orange">
                                                    <Shield size={18} />
                                                    <h3 className="font-bold uppercase tracking-[0.2em] text-[11px]">Authentication_Status</h3>
                                                </div>
                                                <div className="space-y-1">
                                                    <div className="flex justify-between text-[10px] font-mono">
                                                        <span className="text-white/30 uppercase">User_Identity</span>
                                                        <span className="text-white uppercase truncate ml-4">{session?.user?.name || "Anonymous_Intel"}</span>
                                                    </div>
                                                    <div className="flex justify-between text-[10px] font-mono">
                                                        <span className="text-white/30 uppercase">Auth_Method</span>
                                                        <span className="text-white uppercase">{session ? 'OAuth_Secured' : 'NULL_ACCESS'}</span>
                                                    </div>
                                                    <div className="flex justify-between text-[10px] font-mono">
                                                        <span className="text-white/30 uppercase">Encryption_Link</span>
                                                        <span className="text-shift5-orange uppercase">Active_AES_256</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="p-6 border border-white/5 bg-white/[0.01] space-y-4">
                                                <div className="flex items-center gap-3 text-shift5-orange">
                                                    <Wifi size={18} />
                                                    <h3 className="font-bold uppercase tracking-[0.2em] text-[11px]">API_Telemetry</h3>
                                                </div>
                                                <div className="space-y-1">
                                                    <div className="flex justify-between text-[10px] font-mono">
                                                        <span className="text-white/30 uppercase">Spotify_Signal</span>
                                                        <span className="text-green-500 uppercase">NOMINAL</span>
                                                    </div>
                                                    <div className="flex justify-between text-[10px] font-mono">
                                                        <span className="text-white/30 uppercase">LastFM_Downlink</span>
                                                        <span className="text-green-500 uppercase">STABLE</span>
                                                    </div>
                                                    <div className="flex justify-between text-[10px] font-mono">
                                                        <span className="text-white/30 uppercase">Deezer_Stream</span>
                                                        <span className="text-green-500 uppercase">PING_OK</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}

                                    {activeTab === "LABS" && (
                                        <motion.div
                                            key="labs"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            className="space-y-6 max-w-2xl"
                                        >
                                            <div className="p-8 border border-shift5-orange/20 bg-shift5-orange/5 relative overflow-hidden group">
                                                <Zap className="absolute -right-4 -top-4 w-24 h-24 text-shift5-orange/5 rotate-12" />
                                                <div className="relative z-10 space-y-4">
                                                    <div className="text-[10px] font-mono text-shift5-orange uppercase tracking-[0.3em] font-bold">Experimental_Protocol // V1.0</div>
                                                    <h3 className="text-xl font-bold text-white uppercase tracking-tighter">Tactical High-Contrast Mode</h3>
                                                    <p className="text-[11px] font-mono text-white/50 leading-relaxed uppercase">Force the UI into an ultra-high visibility state utilizing Neon Cyan and Toxic Green frequencies for extreme environmental conditions.</p>
                                                    <button
                                                        onClick={() => setHighContrast(!highContrast)}
                                                        className={`mt-4 px-6 py-2 border font-mono text-[10px] font-bold uppercase tracking-widest transition-all ${highContrast ? 'bg-shift5-orange border-shift5-orange text-white shadow-[0_0_15px_rgba(255,88,65,0.4)]' : 'border-white/20 text-white/40 hover:border-white/40 hover:text-white'}`}
                                                    >
                                                        {highContrast ? "[ ENABLED ]" : "[ ACTIVATE_PROTOCOL ]"}
                                                    </button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Footer */}
                            <div className="p-8 border-t border-white/10 bg-shift5-dark/30 hidden sm:block">
                                <div className="flex flex-wrap gap-8 text-[9px] font-mono text-white/20 uppercase tracking-[0.2em]">
                                    <div className="flex items-center gap-2">
                                        <span className="w-1 h-1 bg-white/20 rounded-full" />
                                        USER_SEED: AFK-990-2
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="w-1 h-1 bg-white/20 rounded-full" />
                                        LATENCY: 12ms
                                    </div>
                                    <div className="flex items-center gap-2 text-shift5-orange/40">
                                        <span className="w-1 h-1 bg-shift5-orange/40 rounded-full animate-pulse" />
                                        SYNC_THREAD_98_ACTIVE
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
