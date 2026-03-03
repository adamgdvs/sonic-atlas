"use client";

import React from "react";

export default function StreamingLinks({ artistName, className = "", size = 20, isHero = false }: { artistName: string, className?: string, size?: number, isHero?: boolean }) {
    const encodedName = encodeURIComponent(artistName);

    const bgClass = isHero
        ? "bg-[#E16049] text-black hover:bg-[#E16049]/90 shadow-sm active:scale-95 border-0 hover:text-black"
        : "bg-transparent text-[#9CA3AF] hover:text-[#1D1D1F] hover:bg-[#F0F0F0]";

    const links = [
        {
            name: "Spotify",
            url: `https://open.spotify.com/search/${encodedName}/artists`,
            icon: (
                <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: size * 0.6, height: size * 0.6 }}>
                    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.48.659.24 1.02h.06zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15.001 10.62 18.66 12.9c.42.239.54.84.3 1.259v-.119zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.3c-.6.18-1.2-.12-1.38-.66s.12-1.2.66-1.38c4.26-1.26 11.28-1.02 15.72 1.62.54.3.72 1.02.42 1.56-.239.54-.9.659-1.5.36z" />
                </svg>
            )
        },
        {
            name: "Apple Music",
            url: `https://music.apple.com/us/search?term=${encodedName}`,
            icon: (
                <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: size * 0.6, height: size * 0.6 }}>
                    <path d="M16.92 14.88c-.01-3.21 2.62-4.75 2.74-4.83-1.49-2.18-3.8-2.48-4.63-2.51-1.97-.2-3.84 1.16-4.84 1.16-1.01 0-2.55-1.14-4.2-1.11-2.14.03-4.12 1.25-5.23 3.16-2.24 3.89-.57 9.64 1.61 12.8 1.07 1.55 2.33 3.28 4.02 3.22 1.63-.07 2.26-1.06 4.23-1.06 1.95 0 2.54 1.06 4.25 1.03 1.74-.04 2.82-1.58 3.88-3.12 1.23-1.8 1.73-3.53 1.75-3.62-.03-.01-3.56-1.37-3.58-5.12zM15.11 4.77c.9-1.09 1.51-2.6 1.34-4.11-1.29.05-2.85.86-3.77 1.96-.82.97-1.55 2.51-1.35 3.99 1.45.11 2.87-.73 3.78-1.84z" />
                </svg>
            )
        },
        {
            name: "YouTube Music",
            url: `https://music.youtube.com/search?q=${encodedName}+artist`,
            icon: (
                <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: size * 0.6, height: size * 0.6 }}>
                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 19.125c-3.93 0-7.125-3.195-7.125-7.125S8.07 4.875 12 4.875 19.125 8.07 19.125 12 15.93 19.125 12 19.125zM9.75 8.25v7.5l6.375-3.75-6.375-3.75z" />
                </svg>
            )
        }
    ];

    return (
        <div className={`flex items-center gap-1.5 ${className}`}>
            {links.map((link) => (
                <a
                    key={link.name}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center justify-center transition-all rounded-full cursor-pointer ${bgClass}`}
                    style={{ width: size, height: size }}
                    title={`Open in ${link.name}`}
                    onClick={(e) => e.stopPropagation()}
                >
                    {link.icon}
                </a>
            ))}
        </div>
    );
}
