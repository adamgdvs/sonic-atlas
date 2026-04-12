import Link from "next/link";

export default function Footer() {
    return (
        <footer className="w-full border-t border-shift5-accent bg-shift5-dark py-6 sm:py-12 mt-auto pb-[max(24px,env(safe-area-inset-bottom))]">
            <div className="max-w-[1200px] mx-auto px-4 lg:px-10 flex flex-col md:flex-row items-center justify-between text-[10px] text-white/30 font-mono uppercase tracking-[0.1em]">
                <div className="mb-4 md:mb-0 flex items-center gap-4">
                    <span className="text-white/10 select-none">SHFT5_OS // V1.0.4</span>
                    <span className="text-white/20">|</span>
                    <span>© {new Date().getFullYear()} ATLAS_INTEL</span>
                </div>
                <div className="flex items-center gap-8">
                    <Link href="/about" className="hover:text-shift5-orange transition-colors">
                        Info_Log
                    </Link>
                    <Link href="/terms" className="hover:text-shift5-orange transition-colors">
                        Srv_Protocol
                    </Link>
                    <Link href="/privacy" className="hover:text-shift5-orange transition-colors">
                        Data_Policy
                    </Link>
                    <div className="hidden sm:flex items-center gap-2 text-shift5-orange/50">
                        <div className="w-1 h-1 bg-shift5-orange rounded-full animate-ping" />
                        <span>SYS_RUNNING</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
