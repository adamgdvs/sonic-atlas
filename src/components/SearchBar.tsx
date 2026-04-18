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
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);
  const resultsId = useRef(`search-results-${Math.random().toString(36).slice(2)}`);

  const doSearch = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([]);
      setActiveIndex(-1);
      return;
    }
    setLoading(true);
    try {
      const data = await getAutocompleteSuggestions(q);
      setResults(data);
      setActiveIndex(data.length > 0 ? 0 : -1);
    } catch {
      setResults([]);
      setActiveIndex(-1);
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
    setActiveIndex(-1);
    if (item.type === "genre" && onSelectGenre) {
      onSelectGenre(item.name);
    } else {
      onSelectArtist(item.name);
    }
  };

  const isExpanded = focused && (results.length > 0 || loading);

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
          if (e.key === "ArrowDown") {
            e.preventDefault();
            if (results.length > 0) {
              setActiveIndex((prev) => (prev + 1) % results.length);
            }
            return;
          }
          if (e.key === "ArrowUp") {
            e.preventDefault();
            if (results.length > 0) {
              setActiveIndex((prev) => (prev <= 0 ? results.length - 1 : prev - 1));
            }
            return;
          }
          if (e.key === "Enter" && results.length > 0) {
            e.preventDefault();
            const selected = results[activeIndex >= 0 ? activeIndex : 0];
            if (selected) handleSelect(selected);
            return;
          }
          if (e.key === "Escape") {
            setResults([]);
            setActiveIndex(-1);
            setFocused(false);
            inputRef.current?.blur();
          }
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setTimeout(() => {
          setFocused(false);
          setActiveIndex(-1);
        }, 200)}
        aria-label="Search for artists or genres"
        aria-autocomplete="list"
        aria-controls={resultsId.current}
        aria-expanded={isExpanded}
        aria-activedescendant={activeIndex >= 0 ? `${resultsId.current}-option-${activeIndex}` : undefined}
        role="combobox"
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
      {isExpanded && (
        <div
          id={resultsId.current}
          role="listbox"
          aria-label="Search suggestions"
          className="absolute top-full left-0 right-0 bg-shift5-gray border border-shift5-orange/30 border-t-0 z-50 shadow-2xl backdrop-blur-md max-h-[60vh] sm:max-h-[400px] overflow-y-auto overscroll-contain"
        >
          {loading && results.length === 0 && (
            <div className="px-4 py-8 text-[11px] text-shift5-orange font-mono animate-pulse flex flex-col items-center gap-2">
              <div className="w-12 h-1 bg-shift5-orange/20 overflow-hidden relative">
                <div className="absolute inset-y-0 left-0 bg-shift5-orange w-1/3 animate-[loading-scan_1s_infinite]" />
              </div>
              RUNNING_RECONNAISSANCE...
            </div>
          )}
          {results.map((r, i) => (
            <button
              key={`${r.type}-${r.name}-${i}`}
              id={`${resultsId.current}-option-${i}`}
              type="button"
              role="option"
              aria-selected={activeIndex === i}
              onClick={() => handleSelect(r)}
              onMouseEnter={() => setActiveIndex(i)}
              className={`w-full text-left flex items-center gap-4 cursor-pointer active:bg-white/10 group border-b border-white/5 last:border-b-0 transition-colors touch-manipulation ${
                activeIndex === i ? "bg-white/5" : "hover:bg-white/5"
              }`}
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
                <div className={`font-bold truncate uppercase font-mono tracking-tight transition-colors ${
                  activeIndex === i ? "text-shift5-orange" : "text-white group-hover:text-shift5-orange"
                }`}>
                  {r.name}
                </div>
                {!compact && (
                  <div className={`text-[10px] truncate uppercase font-mono tracking-widest transition-colors flex items-center gap-2 ${
                    activeIndex === i ? "text-white/50" : "text-white/30 group-hover:text-white/50"
                  }`}>
                    <span className="w-1 h-1 bg-white/10 rounded-full" />
                    SIG_TYPE_{r.type}
                  </div>
                )}
              </div>
              <div className={`transition-opacity text-shift5-orange font-mono text-[10px] ${
                activeIndex === i ? "opacity-100" : "opacity-0 group-hover:opacity-100"
              }`}>
                [SELECT]
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
