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
    HelpCircle,
    Bookmark,
    Sliders,
    AudioLines,
    Layers,
    Radio,
    Palette,
    Download
} from "lucide-react";

export default function HelpPage() {
    const sections = [
        {
            id: "SYSTEM_OVERVIEW",
            title: "SYSTEM_OVERVIEW",
            icon: <TerminalIcon size={16} className="text-shift5-orange" />,
            content: "Sonic Atlas is a tactical reconnaissance platform for navigating sonic neighborhoods and identifying relational similarities between artists. This system is designed for high-precision discovery and intelligence gathering across the global musical nexus.",
            tips: [
                "Use the search bar to locate any artist by name",
                "Click any similar artist node to begin a discovery chain",
                "Your browsing path is automatically tracked via breadcrumbs",
            ]
        },
        {
            id: "SIGNAL_IDENTIFICATION",
            title: "SIGNAL_IDENTIFICATION (SEARCH)",
            icon: <Search size={16} className="text-shift5-orange" />,
            content: "Use the primary search interface to locate specific artist signals or genre sectors. The system supports full-text search against the discovery database, returning matched nodes for immediate reconnaissance.",
            tips: [
                "Start typing to see instant suggestions",
                "Click an artist result to open their full profile",
                "Genre results link to dedicated genre pages with all associated artists",
            ]
        },
        {
            id: "CONSTELLATION_MAPPING",
            title: "CONSTELLATION_MAPPING (SIMILARITY)",
            icon: <MapIcon size={16} className="text-shift5-orange" />,
            content: "Each artist profile features a similarity constellation — a visual representation of neighboring signals. Closer nodes indicate higher relational confidence. Click any node to initiate deep-scan reconnaissance on that artist.",
            tips: [
                "Switch between Word Cloud, Constellation, and Bubble Chart views",
                "Hover over any node to see the artist name and primary genre",
                "Use the expand button to view the graph at full width",
                "Scroll to zoom in/out, drag to pan the constellation view",
            ]
        },
        {
            id: "DISCOVERY_PROTOCOLS",
            title: "DISCOVERY_PROTOCOLS (SURGE & RADIO)",
            icon: <Zap size={16} className="text-shift5-orange" />,
            content: "Initiate discovery via two primary protocols: [SURGE_RELAY] analyzes your current sector and identifies a random recommended signal within the same genre. [RADIO_MODE] creates a continuous identification stream, automatically playing similar signals after the current track terminates.",
            tips: [
                "Surge Relay (⚡) picks a random artist in the same genre and auto-plays their top track",
                "Radio Mode (📻) chains similar artists — when one track ends, the next similar artist plays automatically",
                "Both features require an active preview track to function",
            ]
        },
        {
            id: "PROTOCOL_MENU",
            title: "PROTOCOL_MENU (DISCOVERY CONTROLS)",
            icon: <Sliders size={16} className="text-shift5-orange" />,
            content: "The Protocol Menu provides direct control over the discovery algorithm and quick access to your saved data. Open it from the header to customize how the similarity engine behaves.",
            tips: [
                "Discovery tab: Adjust Niche Depth (10-100%) to control how strictly the algorithm filters for sonic similarity",
                "Discovery tab: Set Result Count (15/30/50) to control how many similar artists appear",
                "Quick Access tab: Jump to recent artists, view bookmarks, or export your session as JSON",
                "Taste Profile tab: See your genre fingerprint and use Surprise Protocol for random discovery",
            ]
        },
        {
            id: "INTELLIGENCE_DOSSIERS",
            title: "INTELLIGENCE_DOSSIERS (METADATA)",
            icon: <Scan size={16} className="text-shift5-orange" />,
            content: "All explored nodes include Metadata Scans (Dossiers) providing geographic origin, inception dates, and complete discography artifacts. Use the focused discography navigator to expand specific records for track-level metadata.",
            tips: [
                "Click any album to expand its full tracklist",
                "Play individual tracks via the ▶ button to preview 30-second clips",
                "Artist bios are sourced from Last.fm and can be expanded for full reading",
                "Genre tags below the artist name are clickable — they link to genre pages",
            ]
        },
        {
            id: "AUDIO_PLAYER",
            title: "AUDIO_PLAYER (PLAYBACK)",
            icon: <AudioLines size={16} className="text-shift5-orange" />,
            content: "The global audio player persists across all pages. It features a vinyl-style rotating album art, play/pause controls, a progress bar, and advanced discovery features like Surge Relay and Radio Mode.",
            tips: [
                "The player auto-hides after 5 seconds of inactivity — click the floating ♪ button to bring it back",
                "The close (×) button appears on hover over the player",
                "Progress is shown both as a bar and on the floating button's ring indicator",
                "Pausing the player will not auto-resume when navigating to a new page",
            ]
        },
        {
            id: "MY_ATLAS",
            title: "MY_ATLAS (YOUR COLLECTION)",
            icon: <Shield size={16} className="text-shift5-orange" />,
            content: "Artists can be bookmarked for persistent access. Your 'My Atlas' terminal serves as your personal discovery database, with a Taste DNA analyzer that maps your musical fingerprint in real-time.",
            tips: [
                "Bookmark any artist via the ★ button on their profile page",
                "Sort your collection by Date Added, Name (A→Z), or by Genre",
                "Click any Taste DNA bar to filter your collection to only that genre",
                "The artist drawer lets you deep-dive into any bookmarked artist without leaving My Atlas",
                "Click through similar artists within the drawer to chain discoveries",
            ]
        },
        {
            id: "GENRE_EXPLORATION",
            title: "GENRE_EXPLORATION (SECTORS)",
            icon: <Layers size={16} className="text-shift5-orange" />,
            content: "The genre exploration system maps the entire sonic landscape. Browse genre pages to discover all artists cataloged within a specific sonic sector, or use the global genre browser for a bird's-eye view.",
            tips: [
                "Each genre page lists artists with preview playback and bookmark functionality",
                "Genre tags on artist profiles are clickable links to their genre pages",
                "The Taste Profile in the Protocol Menu suggests genres you haven't explored yet",
            ]
        },
        {
            id: "KEYBOARD_SHORTCUTS",
            title: "SESSION_MANAGEMENT",
            icon: <Download size={16} className="text-shift5-orange" />,
            content: "Your browsing session is tracked automatically. You can export your discovery path as a JSON manifest via the Protocol Menu's Quick Access tab, preserving a record of every artist and genre you explored.",
            tips: [
                "Breadcrumbs at the top of each page show your current navigation path",
                "Click any breadcrumb node to jump back to that point in your session",
                "Export Session creates a downloadable JSON file of your entire browsing history",
                "Your Discovery settings (niche depth, result count) persist across sessions via localStorage",
            ]
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
                <div className="flex flex-col md:flex-row gap-8 md:gap-12">
                    {/* Navigation — horizontal scroll on mobile, sticky sidebar on desktop */}
                    <aside className="w-full md:w-64 shrink-0">
                        <div className="md:sticky md:top-24">
                            <div className="mb-4 md:mb-6 flex items-center gap-2">
                                <HelpCircle size={18} className="text-shift5-orange" />
                                <h1 className="text-[12px] font-mono font-bold tracking-[0.2em] text-white uppercase">
                                    OPERATIONAL_GUIDE
                                </h1>
                            </div>

                            {/* Mobile: Horizontal scrollable pills */}
                            <nav className="flex md:hidden gap-2 overflow-x-auto pb-3 -mx-6 px-6 scroll-smooth snap-x snap-mandatory no-scrollbar">
                                {sections.map((s) => (
                                    <button
                                        key={s.id}
                                        onClick={() => {
                                            document.getElementById(s.id)?.scrollIntoView({ behavior: "smooth" });
                                        }}
                                        className="shrink-0 snap-start py-1.5 px-3 text-[9px] font-mono text-white/50 hover:text-shift5-orange active:text-shift5-orange bg-white/5 hover:bg-white/10 border border-white/10 transition-all uppercase tracking-widest whitespace-nowrap"
                                    >
                                        {s.title.split(" ")[0]}
                                    </button>
                                ))}
                            </nav>

                            {/* Desktop: Vertical sidebar nav */}
                            <nav className="hidden md:flex flex-col gap-2 border-l border-white/10 ml-2">
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

                                <div className="space-y-6">
                                    <p className="text-white/70 leading-relaxed text-sm font-light">
                                        {section.content}
                                    </p>

                                    {/* Actionable Tips */}
                                    {section.tips && section.tips.length > 0 && (
                                        <div className="border border-white/5 bg-white/[0.02] p-5">
                                            <div className="text-[9px] font-mono text-shift5-orange uppercase tracking-widest font-bold mb-3">Quick_Tips</div>
                                            <ul className="space-y-2">
                                                {section.tips.map((tip, i) => (
                                                    <li key={i} className="flex items-start gap-2 text-[11px] text-white/40 leading-relaxed">
                                                        <span className="text-shift5-orange/60 mt-0.5 shrink-0">▸</span>
                                                        <span>{tip}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
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
