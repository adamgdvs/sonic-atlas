"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";

export default function LoginPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const callbackUrl = searchParams.get("callbackUrl") || "/my-atlas";

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

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
                    <h1 className="text-3xl font-bold text-[#1D1D1F] tracking-tight mb-2" style={{ letterSpacing: "-0.03em" }}>Sign in to Sonic Atlas</h1>
                    <p className="text-[#6B7280] text-sm">Create an account instantly or log back in to access your personal exploration map.</p>
                </div>

                <div className="bg-white p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#F0F0F0]">
                    <form onSubmit={handleSubmit} className="space-y-4 text-left">
                        <div>
                            <label className="block text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-2">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="explorer@sonicatlas.com"
                                required
                                className="w-full h-12 px-4 rounded-xl bg-[#FAFAFA] border border-[#E5E5E5] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-2">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                className="w-full h-12 px-4 rounded-xl bg-[#FAFAFA] border border-[#E5E5E5] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                            />
                        </div>

                        {error && (
                            <div className="p-3 rounded-lg bg-red-50 text-red-600 border border-red-100 text-xs font-medium">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full h-12 mt-2 rounded-xl bg-[#1D1D1F] text-white font-medium text-sm flex items-center justify-center gap-2 hover:bg-black transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    Authenticating...
                                </>
                            ) : (
                                "Continue"
                            )}
                        </button>
                    </form>

                </div>
            </div>
        </main>
    );
}
