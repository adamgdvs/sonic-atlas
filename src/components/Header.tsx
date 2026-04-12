"use client";

import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { useState, useEffect, useRef, useCallback } from "react";
import { Terminal, Menu, X, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ProtocolOverlay from "./ProtocolOverlay";
import SearchBar from "./SearchBar";

export default function Header() {
  const { data: session } = useSession();
  const [isProtocolOpen, setIsProtocolOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);

  const isHome = pathname === "/";

  // Close mobile menu on navigation
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Close mobile menu on outside click
  useEffect(() => {
    if (!isMobileMenuOpen) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isMobileMenuOpen]);

  return (
    <>
      <header className="border-b-2 border-shift5-accent bg-shift5-dark h-16 flex items-center justify-between px-4 sm:px-6 md:px-12 z-50 relative gap-4 md:gap-8">
        <div className="flex items-center gap-4 md:gap-8 flex-1 min-w-0">
          <Link href="/" className="flex items-center gap-2 sm:gap-3 no-underline group shrink-0">
            <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 bg-shift5-orange border-2 border-white/20 group-hover:scale-125 transition-all duration-300 shadow-[0_0_10px_rgba(255,88,65,0.4)]" />
            <span
              className="text-[12px] sm:text-[14px] md:text-[16px] font-black text-white font-mono uppercase tracking-[0.15em] sm:tracking-[0.2em] group-hover:text-shift5-orange transition-colors truncate"
            >
              sonic_//_atlas
            </span>
          </Link>

          {!isHome && (
            <div className="hidden lg:block w-full max-w-[320px] animate-fade-in">
              <SearchBar
                headerMode
                onSelectArtist={(name) => router.push(`/artist/${encodeURIComponent(name)}`)}
                onSelectGenre={(name) => router.push(`/genre/${encodeURIComponent(name)}`)}
              />
            </div>
          )}
        </div>

        {/* Desktop Nav */}
        <nav aria-label="Main navigation" className="hidden md:flex items-center gap-4 sm:gap-6 text-[10px] text-white/50 font-mono uppercase tracking-[0.05em] shrink-0">
          <button
            onClick={() => setIsProtocolOpen(!isProtocolOpen)}
            className="flex items-center gap-3 mr-4 border-r border-shift5-accent pr-6 group hover:text-white transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${isProtocolOpen ? 'bg-shift5-orange scale-125' : 'bg-shift5-orange animate-pulse'}`} />
              {isProtocolOpen ? 'HIDE_PROTOCOL' : 'SYSTEM_STATUS'}
            </span>
            <span className="text-white/20">|</span>
            <span className="flex items-center gap-2">
              <Terminal size={12} className={`text-shift5-orange ${isProtocolOpen ? 'animate-pulse' : 'group-hover:animate-pulse'}`} />
              {isProtocolOpen ? 'TERM_ACTIVE' : 'OPS: OK'}
            </span>
          </button>

          {session ? (
            <Link
              href="/my-atlas"
              className="cursor-pointer text-white/70 hover:text-white transition-colors no-underline border border-transparent hover:border-shift5-orange/50 px-2 py-0.5"
            >
              MY ATLAS
            </Link>
          ) : (
            <Link
              href="/genres"
              className="cursor-pointer text-white/70 hover:text-white transition-colors no-underline border border-transparent hover:border-shift5-orange/50 px-2 py-0.5"
            >
              GENRES
            </Link>
          )}

          <Link href="/about" className="cursor-pointer text-white/70 hover:text-white transition-colors no-underline border border-transparent hover:border-shift5-orange/50 px-2 py-0.5 text-nowrap">
            ABOUT
          </Link>

          <Link href="/frequency" className="cursor-pointer text-white/70 hover:text-white transition-colors no-underline border border-transparent hover:border-shift5-orange/50 px-2 py-0.5 text-nowrap">
            FREQUENCY
          </Link>

          <Link href="/help" className="cursor-pointer text-white/70 hover:text-white transition-colors no-underline border border-transparent hover:border-shift5-orange/50 px-2 py-0.5 text-nowrap">
            HELP
          </Link>

          {session ? (
            <div className="flex items-center gap-4 border-l-2 border-shift5-accent pl-6">
              <div className="w-8 h-8 border-2 border-white/20 overflow-hidden relative group/avatar">
                {session.user?.image ? (
                  <Image src={session.user.image} alt="User" fill className="object-cover grayscale transition-all group-hover/avatar:grayscale-0 contrast-150" />
                ) : (
                  <div className="w-full h-full bg-white/10" />
                )}
              </div>
              <button
                onClick={() => signOut()}
                aria-label="Sign out"
                className="text-[10px] font-bold text-white/30 hover:text-shift5-orange transition-colors cursor-pointer uppercase tracking-widest font-mono"
              >
                [ Terminate ]
              </button>
            </div>
          ) : (
            <button
              onClick={() => signIn(undefined, { callbackUrl: "/my-atlas" })}
              className="text-white font-bold bg-shift5-accent px-4 py-1.5 hover:bg-shift5-orange transition-all border-2 border-white/10 hover:border-white/30 uppercase tracking-widest font-mono text-[10px]"
            >
              LOGIN
            </button>
          )}
        </nav>

        {/* Mobile: Quick actions + Hamburger */}
        <div className="flex md:hidden items-center gap-3 shrink-0">
          {session ? (
            <Link
              href="/my-atlas"
              className="text-[9px] font-mono font-bold text-white/60 uppercase tracking-widest no-underline"
            >
              ATLAS
            </Link>
          ) : (
            <button
              onClick={() => signIn(undefined, { callbackUrl: "/my-atlas" })}
              className="text-white font-bold bg-shift5-accent px-3 py-1 hover:bg-shift5-orange transition-all border border-white/10 uppercase tracking-widest font-mono text-[9px]"
            >
              LOGIN
            </button>
          )}

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="w-10 h-10 flex items-center justify-center text-white/60 hover:text-white transition-colors"
            aria-label="Menu"
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Mobile Menu Panel — swipe right to dismiss */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            ref={menuRef}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={{ left: 0, right: 0.3 }}
            onDragEnd={(_: unknown, info: { offset: { x: number }; velocity: { x: number } }) => {
              if (info.offset.x > 80 || info.velocity.x > 400) {
                setIsMobileMenuOpen(false);
              }
            }}
            className="md:hidden fixed top-0 right-0 w-[85vw] max-w-[320px] h-full bg-shift5-dark border-l-2 border-shift5-accent z-50 flex flex-col touch-manipulation"
          >
            {/* Drag handle */}
            <div className="absolute left-2 top-1/2 -translate-y-1/2 w-1 h-12 rounded-full bg-white/10" />

            {/* Menu Header */}
            <div className="flex items-center justify-between px-5 h-16 border-b-2 border-shift5-accent shrink-0">
              <span className="text-[10px] font-mono text-shift5-orange uppercase tracking-[0.2em] font-bold">Navigation</span>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-10 h-10 flex items-center justify-center text-white/60 active:scale-90 transition-transform"
              >
                <X size={18} />
              </button>
            </div>

            {/* Search */}
            <div className="px-5 py-4 border-b border-white/5">
              <div className="text-[9px] font-mono text-white/30 uppercase tracking-widest mb-2">Search</div>
              <SearchBar
                compact
                onSelectArtist={(name) => {
                  setIsMobileMenuOpen(false);
                  router.push(`/artist/${encodeURIComponent(name)}`);
                }}
                onSelectGenre={(name) => {
                  setIsMobileMenuOpen(false);
                  router.push(`/genre/${encodeURIComponent(name)}`);
                }}
              />
            </div>

            {/* Nav Links */}
            <div className="px-5 py-4 space-y-1 border-b border-white/5 flex-1 overflow-y-auto">
              <div className="text-[9px] font-mono text-white/30 uppercase tracking-widest mb-3">Navigate</div>
              {[
                { href: "/", label: "HOME" },
                ...(session ? [{ href: "/my-atlas", label: "MY ATLAS" }] : []),
                { href: "/genres", label: "GENRES" },
                { href: "/about", label: "ABOUT" },
                { href: "/frequency", label: "FREQUENCY" },
                { href: "/help", label: "HELP" },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-3 text-[11px] font-mono uppercase tracking-widest no-underline transition-all active:bg-white/10 ${pathname === link.href
                    ? 'text-shift5-orange bg-shift5-orange/10 border-l-2 border-shift5-orange'
                    : 'text-white/60 hover:text-white hover:bg-white/5 border-l-2 border-transparent'
                    }`}
                >
                  <span className="text-white/20">▸</span>
                  {link.label}
                </Link>
              ))}

              {/* Protocol Menu Toggle */}
              <div className="pt-4 mt-2 border-t border-white/5">
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setIsProtocolOpen(true);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-3 text-[11px] font-mono uppercase tracking-widest text-white/60 active:text-shift5-orange active:bg-shift5-orange/5 transition-all border border-white/10"
                >
                  <Terminal size={14} className="text-shift5-orange" />
                  <span>Protocol Menu</span>
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-shift5-orange animate-pulse" />
                </button>
              </div>
            </div>

            {/* User Section */}
            <div className="px-5 py-5 border-t border-white/5 pb-[max(20px,env(safe-area-inset-bottom))]">
              {session ? (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 border-2 border-white/20 overflow-hidden relative shrink-0">
                    {session.user?.image ? (
                      <Image src={session.user.image} alt="User" fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full bg-white/10" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-mono text-white/80 truncate">{session.user?.name || session.user?.email}</div>
                    <button
                      onClick={() => signOut()}
                      className="text-[9px] font-mono text-white/30 active:text-shift5-orange transition-colors uppercase tracking-widest"
                    >
                      [ Terminate ]
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => signIn(undefined, { callbackUrl: "/my-atlas" })}
                  className="w-full text-white font-bold bg-shift5-accent px-4 py-2.5 active:bg-shift5-orange transition-all border-2 border-white/10 uppercase tracking-widest font-mono text-[10px]"
                >
                  Sign In / Register
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ProtocolOverlay
        isOpen={isProtocolOpen}
        onClose={() => setIsProtocolOpen(false)}
      />
    </>
  );
}
