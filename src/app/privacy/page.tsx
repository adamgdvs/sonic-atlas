import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-shift5-dark text-white selection:bg-shift5-orange/30">
            <Header />

            {/* Background Grid */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.03] overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#888_1px,transparent_1px),linear-gradient(to_bottom,#888_1px,transparent_1px)] bg-[size:40px_40px]" />
            </div>

            <main className="relative z-10 max-w-3xl mx-auto px-6 pt-24 pb-32">
                <span className="text-[10px] font-mono text-shift5-orange px-3 py-1 bg-shift5-orange/10 border border-shift5-orange/30 uppercase tracking-[0.3em] font-bold inline-block mb-6">
                    DATA_PROTOCOL // PRIVACY_DOC
                </span>
                <h1 className="text-4xl sm:text-6xl font-black uppercase tracking-tighter leading-none mb-4">
                    Privacy <span className="text-shift5-orange">Policy.</span>
                </h1>
                <p className="text-white/30 font-mono text-[10px] uppercase tracking-widest mb-16">
                    Last_Modified: March 2026 // Protocol_Version: 1.0
                </p>

                <div className="space-y-12 text-white/60 text-sm leading-relaxed">

                    <section>
                        <h2 className="text-[12px] font-mono font-bold text-white uppercase tracking-[0.15em] border-b border-shift5-orange/30 pb-2 mb-4">
                            1. Overview
                        </h2>
                        <p>
                            Sonic Atlas (&quot;the Platform&quot;) is committed to protecting your privacy. This policy explains what information we collect, how we use it, and your rights regarding your data. We believe in minimal data collection — we only gather what is necessary to provide the service.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-[12px] font-mono font-bold text-white uppercase tracking-[0.15em] border-b border-shift5-orange/30 pb-2 mb-4">
                            2. Information We Collect
                        </h2>

                        <div className="space-y-6">
                            <div>
                                <h3 className="text-[11px] font-mono text-white/80 uppercase tracking-widest mb-2">2.1 Account Information</h3>
                                <p>
                                    When you sign in via Google or GitHub, we receive your name, email address, and profile image from the authentication provider. This information is stored securely in our PostgreSQL database hosted on Neon.
                                </p>
                            </div>

                            <div>
                                <h3 className="text-[11px] font-mono text-white/80 uppercase tracking-widest mb-2">2.2 User-Generated Data</h3>
                                <p>
                                    We store data you create through the Platform, including:
                                </p>
                                <ul className="list-none space-y-2 mt-3 ml-4">
                                    {[
                                        "Bookmarked artists (artist name, image URL, and genres)",
                                        "Discovery settings (niche depth, result count) stored in your browser's localStorage",
                                    ].map((item, i) => (
                                        <li key={i} className="flex items-start gap-2">
                                            <span className="text-shift5-orange/50 mt-0.5 shrink-0">▸</span>
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div>
                                <h3 className="text-[11px] font-mono text-white/80 uppercase tracking-widest mb-2">2.3 Cached API Data</h3>
                                <p>
                                    To improve performance, we cache responses from third-party APIs (Last.fm, Discogs, Deezer, EveryNoise) in our database. This cached data contains publicly available artist metadata and is not linked to individual users.
                                </p>
                            </div>

                            <div>
                                <h3 className="text-[11px] font-mono text-white/80 uppercase tracking-widest mb-2">2.4 Automatically Collected Data</h3>
                                <p>
                                    We do not use analytics tracking, advertising pixels, or third-party cookies. Standard server logs may record your IP address and user agent string for security and operational purposes.
                                </p>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-[12px] font-mono font-bold text-white uppercase tracking-[0.15em] border-b border-shift5-orange/30 pb-2 mb-4">
                            3. How We Use Your Information
                        </h2>
                        <p>We use your information exclusively to:</p>
                        <ul className="list-none space-y-2 mt-3 ml-4">
                            {[
                                "Authenticate your identity and maintain your session",
                                "Store and retrieve your bookmarked artists",
                                "Display your name and avatar in the Platform interface",
                                "Improve Platform performance through API response caching",
                            ].map((item, i) => (
                                <li key={i} className="flex items-start gap-2">
                                    <span className="text-shift5-orange/50 mt-0.5 shrink-0">▸</span>
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                        <div className="mt-4 border border-shift5-orange/20 bg-shift5-orange/5 p-4">
                            <div className="text-[9px] font-mono text-shift5-orange uppercase tracking-widest font-bold mb-2">Important</div>
                            <p className="text-[12px] text-white/50">
                                We do not sell, rent, or share your personal information with advertisers or third-party marketing services. We do not build user profiles for advertising purposes.
                            </p>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-[12px] font-mono font-bold text-white uppercase tracking-[0.15em] border-b border-shift5-orange/30 pb-2 mb-4">
                            4. Data Storage & Security
                        </h2>
                        <p>
                            Your data is stored in a PostgreSQL database hosted by Neon (cloud-hosted, encrypted at rest). Authentication is handled by NextAuth.js using industry-standard OAuth 2.0 protocols. We do not store passwords directly — authentication is delegated to Google and GitHub.
                        </p>
                        <p className="mt-3">
                            Session tokens are stored as secure, HTTP-only cookies. All connections to the Platform are encrypted via HTTPS.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-[12px] font-mono font-bold text-white uppercase tracking-[0.15em] border-b border-shift5-orange/30 pb-2 mb-4">
                            5. Cookies & Local Storage
                        </h2>
                        <div className="border border-white/5 bg-white/[0.02] p-4">
                            <div className="text-[9px] font-mono text-shift5-orange uppercase tracking-widest font-bold mb-3">Storage_Manifest</div>
                            <div className="space-y-3 text-[11px]">
                                <div className="flex items-start gap-3">
                                    <span className="text-white/30 font-mono shrink-0 w-20">Cookies</span>
                                    <span className="text-white/50">Session token (next-auth.session-token) — required for authentication. HTTP-only, secure, same-site.</span>
                                </div>
                                <div className="flex items-start gap-3">
                                    <span className="text-white/30 font-mono shrink-0 w-20">localStorage</span>
                                    <span className="text-white/50">Discovery settings (niche depth, result count). Never transmitted to our servers.</span>
                                </div>
                            </div>
                        </div>
                        <p className="mt-4">
                            We do not use any third-party cookies, advertising cookies, or tracking technologies.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-[12px] font-mono font-bold text-white uppercase tracking-[0.15em] border-b border-shift5-orange/30 pb-2 mb-4">
                            6. Third-Party Services
                        </h2>
                        <p>
                            When you sign in with Google or GitHub, those services may collect data according to their own privacy policies. We encourage you to review:
                        </p>
                        <ul className="list-none space-y-2 mt-3 ml-4 text-[12px]">
                            <li className="flex items-start gap-2">
                                <span className="text-shift5-orange/50 mt-0.5 shrink-0">▸</span>
                                <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-shift5-orange hover:underline">Google Privacy Policy</a>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-shift5-orange/50 mt-0.5 shrink-0">▸</span>
                                <a href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement" target="_blank" rel="noopener noreferrer" className="text-shift5-orange hover:underline">GitHub Privacy Statement</a>
                            </li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-[12px] font-mono font-bold text-white uppercase tracking-[0.15em] border-b border-shift5-orange/30 pb-2 mb-4">
                            7. Your Rights
                        </h2>
                        <p>You have the right to:</p>
                        <ul className="list-none space-y-2 mt-3 ml-4">
                            {[
                                "Access the personal data we hold about you",
                                "Request deletion of your account and all associated data",
                                "Export your bookmarks and discovery data",
                                "Opt out of any future data collection by deleting your account",
                            ].map((item, i) => (
                                <li key={i} className="flex items-start gap-2">
                                    <span className="text-shift5-orange/50 mt-0.5 shrink-0">▸</span>
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                        <p className="mt-4">
                            To exercise any of these rights, contact us through the{" "}
                            <Link href="/help" className="text-shift5-orange hover:underline">Help page</Link>
                            {" "}or at <span className="text-shift5-orange">privacy@sonicatlas.io</span>.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-[12px] font-mono font-bold text-white uppercase tracking-[0.15em] border-b border-shift5-orange/30 pb-2 mb-4">
                            8. Children&apos;s Privacy
                        </h2>
                        <p>
                            Sonic Atlas is not directed at children under 13. We do not knowingly collect personal information from children. If you believe a child has provided us with personal data, please contact us and we will promptly delete it.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-[12px] font-mono font-bold text-white uppercase tracking-[0.15em] border-b border-shift5-orange/30 pb-2 mb-4">
                            9. Changes to This Policy
                        </h2>
                        <p>
                            We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated modification date. We will not materially reduce your rights under this policy without providing prominent notice.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-[12px] font-mono font-bold text-white uppercase tracking-[0.15em] border-b border-shift5-orange/30 pb-2 mb-4">
                            10. Contact
                        </h2>
                        <p>
                            For privacy-related inquiries, contact us at{" "}
                            <span className="text-shift5-orange">privacy@sonicatlas.io</span>{" "}
                            or through our{" "}
                            <Link href="/help" className="text-shift5-orange hover:underline">Help page</Link>.
                        </p>
                    </section>
                </div>

                {/* Cross-link */}
                <div className="mt-16 pt-8 border-t border-white/5 text-[10px] font-mono text-white/30 uppercase tracking-widest">
                    See also: <Link href="/terms" className="text-shift5-orange hover:underline">Srv_Protocol (Terms of Service)</Link>
                </div>
            </main>

            <Footer />
        </div>
    );
}
