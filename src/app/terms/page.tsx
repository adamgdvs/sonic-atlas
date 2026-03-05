import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-shift5-dark text-white selection:bg-shift5-orange/30">
            <Header />

            {/* Background Grid */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.03] overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#888_1px,transparent_1px),linear-gradient(to_bottom,#888_1px,transparent_1px)] bg-[size:40px_40px]" />
            </div>

            <main className="relative z-10 max-w-3xl mx-auto px-6 pt-24 pb-32">
                <span className="text-[10px] font-mono text-shift5-orange px-3 py-1 bg-shift5-orange/10 border border-shift5-orange/30 uppercase tracking-[0.3em] font-bold inline-block mb-6">
                    SYSTEM_PROTOCOL // LEGAL_DOC
                </span>
                <h1 className="text-4xl sm:text-6xl font-black uppercase tracking-tighter leading-none mb-4">
                    Terms of <span className="text-shift5-orange">Service.</span>
                </h1>
                <p className="text-white/30 font-mono text-[10px] uppercase tracking-widest mb-16">
                    Last_Modified: March 2026 // Protocol_Version: 1.0
                </p>

                <div className="space-y-12 text-white/60 text-sm leading-relaxed">

                    <section>
                        <h2 className="text-[12px] font-mono font-bold text-white uppercase tracking-[0.15em] border-b border-shift5-orange/30 pb-2 mb-4">
                            1. Acceptance of Terms
                        </h2>
                        <p>
                            By accessing or using Sonic Atlas (&quot;the Platform&quot;), you agree to be bound by these Terms of Service. If you do not agree to these terms, you should not use the Platform. Sonic Atlas is a music discovery and exploration tool that aggregates publicly available data from third-party music services.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-[12px] font-mono font-bold text-white uppercase tracking-[0.15em] border-b border-shift5-orange/30 pb-2 mb-4">
                            2. Description of Service
                        </h2>
                        <p>
                            Sonic Atlas provides a sonic intelligence interface for discovering and exploring musical artists, genres, and their relationships. The Platform aggregates data from publicly available APIs including Last.fm, Discogs, Deezer, and EveryNoise to generate artist profiles, similarity mappings, genre classifications, and audio previews.
                        </p>
                        <p className="mt-3">
                            Audio previews are provided by Deezer and are limited to 30-second samples. Full-length streaming is not available through this Platform. Sonic Atlas does not host or store audio content.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-[12px] font-mono font-bold text-white uppercase tracking-[0.15em] border-b border-shift5-orange/30 pb-2 mb-4">
                            3. User Accounts
                        </h2>
                        <p>
                            You may create an account using Google or GitHub authentication via NextAuth.js. By creating an account, you agree to provide accurate information and to keep your login credentials secure. You are responsible for all activity under your account.
                        </p>
                        <p className="mt-3">
                            Account features include bookmarking artists, personalized discovery settings, and access to the My Atlas dashboard. You may delete your account at any time by contacting us.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-[12px] font-mono font-bold text-white uppercase tracking-[0.15em] border-b border-shift5-orange/30 pb-2 mb-4">
                            4. Acceptable Use
                        </h2>
                        <p>You agree not to:</p>
                        <ul className="list-none space-y-2 mt-3 ml-4">
                            {[
                                "Scrape, crawl, or automatically extract data from the Platform at scale",
                                "Attempt to reverse-engineer, decompile, or disassemble any part of the Platform",
                                "Use the Platform for any unlawful purpose or in violation of any applicable laws",
                                "Interfere with or disrupt the Platform's infrastructure or other users' access",
                                "Circumvent any rate limiting, authentication, or access controls",
                            ].map((item, i) => (
                                <li key={i} className="flex items-start gap-2">
                                    <span className="text-shift5-orange/50 mt-0.5 shrink-0">▸</span>
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-[12px] font-mono font-bold text-white uppercase tracking-[0.15em] border-b border-shift5-orange/30 pb-2 mb-4">
                            5. Intellectual Property
                        </h2>
                        <p>
                            Artist metadata, images, and audio previews are sourced from third-party services and remain the property of their respective owners. Sonic Atlas does not claim ownership of any third-party content displayed on the Platform.
                        </p>
                        <p className="mt-3">
                            The Sonic Atlas interface, design, code, and branding are the intellectual property of Sonic Atlas and its contributors. You may not reproduce, distribute, or create derivative works from the Platform without permission.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-[12px] font-mono font-bold text-white uppercase tracking-[0.15em] border-b border-shift5-orange/30 pb-2 mb-4">
                            6. Third-Party Services
                        </h2>
                        <p>
                            The Platform relies on third-party APIs and services. Availability and accuracy of data from these services is not guaranteed. Sonic Atlas is not responsible for the content, policies, or practices of any third-party services.
                        </p>
                        <div className="mt-4 border border-white/5 bg-white/[0.02] p-4">
                            <div className="text-[9px] font-mono text-shift5-orange uppercase tracking-widest font-bold mb-2">Data_Sources</div>
                            <div className="text-[11px] text-white/40 space-y-1">
                                <p>▸ Last.fm — Artist information, tags, and similar artist data</p>
                                <p>▸ Discogs — Genre classifications, artist profiles, and discographies</p>
                                <p>▸ Deezer — Audio previews, album art, and streaming metadata</p>
                                <p>▸ EveryNoise — Micro-genre mapping and neighborhood analysis</p>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-[12px] font-mono font-bold text-white uppercase tracking-[0.15em] border-b border-shift5-orange/30 pb-2 mb-4">
                            7. Disclaimer of Warranties
                        </h2>
                        <p>
                            The Platform is provided &quot;as is&quot; and &quot;as available&quot; without warranties of any kind, either express or implied. We do not guarantee that the Platform will be uninterrupted, error-free, or free of harmful components. Similarity scores, genre classifications, and other algorithmic outputs are approximations and should not be considered definitive.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-[12px] font-mono font-bold text-white uppercase tracking-[0.15em] border-b border-shift5-orange/30 pb-2 mb-4">
                            8. Limitation of Liability
                        </h2>
                        <p>
                            To the maximum extent permitted by law, Sonic Atlas and its contributors shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of or inability to use the Platform.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-[12px] font-mono font-bold text-white uppercase tracking-[0.15em] border-b border-shift5-orange/30 pb-2 mb-4">
                            9. Changes to Terms
                        </h2>
                        <p>
                            We reserve the right to modify these Terms at any time. Changes will be posted on this page with an updated modification date. Continued use of the Platform after changes constitutes acceptance of the revised Terms.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-[12px] font-mono font-bold text-white uppercase tracking-[0.15em] border-b border-shift5-orange/30 pb-2 mb-4">
                            10. Contact
                        </h2>
                        <p>
                            For questions about these Terms, please reach out through the Platform&apos;s{" "}
                            <Link href="/help" className="text-shift5-orange hover:underline">Help page</Link>
                            {" "}or contact us at{" "}
                            <span className="text-shift5-orange">support@sonicatlas.io</span>.
                        </p>
                    </section>
                </div>

                {/* Cross-link */}
                <div className="mt-16 pt-8 border-t border-white/5 text-[10px] font-mono text-white/30 uppercase tracking-widest">
                    See also: <Link href="/privacy" className="text-shift5-orange hover:underline">Data_Policy (Privacy)</Link>
                </div>
            </main>

            <Footer />
        </div>
    );
}
