"use client";

import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
import Image from "next/image";

export default function Header() {
  const { data: session } = useSession();

  return (
    <header className="border-b border-[#F0F0F0] h-14 flex items-center justify-between px-4 sm:px-10">
      <Link href="/" className="flex items-center gap-2 no-underline">
        <div className="w-2 h-2 bg-[#1D1D1F] rounded-full" />
        <span
          className="text-[15px] font-bold text-[#1D1D1F]"
          style={{ letterSpacing: "-0.03em" }}
        >
          sonic atlas
        </span>
      </Link>
      <div className="flex items-center gap-4 sm:gap-6 text-[13px] text-[#9CA3AF]">
        {session ? (
          <>
            <Link
              href="/my-atlas"
              className="cursor-pointer font-medium text-[#1D1D1F] transition-colors no-underline"
            >
              My Atlas
            </Link>
          </>
        ) : (
          <Link
            href="/genres"
            className="cursor-pointer hover:text-[#1D1D1F] transition-colors no-underline text-[#9CA3AF]"
          >
            Genres
          </Link>
        )}

        <span className="cursor-pointer hover:text-[#1D1D1F] transition-colors hidden sm:inline">
          About
        </span>

        {session ? (
          <div className="flex items-center gap-3 border-l border-[#F0F0F0] pl-4 sm:pl-6">
            <div className="w-6 h-6 rounded-full bg-[#E5E7EB] overflow-hidden">
              {session.user?.image ? (
                <Image src={session.user.image} alt="User" width={24} height={24} />
              ) : (
                <div className="w-full h-full bg-[#1D1D1F]" />
              )}
            </div>
            <button
              onClick={() => signOut()}
              className="hover:text-[#1D1D1F] transition-colors"
            >
              Sign out
            </button>
          </div>
        ) : (
          <button
            onClick={() => signIn()}
            className="text-[#1D1D1F] font-bold hover:opacity-70 transition-opacity"
          >
            Sign in
          </button>
        )}
      </div>
    </header>
  );
}
