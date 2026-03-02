"use client";

import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-white flex flex-col">
            <Header />

            <main className="flex-1 max-w-[800px] mx-auto px-5 sm:px-10 py-16 sm:py-24">
                <h1
                    className="text-3xl sm:text-5xl font-semibold text-[#1D1D1F] mb-6 sm:mb-8"
                    style={{ letterSpacing: "-0.04em" }}
                >
                    About Sonic Atlas
                </h1>

                <div className="space-y-6 sm:space-y-8 text-[15px] sm:text-[17px] text-[#6B7280] leading-relaxed">
                    <p>
                        Sonic Atlas is an experimental open-source music discovery engine designed
                        to physically map the hidden constellations of the musical universe.
                    </p>
                    <p>
                        Unlike modern streaming platforms that rely heavily on machine-learning algorithms
                        and engagement loops to feed you repetitive "mixes", this platform strips back
                        the opacity. We rely entirely on <span className="text-[#1D1D1F] font-medium">user-generated micro-genres</span> crowdsourced
                        from robust global databases like Last.fm to formulate physical connections.
                    </p>

                    <h2 className="text-xl sm:text-2xl font-semibold text-[#1D1D1F] pt-4" style={{ letterSpacing: "-0.02em" }}>
                        The Architecture of Sound
                    </h2>
                    <p>
                        When you search for an artist, the engine generates an interactive constellation map
                        placing the artist at the center. Similar artists are charted in orbit around them,
                        positioned and colored based entirely on the mathematical overlap of hyper-specific
                        tags.
                    </p>
                    <p>
                        The magic lies in the <span className="text-[#1D1D1F] font-medium">micro-genres</span>.
                        Isolating a niche tag like <span className="italic">"dream pop"</span> or <span className="italic">"oxford indie"</span> allows you
                        to filter the noise. Clicking on a specific genre immediately collapses the map to
                        show only artists who share that exact sonic signature, giving you total agency to explore.
                    </p>

                    <h2 className="text-xl sm:text-2xl font-semibold text-[#1D1D1F] pt-4" style={{ letterSpacing: "-0.02em" }}>
                        My Atlas
                    </h2>
                    <p>
                        By bookmarking artists along your journey, the application generates a personalized
                        macro-constellation under the &quot;My Atlas&quot; page. Here, you can watch all your heavily-curated, isolated finds organically clump together into
                        gravitational systems based on shared musical DNA, visually mapping your unique taste profile.
                    </p>

                    <div className="pt-8 mt-12 border-t border-[#F0F0F0]">
                        <Link
                            href="/"
                            className="inline-flex items-center justify-center text-sm font-semibold border border-[#E5E5E5] bg-white text-[#1D1D1F] transition-all hover:bg-[#1D1D1F] hover:text-white hover:border-[#1D1D1F]"
                            style={{
                                padding: "10px 24px",
                                letterSpacing: "0.01em",
                            }}
                        >
                            Start Exploring
                        </Link>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
