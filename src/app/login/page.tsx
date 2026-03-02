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
        <main className="min-h-screen flex items-center justify-center bg-[#FAFAFA] relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-blue-100 to-indigo-50 blur-[100px] rounded-full opacity-50 pointer-events-none" />

            {/* Navigation */}
            <div className="absolute top-6 left-6 z-20">
                <Link
                    href="/"
                    className="flex items-center gap-2 text-sm font-medium text-[#6B7280] hover:text-[#1D1D1F] transition-colors"
                >
                    <ArrowLeft size={16} />
                    Back to Atlas
                </Link>
            </div>

            <div className="w-full max-w-[400px] px-6 z-10">
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#1D1D1F] text-white mb-6 shadow-xl">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 18v-6a9 9 0 0 1 18 0v6"></path><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path></svg>
                    </div>
                    <h1 className="text-3xl font-bold text-[#1D1D1F] tracking-tight mb-2" style={{ letterSpacing: "-0.03em" }}>
                        {mode === "signin" ? "Sign in to Sonic Atlas" : "Create your Atlas"}
                    </h1>
                    <p className="text-[#6B7280] text-sm">
                        {mode === "signin"
                            ? "Log back in to access your personal exploration map."
                            : "Create an account instantly to start your journey."}
                    </p>
                </div>

                <div className="bg-white p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#F0F0F0]">
                    <form onSubmit={handleSubmit} className="space-y-4 text-left">
                        <div>
                            <label className="block text-[11px] font-bold text-[#86868B] uppercase tracking-widest mb-2 ml-1">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="explorer@sonicatlas.com"
                                required
                                className="w-full h-14 px-5 rounded-2xl bg-[#F5F5F7] border border-transparent text-[15px] font-medium text-[#1D1D1F] placeholder:text-[#A1A1A6] focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/30 transition-all shadow-[inset_0_1px_2px_rgb(0,0,0,0.02)]"
                            />
                        </div>

                        <div>
                            <label className="block text-[11px] font-bold text-[#86868B] uppercase tracking-widest mb-2 ml-1">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                className="w-full h-14 px-5 rounded-2xl bg-[#F5F5F7] border border-transparent text-[15px] font-medium text-[#1D1D1F] placeholder:text-[#A1A1A6] focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/30 transition-all shadow-[inset_0_1px_2px_rgb(0,0,0,0.02)]"
                            />
                        </div>

                        {error && (
                            <div className="p-4 rounded-xl bg-red-50 text-red-600 border border-red-100 text-sm font-semibold flex items-center gap-2">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full h-14 mt-6 rounded-2xl bg-[#1D1D1F] text-white font-semibold text-[15px] flex items-center justify-center gap-2 hover:bg-black hover:shadow-[0_8px_20px_rgb(0,0,0,0.12)] transition-all disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:shadow-none shadow-[0_4px_14px_0_rgb(0,0,0,0.08)]"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    {mode === "signin" ? "Authenticating..." : "Creating Account..."}
                                </>
                            ) : (
                                mode === "signin" ? "Sign In" : "Create Account"
                            )}
                        </button>
                    </form>

                    <div className="mt-8 text-center text-[13px] text-[#86868B] font-medium">
                        {mode === "signin" ? (
                            <>
                                Don't have an account?{' '}
                                <button type="button" onClick={() => { setMode("signup"); setError(""); }} className="text-[#1D1D1F] font-bold hover:underline">
                                    Sign up now
                                </button>
                            </>
                        ) : (
                            <>
                                Already have an account?{' '}
                                <button type="button" onClick={() => { setMode("signin"); setError(""); }} className="text-[#1D1D1F] font-bold hover:underline">
                                    Sign in instead
                                </button>
                            </>
                        )}
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
