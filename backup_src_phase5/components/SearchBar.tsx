"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { searchArtists, type SearchResult } from "@/lib/api";
import ArtistInitials from "./ArtistInitials";

export default function SearchBar({
  onSelect,
  compact,
}: {
  onSelect: (artistName: string) => void;
  compact?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
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
      const data = await searchArtists(q);
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

  const handleSelect = (name: string) => {
    setQuery("");
    setResults([]);
    onSelect(name);
  };

  return (
    <div className="relative">
      <input
        ref={inputRef}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && results.length > 0) {
            handleSelect(results[0].name);
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
          {results.map((a) => (
            <div
              key={a.id}
              onClick={() => handleSelect(a.name)}
              className="flex items-center gap-2.5 cursor-pointer hover:bg-[#FAFAFA]"
              style={{ padding: "10px 16px", fontSize: "14px" }}
            >
              <ArtistInitials name={a.name} size={compact ? 24 : 28} />
              <div className="min-w-0 flex-1">
                <div className="font-medium text-[#1D1D1F] truncate">
                  {a.name}
                </div>
                {!compact && a.disambiguation && (
                  <div className="text-[11px] text-[#9CA3AF] truncate">
                    {a.disambiguation}
                  </div>
                )}
                {!compact && a.tags && a.tags.length > 0 && !a.disambiguation && (
                  <div className="text-[11px] text-[#9CA3AF] truncate">
                    {a.tags
                      .slice(0, 2)
                      .map((t) => t.name)
                      .join(" · ")}
                  </div>
                )}
              </div>
              {a.score >= 90 && (
                <span className="text-[10px] text-[#C4C4C4] shrink-0">
                  {a.score}%
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
