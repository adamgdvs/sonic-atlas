"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { getAutocompleteSuggestions, type AutocompleteResult } from "@/lib/api";
import ArtistInitials from "./ArtistInitials";

export default function SearchBar({
  onSelectArtist,
  onSelectGenre,
  compact,
}: {
  onSelectArtist: (name: string) => void;
  onSelectGenre?: (name: string) => void;
  compact?: boolean;
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
    <div className="relative">
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
        placeholder={compact ? "Search another artist..." : "Artist name..."}
        className="w-full outline-none text-[#1D1D1F] font-[family-name:var(--font-dm-sans)] transition-[border-color] duration-150"
        style={{
          padding: compact ? "10px 16px" : "14px 20px",
          fontSize: compact ? "14px" : "16px",
          fontWeight: 400,
          border: focused ? "1px solid #1D1D1F" : "1px solid #E5E5E5",
          backgroundColor: compact ? "#FAFAFA" : "#FFF",
          letterSpacing: "-0.01em",
        }}
      />
      {focused && (results.length > 0 || loading) && (
        <div className="absolute top-full left-0 right-0 bg-white border border-[#E5E5E5] border-t-0 z-10">
          {loading && results.length === 0 && (
            <div className="px-4 py-3 text-xs text-[#9CA3AF]">
              Searching...
            </div>
          )}
          {results.map((r, i) => (
            <div
              key={`${r.type}-${r.name}-${i}`}
              onClick={() => handleSelect(r)}
              className="flex items-center gap-2.5 cursor-pointer hover:bg-[#FAFAFA]"
              style={{ padding: "10px 16px", fontSize: "14px" }}
            >
              {r.type === "artist" ? (
                <ArtistInitials name={r.name} size={compact ? 24 : 28} />
              ) : (
                <div
                  className="flex items-center justify-center rounded-full shrink-0"
                  style={{
                    width: compact ? 24 : 28,
                    height: compact ? 24 : 28,
                    backgroundColor: "#1D1D1F",
                    color: "white"
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
                    <line x1="7" y1="7" x2="7.01" y2="7"></line>
                  </svg>
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="font-medium text-[#1D1D1F] truncate capitalize">
                  {r.name}
                </div>
                {!compact && (
                  <div className="text-[11px] text-[#9CA3AF] truncate capitalize">
                    {r.type}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
