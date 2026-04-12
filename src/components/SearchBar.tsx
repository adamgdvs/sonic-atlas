"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { getAutocompleteSuggestions, type AutocompleteResult } from "@/lib/api";
import ArtistInitials from "./ArtistInitials";

export default function SearchBar({
  onSelectArtist,
  onSelectGenre,
  compact,
  headerMode,
}: {
  onSelectArtist: (name: string) => void;
  onSelectGenre?: (name: string) => void;
  compact?: boolean;
  headerMode?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [results, setResults] = useState<AutocompleteResult[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  const doSearch = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const data = await getAutocompleteSuggestions(q);
      setResults(data);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(query), 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, doSearch]);

  const handleSelect = (item: AutocompleteResult) => {
    setQuery("");
    setResults([]);
    if (item.type === "genre" && onSelectGenre) {
      onSelectGenre(item.name);
    } else {
      onSelectArtist(item.name);
    }
  };

  return (
    <div className={`relative group/search ${headerMode ? 'w-full' : ''}`}>
      {!headerMode && (
        <div className={`absolute -top-6 left-0 text-[10px] font-mono transition-opacity duration-300 ${focused ? 'opacity-100 text-shift5-orange' : 'opacity-40 text-white/50'}`}>
          {loading ? 'SCN//SCANNING_ARRAY...' : 'SYS//READY_FOR_INPUT'}
        </div>
      )}
      <input
        ref={inputRef}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && results.length > 0) {
            handleSelect(results[0]);
          }
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setTimeout(() => setFocused(false), 200)}
        aria-label="Search for artists"
        placeholder={headerMode ? "SEARCH" : (compact ? "SEARCH" : "SEARCH_NEXUS...")}
        className={`w-full outline-none text-white font-mono transition-all duration-300 placeholder:text-white/20 uppercase tracking-wider ${headerMode ? 'border-b border-white/10 focus:border-shift5-orange' : 'border'}`}
        style={{
          padding: headerMode ? "8px 12px" : (compact ? "12px 16px" : "16px 20px"),
          fontSize: headerMode ? "11px" : (compact ? "13px" : "15px"),
          fontWeight: 500,
          border: headerMode ? undefined : (focused ? "1px solid #ff5841" : "1px solid #333"),
          backgroundColor: headerMode ? "transparent" : (focused ? "#212121" : "#1a1a1a"),
          boxShadow: focused && !headerMode ? "0 0 15px rgba(255, 88, 65, 0.1)" : "none",
        }}
      />
      {focused && (results.length > 0 || loading) && (
        <div className="absolute top-full left-0 right-0 bg-shift5-gray border border-shift5-orange/30 border-t-0 z-50 shadow-2xl backdrop-blur-md max-h-[60vh] sm:max-h-[400px] overflow-y-auto overscroll-contain">
          {loading && results.length === 0 && (
            <div className="px-4 py-8 text-[11px] text-shift5-orange font-mono animate-pulse flex flex-col items-center gap-2">
              <div className="w-12 h-1 bg-shift5-orange/20 overflow-hidden relative">
                <div className="absolute inset-y-0 left-0 bg-shift5-orange w-1/3 animate-[loading-scan_1s_infinite]" />
              </div>
              RUNNING_RECONNAISSANCE...
            </div>
          )}
          {results.map((r, i) => (
            <div
              key={`${r.type}-${r.name}-${i}`}
              onClick={() => handleSelect(r)}
              className="flex items-center gap-4 cursor-pointer hover:bg-white/5 active:bg-white/10 group border-b border-white/5 last:border-b-0 transition-colors touch-manipulation"
              style={{ padding: "12px 16px", fontSize: "13px" }}
            >
              {r.type === "artist" ? (
                <div className="border border-white/10 shrink-0 group-hover:border-shift5-orange/50 transition-colors">
                  <ArtistInitials name={r.name} size={compact ? 28 : 32} />
                </div>
              ) : (
                <div
                  className="flex items-center justify-center border border-white/10 shrink-0 group-hover:border-shift5-orange/50 transition-colors"
                  style={{
                    width: compact ? 28 : 32,
                    height: compact ? 28 : 32,
                    backgroundColor: "#1a1a1a",
                    color: "#ff5841"
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
                    <line x1="7" y1="7" x2="7.01" y2="7"></line>
                  </svg>
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="font-bold text-white group-hover:text-shift5-orange truncate uppercase font-mono tracking-tight transition-colors">
                  {r.name}
                </div>
                {!compact && (
                  <div className="text-[10px] text-white/30 group-hover:text-white/50 truncate uppercase font-mono tracking-widest transition-colors flex items-center gap-2">
                    <span className="w-1 h-1 bg-white/10 rounded-full" />
                    SIG_TYPE_{r.type}
                  </div>
                )}
              </div>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity text-shift5-orange font-mono text-[10px]">
                [SELECT]
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
