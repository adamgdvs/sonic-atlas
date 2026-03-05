"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { Activity, Radio, TrendingUp, Users, Zap } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface ScanEvent {
    id: string;
    artistName: string;
    createdAt: string;
}

interface TrendingArtist {
    artistName: string;
    scanCount: number;
}

interface Stats {
    totalScans: number;
    uniqueArtists: number;
    recentScans: number;
}

function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const seconds = Math.floor(diff / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
}

export default function FrequencyPage() {
    const [scans, setScans] = useState<ScanEvent[]>([]);
    const [trending, setTrending] = useState<TrendingArtist[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [isLive, setIsLive] = useState(true);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const [newIds, setNewIds] = useState<Set<string>>(new Set());

    const fetchData = useCallback(async (isRefresh = false) => {
        try {
            const [recentRes, trendingRes, statsRes] = await Promise.all([
                fetch("/api/feed?type=recent"),
                fetch("/api/feed?type=trending"),
                fetch("/api/feed?type=stats"),
            ]);
            const [recentData, trendingData, statsData] = await Promise.all([
                recentRes.json(),
                trendingRes.json(),
                statsRes.json(),
            ]);

            if (isRefresh && recentData.scans) {
                // Highlight new entries
                const currentIds = new Set(scans.map((s: ScanEvent) => s.id));
                const freshIds = new Set<string>();
                recentData.scans.forEach((s: ScanEvent) => {
                    if (!currentIds.has(s.id)) freshIds.add(s.id);
                });
                if (freshIds.size > 0) {
                    setNewIds(freshIds);
                    setTimeout(() => setNewIds(new Set()), 2000);
                }
            }

            setScans(recentData.scans || []);
            setTrending(trendingData.trending || []);
            setStats(statsData.stats || null);
        } catch { /* ignore */ }
    }, [scans]);

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (isLive) {
            intervalRef.current = setInterval(() => fetchData(true), 15000);
        }
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isLive, fetchData]);

    return (
        <div className="min-h-screen bg-shift5-dark text-white selection:bg-shift5-orange/30">
            <Header />

            {/* Background Decorative Grid */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.02] overflow-hidden z-0">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#888_1px,transparent_1px),linear-gradient(to_bottom,#888_1px,transparent_1px)] bg-[size:40px_40px]" />
            </div>

            <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pt-24 pb-16">
                {/* Header Section */}
                <div className="mb-12">
                    <div className="flex items-center gap-3 mb-4">
                        <Radio size={14} className="text-shift5-orange" />
                        <span className="text-[9px] font-mono text-white/30 uppercase tracking-[0.3em]">
                            LIVE_INTELLIGENCE // GLOBAL_NETWORK
                        </span>
                    </div>
                    <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight mb-4">
                        GLOBAL FREQUENCY<span className="text-shift5-orange">_</span>HUB
                    </h1>
                    <p className="text-[11px] font-mono text-white/30 uppercase tracking-wider max-w-lg">
                        Real-time signal monitoring of the collective discovery network. Every scan, every signal, tracked and visualized.
                    </p>
                </div>

                {/* System Stats Bar */}
                {stats && (
                    <div className="grid grid-cols-3 gap-4 mb-10 p-4 border border-white/10 bg-white/[0.02]">
                        <div className="text-center">
                            <div className="text-[9px] font-mono text-white/30 uppercase tracking-widest mb-1 flex items-center justify-center gap-1.5">
                                <Zap size={10} />
                                Total_Scans
                            </div>
                            <div className="text-xl sm:text-2xl font-black text-shift5-orange font-mono">
                                {stats.totalScans.toLocaleString()}
                            </div>
                        </div>
                        <div className="text-center">
                            <div className="text-[9px] font-mono text-white/30 uppercase tracking-widest mb-1 flex items-center justify-center gap-1.5">
                                <Users size={10} />
                                Unique_Nodes
                            </div>
                            <div className="text-xl sm:text-2xl font-black text-white font-mono">
                                {stats.uniqueArtists.toLocaleString()}
                            </div>
                        </div>
                        <div className="text-center">
                            <div className="text-[9px] font-mono text-white/30 uppercase tracking-widest mb-1 flex items-center justify-center gap-1.5">
                                <Activity size={10} />
                                Last_24h
                            </div>
                            <div className="text-xl sm:text-2xl font-black text-green-400 font-mono">
                                {stats.recentScans.toLocaleString()}
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Signal Ticker (2/3 width) */}
                    <div className="lg:col-span-2">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <h2 className="text-[11px] font-mono font-bold text-white/60 uppercase tracking-[0.2em]">
                                    Signal_Ticker
                                </h2>
                                {isLive && (
                                    <span className="flex items-center gap-1.5 text-[8px] font-mono text-green-400 uppercase tracking-wider">
                                        <span className="relative flex h-2 w-2">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                                        </span>
                                        LIVE
                                    </span>
                                )}
                            </div>
                            <button
                                onClick={() => setIsLive(!isLive)}
                                className={`text-[9px] font-mono uppercase tracking-wider px-3 py-1 border transition-all cursor-pointer ${isLive
                                    ? "border-green-500/30 text-green-400 hover:bg-green-500/10"
                                    : "border-white/10 text-white/30 hover:text-white/50"
                                    }`}
                            >
                                {isLive ? "PAUSE_FEED" : "RESUME_FEED"}
                            </button>
                        </div>

                        <div className="border border-white/10 bg-white/[0.02] divide-y divide-white/5 max-h-[600px] overflow-y-auto font-mono">
                            {scans.length === 0 ? (
                                <div className="p-12 text-center text-mono">
                                    <div className="text-[10px] font-mono text-white/20 uppercase tracking-wider animate-pulse">
                                        AWAITING_SIGNALS...
                                    </div>
                                    <div className="text-[9px] font-mono text-white/10 mt-2">
                                        Scan an artist to broadcast your first signal
                                    </div>
                                </div>
                            ) : (
                                scans.map((scan: ScanEvent) => (
                                    <Link
                                        key={scan.id}
                                        href={`/artist/${encodeURIComponent(scan.artistName)}`}
                                        className={`flex items-center gap-4 px-4 py-3 hover:bg-white/[0.03] transition-all no-underline group ${newIds.has(scan.id) ? "bg-shift5-orange/10 animate-pulse" : ""
                                            }`}
                                    >
                                        <span className="text-[9px] font-mono text-shift5-orange/60 font-bold shrink-0">
                                            SIGNAL_DETECTED
                                        </span>
                                        <span className="text-[9px] font-mono text-white/20">
                                            //
                                        </span>
                                        <span className="text-[11px] font-mono text-white/80 font-bold uppercase tracking-wider group-hover:text-shift5-orange transition-colors truncate">
                                            {scan.artistName}
                                        </span>
                                        <span className="ml-auto text-[8px] font-mono text-white/20 shrink-0">
                                            {timeAgo(scan.createdAt)}
                                        </span>
                                    </Link>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Trending Panel (1/3 width) */}
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <TrendingUp size={12} className="text-shift5-orange" />
                            <h2 className="text-[11px] font-mono font-bold text-white/60 uppercase tracking-[0.2em]">
                                Trending_24h
                            </h2>
                        </div>

                        <div className="border border-white/10 bg-white/[0.02] divide-y divide-white/5 font-mono">
                            {trending.length === 0 ? (
                                <div className="p-8 text-center">
                                    <div className="text-[10px] font-mono text-white/20 uppercase tracking-wider">
                                        NO_DATA_YET
                                    </div>
                                </div>
                            ) : (
                                trending.map((t: TrendingArtist, i: number) => (
                                    <Link
                                        key={t.artistName}
                                        href={`/artist/${encodeURIComponent(t.artistName)}`}
                                        className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.03] transition-all no-underline group"
                                    >
                                        <span className={`text-[14px] font-black font-mono w-6 text-right ${i === 0 ? "text-shift5-orange" : i < 3 ? "text-white/50" : "text-white/20"
                                            }`}>
                                            {(i + 1).toString().padStart(2, '0')}
                                        </span>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-[11px] font-mono text-white/80 font-bold uppercase tracking-wider group-hover:text-shift5-orange transition-colors truncate">
                                                {t.artistName}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1 shrink-0">
                                            <Zap size={10} className="text-shift5-orange/60" />
                                            <span className="text-[10px] font-mono font-bold text-white/40">
                                                {t.scanCount}
                                            </span>
                                        </div>
                                    </Link>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}

