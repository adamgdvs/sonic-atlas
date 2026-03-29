"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";

function LoginContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const callbackUrl = searchParams.get("callbackUrl") || "/my-atlas";

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [mode, setMode] = useState<"signin" | "signup">("signin");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            const res = await signIn("credentials", {
                redirect: false,
                email,
                password,
                callbackUrl,
            });

            if (res?.error) {
                setError("Invalid email or password");
            } else {
                router.push(callbackUrl);
                router.refresh();
            }
        } catch (err) {
            setError("An unexpected error occurred. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="min-h-screen flex items-center justify-center bg-shift5-dark relative overflow-hidden selection:bg-shift5-orange/30">
            {/* Background Grid Decoration */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.03] overflow-hidden z-0">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)] bg-[size:30px_30px]" />
            </div>

            {/* Decorative Identifying Text */}
            <div className="absolute top-0 right-0 text-[180px] font-bold text-white/[0.02] select-none leading-none pointer-events-none uppercase mr-[-40px] mt-[-40px] font-mono">
                AUTH
            </div>
            <div className="absolute bottom-0 left-0 text-[180px] font-bold text-white/[0.02] select-none leading-none pointer-events-none uppercase ml-[-40px] mb-[-40px] font-mono">
                IDENT
            </div>

            {/* Navigation */}
            <div className="absolute top-8 left-8 z-20">
                <Link
                    href="/"
                    className="flex items-center gap-3 text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-white/40 hover:text-shift5-orange transition-all group"
                >
                    <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                    [ Return_To_Atlas ]
                </Link>
            </div>

            <div className="w-full max-w-[440px] px-6 z-10">
                <div className="mb-10">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-shift5-orange flex items-center justify-center text-shift5-dark">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 18v-6a9 9 0 0 1 18 0v6"></path><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path></svg>
                        </div>
                        <span className="text-[10px] font-mono font-bold text-shift5-orange uppercase tracking-[0.3em]">System_Access // Level_01</span>
                    </div>

                    <h1 className="text-4xl md:text-5xl font-bold text-white uppercase tracking-tighter leading-none mb-4 font-mono">
                        {mode === "signin" ? "Sign_In" : "Register_Node"}
                    </h1>
                    <p className="text-white/40 text-[11px] font-mono uppercase tracking-tight max-w-[300px] border-l border-shift5-orange/30 pl-4">
                        {mode === "signin"
                            ? "Authentication required for secure exploration map access."
                            : "Initialize your identity to synchronize with the Atlas constellation."}
                    </p>
                </div>

                <div className="bg-white/[0.03] p-8 md:p-10 border border-white/10 backdrop-blur-md relative group/form">
                    {/* Corner accents */}
                    <div className="absolute -top-px -left-px w-4 h-4 border-t border-l border-shift5-orange" />
                    <div className="absolute -bottom-px -right-px w-4 h-4 border-b border-right border-white/20 group-hover/form:border-shift5-orange transition-colors" />

                    <form onSubmit={handleSubmit} className="space-y-6 text-left">
                        <div className="space-y-2">
                            <label htmlFor="login-email" className="block text-[10px] font-mono font-bold text-white/30 uppercase tracking-[0.2em] ml-1">Identity_Email</label>
                            <input
                                id="login-email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="NODE_ID@SONICATLAS.IO"
                                required
                                className="w-full h-14 px-5 bg-white/[0.02] border border-white/10 text-[14px] font-mono text-white placeholder:text-white/10 focus:outline-none focus:border-shift5-orange/50 focus:bg-white/[0.05] transition-all uppercase tracking-tight"
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="login-password" className="block text-[10px] font-mono font-bold text-white/30 uppercase tracking-[0.2em] ml-1">Access_Hash</label>
                            <input
                                id="login-password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                className="w-full h-14 px-5 bg-white/[0.02] border border-white/10 text-[14px] font-mono text-white placeholder:text-white/10 focus:outline-none focus:border-shift5-orange/50 focus:bg-white/[0.05] transition-all uppercase tracking-tight"
                            />
                        </div>

                        {error && (
                            <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 text-[11px] font-mono uppercase tracking-tight flex items-center gap-3 animate-pulse">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                                Sync_Error: {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`w-full h-14 mt-4 font-mono font-bold text-[12px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all duration-300 relative overflow-hidden ${isLoading
                                    ? 'bg-white/5 text-white/20 cursor-not-allowed'
                                    : 'bg-shift5-orange text-shift5-dark hover:bg-white hover:text-shift5-dark shadow-[0_0_20px_rgba(255,88,65,0.2)] hover:shadow-[0_0_30px_rgba(255,255,255,0.1)]'
                                }`}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    Authenticating...
                                </>
                            ) : (
                                <>
                                    {mode === "signin" ? "[ Begin_Sync ]" : "[ Initialize_Node ]"}
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 pt-8 border-t border-white/5 text-center">
                        <button
                            type="button"
                            onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(""); }}
                            className="text-[10px] font-mono text-white/30 hover:text-shift5-orange uppercase tracking-[0.2em] transition-colors"
                        >
                            {mode === "signin"
                                ? "No metadata found? // Register new identity"
                                : "Identity exists? // Switch to secure login"}
                        </button>
                    </div>
                </div>
            </div>
        </main>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#FAFAFA]" />}>
            <LoginContent />
        </Suspense>
    );
}
