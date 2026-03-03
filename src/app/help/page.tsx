"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import {
    Scan,
    Map as MapIcon,
    Zap,
    Users,
    Search,
    Target,
    Terminal as TerminalIcon,
    Shield,
    HelpCircle
} from "lucide-react";

export default function HelpPage() {
    const sections = [
        {
            id: "SYSTEM_OVERVIEW",
            title: "SYSTEM_OVERVIEW",
            icon: <TerminalIcon size={16} className="text-shift5-orange" />,
            content: "Sonic Atlas is a tactical reconnaissance platform for navigating sonic neighborhoods and identifying relational similarities between artists. This system is designed for high-precision discovery and intelligence gathering across the global musical nexus.",
        },
        {
            id: "SIGNAL_IDENTIFICATION",
            title: "SIGNAL_IDENTIFICATION (SEARCH)",
            icon: <Search size={16} className="text-shift5-orange" />,
            content: "Use the primary search interface to locate specific artist signals or genre sectors. The system supports full-text search against the discovery database, returning matched nodes for immediate reconnaissance.",
        },
        {
            id: "CONSTELLATION_MAPPING",
            title: "CONSTELLATION_MAPPING (SIMILARITY)",
            icon: <MapIcon size={16} className="text-shift5-orange" />,
            content: "Each artist profile features a similarity constellation—a visual representation of neighboring signals. Closer nodes indicate higher relational confidence. Click any node to initiate deep-scan reconnaissance on that artist.",
        },
        {
            id: "DISCOVERY_PROTOCOLS",
            title: "DISCOVERY_PROTOCOLS (SURGE & RADIO)",
            icon: <Zap size={16} className="text-shift5-orange" />,
            content: "Initiate discovery via two primary protocols: [SURGE_RELAY] analyzes your current sector and identifies a random recommended signal within the same genre. [RADIO_MODE] creates a continuous identification stream, automatically playing similar signals after the current track terminates.",
        },
        {
            id: "INTELLIGENCE_DOSSIERS",
            title: "INTELLIGENCE_DOSSIERS (METADATA)",
            icon: <Scan size={16} className="text-shift5-orange" />,
            content: "All explored nodes include Metadata Scans (Dossiers) providing geographic origin, inception dates, and complete discography artifacts. Use the focused discography navigator to expand specific records for track-level metadata.",
        },
        {
            id: "MY_ATLAS",
            title: "MY_ATLAS (STORAGE)",
            icon: <Shield size={16} className="text-shift5-orange" />,
            content: "Signals can be bookmarked for persistent access. Your 'My Atlas' terminal serves as your personal discovery database, allowing you to quickly recall previously identified signals and manage your reconnaissance history.",
        },
    ];

    return (
        <div className="min-h-screen bg-shift5-dark text-white selection:bg-shift5-orange/30">
            <Header />

            {/* Background Decorative Grid */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.03] overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#888_1px,transparent_1px),linear-gradient(to_bottom,#888_1px,transparent_1px)] bg-[size:40px_40px]" />
            </div>

            <main className="relative z-10 max-w-6xl mx-auto px-6 pt-24 pb-32">
                <div className="flex flex-col md:flex-row gap-12">
                    {/* Navigation Sidebar */}
                    <aside className="w-full md:w-64 shrink-0">
                        <div className="sticky top-24">
                            <div className="mb-6 flex items-center gap-2">
                                <HelpCircle size={18} className="text-shift5-orange" />
                                <h1 className="text-[12px] font-mono font-bold tracking-[0.2em] text-white uppercase">
                                    OPERATIONAL_GUIDE
                                </h1>
                            </div>
                            <nav className="flex flex-col gap-2 border-l border-white/10 ml-2">
                                {sections.map((s) => (
                                    <button
                                        key={s.id}
                                        onClick={() => {
                                            document.getElementById(s.id)?.scrollIntoView({ behavior: "smooth" });
                                        }}
                                        className="text-left py-2 px-4 text-[10px] font-mono text-white/40 hover:text-shift5-orange hover:bg-white/5 transition-all uppercase tracking-widest"
                                    >
                                        -- {s.title}
                                    </button>
                                ))}
                            </nav>
                        </div>
                    </aside>

                    {/* Main Content */}
                    <div className="flex-1 space-y-24">
                        <header className="mb-20">
                            <span className="text-[10px] font-mono text-shift5-orange px-3 py-1 bg-shift5-orange/10 border border-shift5-orange/30 uppercase tracking-[0.3em] font-bold inline-block mb-6">
                                SYSTEM_ACCESS // DOCUMENTATION
                            </span>
                            <h2 className="text-4xl sm:text-6xl font-black uppercase tracking-tighter leading-none mb-8">
                                Navigating the <span className="text-shift5-orange">Atlas.</span>
                            </h2>
                            <p className="text-white/40 font-mono text-sm max-w-2xl">
                                This manual provides comprehensive documentation for the Sonic Atlas Discovery Interface.
                                Follow these protocols to maximize reconnaissance efficiency and signal identification.
                            </p>
                        </header>

                        {sections.map((section, idx) => (
                            <motion.section
                                key={section.id}
                                id={section.id}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                className="scroll-mt-32"
                            >
                                <div className="flex items-center gap-4 mb-6">
                                    {section.icon}
                                    <h3 className="text-[14px] font-mono font-bold tracking-[0.1em] uppercase text-white border-b border-shift5-orange pb-1">
                                        {section.title}
                                    </h3>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                                    <div className="space-y-6">
                                        <p className="text-white/70 leading-relaxed text-sm font-light">
                                            {section.content}
                                        </p>
                                        <div className="p-4 bg-white/[0.02] border border-white/5 font-mono text-[10px] text-white/30 uppercase tracking-[0.1em]">
                                            STATUS: Operational // Protocol_Active
                                        </div>
                                    </div>

                                    {/* Placeholder for User Screenshot */}
                                    <div className="aspect-video bg-white/5 border border-dashed border-white/10 flex flex-col items-center justify-center group hover:border-shift5-orange/30 transition-colors">
                                        <div className="flex flex-col items-center gap-4 opacity-30 group-hover:opacity-100 transition-opacity">
                                            <Target size={24} className="text-white/30 group-hover:text-shift5-orange transition-colors" />
                                            <span className="text-[9px] font-mono uppercase tracking-[0.2em]">
                                                [ PENDING_VISUAL_ARTIFACT_UPLOAD ]
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </motion.section>
                        ))}
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
