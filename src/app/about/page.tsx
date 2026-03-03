"use client";

import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-shift5-dark text-white selection:bg-shift5-orange/30 flex flex-col">
            <Header />

            {/* Background Decorative Grid */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.02] overflow-hidden z-0">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#888_1px,transparent_1px),linear-gradient(to_bottom,#888_1px,transparent_1px)] bg-[size:40px_40px]" />
            </div>

            <main className="relative z-10 flex-1 max-w-[900px] mx-auto px-5 sm:px-10 py-16 sm:py-24">
                <div className="mb-12 border-b border-white/5 pb-8">
                    <div className="flex items-center gap-3 mb-4">
                        <span className="text-[10px] font-mono text-shift5-orange uppercase tracking-[0.2em] bg-shift5-orange/10 px-2 py-0.5 border border-shift5-orange/20">System_Manifesto</span>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-bold uppercase tracking-tighter leading-none mb-4">About Sonic_Atlas</h1>
                    <p className="text-[10px] font-mono text-white/20 uppercase tracking-widest">Version // 2.0.4.5</p>
                </div>

                <div className="space-y-8 text-sm md:text-base text-white/50 font-mono uppercase tracking-tight leading-relaxed">
                    <section className="border border-white/5 p-8 bg-white/[0.01]">
                        <p>
                            Sonic Atlas is an experimental open-source music discovery engine designed
                            to physically map the hidden constellations of the musical universe.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <div className="text-[10px] font-mono text-shift5-orange uppercase tracking-[0.2em]">01 // Architecture_of_Sound</div>
                        <h2 className="text-xl font-bold text-white uppercase tracking-tight">The Neural Mesh</h2>
                        <p>
                            Unlike modern streaming platforms that rely heavily on machine-learning algorithms
                            and engagement loops to feed you repetitive &quot;mixes&quot;, this platform strips back
                            the opacity. We rely entirely on <span className="text-white">user-generated micro-genres</span> crowdsourced
                            from robust global databases like Last.fm to formulate physical connections.
                        </p>
                        <p>
                            When you search for an artist, the engine generates an interactive constellation map
                            placing the artist at the center. Similar artists are charted in orbit around them,
                            positioned and colored based entirely on the mathematical overlap of hyper-specific
                            tags.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <div className="text-[10px] font-mono text-shift5-orange uppercase tracking-[0.2em]">02 // Macro_Constellations</div>
                        <h2 className="text-xl font-bold text-white uppercase tracking-tight">The Personal Atlas</h2>
                        <p>
                            By bookmarking artists along your journey, the application generates a personalized
                            macro-constellation under the &quot;My Atlas&quot; page. Here, you can watch all your heavily-curated, isolated finds organically clump together into
                            gravitational systems based on shared musical DNA, visually mapping your unique taste profile.
                        </p>
                    </section>

                    <div className="pt-12 border-t border-white/5">
                        <Link
                            href="/"
                            className="inline-flex items-center justify-center text-[11px] font-mono font-bold uppercase tracking-[0.2em] border border-shift5-orange bg-shift5-orange text-white transition-all hover:bg-transparent hover:text-shift5-orange px-8 py-4"
                        >
                            Initiate Exploration
                        </Link>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
