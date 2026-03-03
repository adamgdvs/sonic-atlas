"use client";

import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
import Image from "next/image";

export default function Header() {
  const { data: session } = useSession();

  return (
    <header className="border-b-2 border-shift5-accent bg-shift5-dark h-16 flex items-center justify-between px-6 sm:px-12 z-50 relative">
      <Link href="/" className="flex items-center gap-3 no-underline group">
        <div className="w-4 h-4 bg-shift5-orange border-2 border-white/20 group-hover:scale-125 transition-all duration-300 shadow-[0_0_10px_rgba(255,88,65,0.4)]" />
        <span
          className="text-[16px] font-black text-white font-mono uppercase tracking-[0.2em] group-hover:text-shift5-orange transition-colors"
        >
          sonic_//_atlas
        </span>
      </Link>
      <div className="flex items-center gap-4 sm:gap-6 text-[10px] text-white/50 font-mono uppercase tracking-[0.05em]">
        <div className="hidden md:flex items-center gap-3 mr-4 border-r border-shift5-accent pr-6">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-shift5-orange animate-pulse" />
            LIVE_LINK
          </span>
          <span className="text-white/20">|</span>
          <span>SRV_RES: OK</span>
        </div>

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

        <Link href="/about" className="cursor-pointer text-white/70 hover:text-white transition-colors no-underline border border-transparent hover:border-shift5-orange/50 px-2 py-0.5 hidden sm:inline text-nowrap">
          ABOUT
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
      </div>
    </header>
  );
}
