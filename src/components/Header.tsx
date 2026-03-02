"use client";

import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
import Image from "next/image";

export default function Header() {
  const { data: session } = useSession();

  return (
    <header className="border-b border-dashed border-black bg-[#e6e6e6] h-14 flex items-center justify-between px-4 sm:px-10 z-50 relative">
      <Link href="/" className="flex items-center gap-2 no-underline group">
        <div className="w-3 h-3 bg-[#ff4500] border border-black group-hover:bg-black transition-colors" />
        <span
          className="text-[15px] font-bold text-black font-mono uppercase tracking-tighter"
        >
          sonic atlas
        </span>
      </Link>
      <div className="flex items-center gap-4 sm:gap-6 text-xs text-black font-mono uppercase font-bold">
        {session ? (
          <>
            <Link
              href="/my-atlas"
              className="cursor-pointer text-black hover:text-white hover:bg-black px-2 py-1 transition-colors no-underline"
            >
              My Atlas
            </Link>
          </>
        ) : (
          <Link
            href="/genres"
            className="cursor-pointer text-black hover:text-white hover:bg-black px-2 py-1 transition-colors no-underline"
          >
            Genres
          </Link>
        )}

        <span className="cursor-pointer hover:text-white hover:bg-black px-2 py-1 transition-colors hidden sm:inline">
          About
        </span>

        {session ? (
          <div className="flex items-center gap-3 border-l border-dashed border-black pl-4 sm:pl-6">
            <div className="w-6 h-6 bg-white border border-black overflow-hidden relative">
              {session.user?.image ? (
                <Image src={session.user.image} alt="User" fill className="object-cover grayscale-[100%]" style={{ imageRendering: "pixelated" }} />
              ) : (
                <div className="w-full h-full bg-black" />
              )}
            </div>
            <button
              onClick={() => signOut()}
              className="hover:text-[#ff4500] transition-colors"
            >
              Sign out
            </button>
          </div>
        ) : (
          <button
            onClick={() => signIn()}
            className="text-white bg-black px-3 py-1 hover:bg-[#ff4500] hover:text-white transition-colors border border-black"
          >
            Sign in
          </button>
        )}
      </div>
    </header>
  );
}
