import Link from "next/link";

export default function Footer() {
    return (
        <footer className="w-full border-t border-[#F0F0F0] bg-white py-8 mt-auto">
            <div className="max-w-[1200px] mx-auto px-4 sm:px-10 flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#9CA3AF]">
                <div className="mb-4 sm:mb-0 uppercase tracking-widest font-semibold">
                    © {new Date().getFullYear()} Sonic Atlas
                </div>
                <div className="flex items-center gap-6">
                    <Link href="/about" className="hover:text-[#1D1D1F] transition-colors">
                        About
                    </Link>
                    <Link href="/terms" className="hover:text-[#1D1D1F] transition-colors">
                        Terms of Service
                    </Link>
                    <Link href="/privacy" className="hover:text-[#1D1D1F] transition-colors">
                        Privacy Policy
                    </Link>
                </div>
            </div>
        </footer>
    );
}
