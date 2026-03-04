"use client";

import { useState, useEffect, useRef, use } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  getGenreArtists,
  getSimilarGenres,
  getArtistPreviewData,
  type GenreArtist,
} from "@/lib/api";
import Header from "@/components/Header";
import SearchBar from "@/components/SearchBar";
import GenreTag from "@/components/GenreTag";
import ArtistInitials from "@/components/ArtistInitials";
import Breadcrumbs from "@/components/Breadcrumbs";
import { useJourney } from "@/contexts/JourneyContext";
import { useAudio } from "@/contexts/AudioContext";
import { useSession } from "next-auth/react";
import { useToast } from "@/components/ToastProvider";
import { Heart } from "lucide-react";
import Footer from "@/components/Footer";

export default function GenreDetailPage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name: rawName } = use(params);
  const genreName = decodeURIComponent(rawName);
  const router = useRouter();
  const { pushNode } = useJourney();
  const { data: session } = useSession();
  const { showToast } = useToast();

  useEffect(() => {
    pushNode({
      name: genreName,
      type: "genre",
      url: `/genre/${encodeURIComponent(genreName)}`,
    });
  }, [genreName, pushNode]);

  const [artists, setArtists] = useState<GenreArtist[]>([]);
  const [similarGenres, setSimilarGenres] = useState<{ name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  // Audio state
  const { playTrack, currentTrack, isPlaying } = useAudio();
  const [imageMap, setImageMap] = useState<Record<string, string>>({});

  // Bookmark state
  const [bookmarkedArtists, setBookmarkedArtists] = useState<Set<string>>(new Set());
  const [bookmarkingIds, setBookmarkingIds] = useState<Set<string>>(new Set());

  // Fetch bookmarks on session load
  useEffect(() => {
    if (session?.user) {
      fetch("/api/bookmarks")
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setBookmarkedArtists(new Set(data.map((b: any) => b.name)));
          }
        })
        .catch((err) => console.error("Failed to load bookmarks", err));
    }
  }, [session]);

  const handleToggleBookmark = async (name: string, image?: string | null) => {
    if (!session?.user) {
      showToast({
        message: "Sign in required to bookmark artists",
        type: "auth",
        action: {
          label: "Sign In",
          href: "/api/auth/signin",
        },
        duration: 5000,
      });
      return;
    }

    const id = name;
    setBookmarkingIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });

    const isCurrentlyBookmarked = bookmarkedArtists.has(name);

    try {
      const url = isCurrentlyBookmarked ? `/api/bookmarks?artistId=${id}` : "/api/bookmarks";
      const res = await fetch(url, {
        method: isCurrentlyBookmarked ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: isCurrentlyBookmarked ? null : JSON.stringify({
          name,
          artistId: id,
          imageUrl: image,
          genres: [genreName],
        }),
      });
      if (res.ok) {
        setBookmarkedArtists((prev) => {
          const next = new Set(prev);
          if (isCurrentlyBookmarked) next.delete(name);
          else next.add(name);
          return next;
        });
      }
    } finally {
      setBookmarkingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  useEffect(() => {
    if (artists.length === 0) return;
    let cancelled = false;

    async function fetchMissingImages() {
      const missing = artists.filter(a => !a.image && !imageMap[a.name]);
      if (missing.length === 0) return;

      for (let i = 0; i < missing.length; i += 3) {
        if (cancelled) return;
        const batch = missing.slice(i, i + 3);

        if (i > 0) await new Promise(r => setTimeout(r, 1000));
        if (cancelled) return;

        const results = await Promise.allSettled(
          batch.map(async (a) => {
            const data = await getArtistPreviewData(a.name);
            return { name: a.name, image: data.image };
          })
        );
        if (cancelled) return;

        const updates: Record<string, string> = {};
        let count = 0;
        for (const r of results) {
          if (r.status === "fulfilled" && r.value.image) {
            updates[r.value.name] = r.value.image;
            count++;
          }
        }
        if (count > 0) {
          setImageMap(prev => ({ ...prev, ...updates }));
        }
      }
    }

    fetchMissingImages();
    return () => { cancelled = true; };
  }, [artists]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [artistsData, similarData] = await Promise.all([
          getGenreArtists(genreName),
          getSimilarGenres(genreName)
        ]);
        setArtists(artistsData);
        setSimilarGenres(similarData.slice(0, 10));
      } catch (err) {
        console.error("Error fetching genre data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [genreName]);

  const handleExplore = (name: string) => {
    router.push(`/artist/${encodeURIComponent(name)}`);
  };

  const handlePlayArtist = async (name: string, previewUrl?: string, artistImage?: string | null) => {
    if (isPlaying && currentTrack?.artist === name) {
      playTrack(currentTrack);
      return;
    }

    if (previewUrl) {
      playTrack({
        id: name,
        url: previewUrl,
        title: "Track Preview",
        artist: name,
        coverUrl: artistImage || undefined
      });
    } else {
      const data = await getArtistPreviewData(name);
      const track = data.tracks[0];
      if (track) {
        playTrack({
          id: name,
          url: track.preview,
          title: track.title,
          artist: name,
          coverUrl: data.image || undefined
        });
      }
    }
  };

  return (
    <div className="min-h-screen bg-shift5-dark text-white selection:bg-shift5-orange/30">
      <Header />
      <Breadcrumbs />

      {/* Background Decorative Grid */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.02] overflow-hidden z-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#888_1px,transparent_1px),linear-gradient(to_bottom,#888_1px,transparent_1px)] bg-[size:40px_40px]" />
      </div>

      <main className="relative z-10 p-5 md:p-10 max-w-[1400px] mx-auto">
        <div className="mb-12 border-b border-white/5 pb-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mt-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-[10px] font-mono text-shift5-orange uppercase tracking-[0.2em] bg-shift5-orange/10 px-2 py-0.5 border border-shift5-orange/20">Genre_Signal</span>
                <span className="text-[10px] font-mono text-white/20 uppercase tracking-widest whitespace-nowrap">Status: ACTIVATED</span>
              </div>
              <h1 className="text-4xl md:text-6xl font-bold uppercase tracking-tighter leading-none">{genreName}</h1>
              {!loading && (
                <div className="text-[10px] font-mono text-white/40 uppercase tracking-[0.1em] mt-4 flex items-center gap-4">
                  <span>Total_Artifacts // {artists.length.toString().padStart(2, '0')}</span>
                  <span className="text-white/10">|</span>
                  <span>Signal_Confidence // 98%</span>
                </div>
              )}
            </div>

            <div className="flex-1 max-w-[360px] w-full">
              <SearchBar
                onSelectArtist={handleExplore}
                onSelectGenre={(name) => router.push(`/genre/${encodeURIComponent(name)}`)}
                compact
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Main Content Column */}
          <div className="lg:col-span-9">
            {loading ? (
              <div className="py-20 text-center">
                <div className="inline-block w-8 h-8 border-2 border-shift5-orange/20 border-t-shift5-orange rounded-full animate-spin mb-4" />
                <div className="text-[10px] font-mono text-white/20 uppercase tracking-widest">Recon_In_Progress...</div>
              </div>
            ) : artists.length === 0 ? (
              <div className="py-20 text-center border border-dashed border-white/10">
                <div className="text-[10px] font-mono text-white/20 uppercase tracking-widest">Zero_Matches_Found</div>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {artists.map((a, i) => {
                  const isCurrentPlaying = isPlaying && currentTrack?.artist === a.name;
                  const isBookmarked = bookmarkedArtists.has(a.name);
                  const isBookmarking = bookmarkingIds.has(a.name);
                  return (
                    <div
                      key={a.name}
                      className="group relative border border-white/5 bg-white/[0.01] hover:bg-white/[0.02] transition-all duration-300 overflow-hidden"
                      style={{ animation: `fadeIn 0.5s ease ${i * 0.05}s both` }}
                      onClick={() => handleExplore(a.name)}
                    >
                      <div className="relative aspect-square overflow-hidden grayscale group-hover:grayscale-0 transition-all duration-700">
                        {(imageMap[a.name] || a.image) ? (
                          <Image
                            src={imageMap[a.name] || a.image || ""}
                            alt={a.name}
                            width={300}
                            height={300}
                            className="object-cover w-full h-full scale-105 group-hover:scale-100 transition-transform duration-700"
                            unoptimized
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-white/[0.02]">
                            <ArtistInitials name={a.name} size={64} />
                          </div>
                        )}

                        <div className="absolute inset-0 bg-shift5-dark/20 group-hover:bg-transparent transition-colors" />

                        {/* Heart / Bookmark Button */}
                        <button
                          onClick={(e) => { e.stopPropagation(); handleToggleBookmark(a.name, imageMap[a.name] || a.image); }}
                          disabled={isBookmarking}
                          className={`absolute top-3 right-3 w-9 h-9 flex items-center justify-center border transition-all duration-300 backdrop-blur-md ${isBookmarked
                              ? 'bg-shift5-orange border-shift5-orange text-white'
                              : 'bg-shift5-dark/80 border-white/10 text-white/60 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 hover:bg-shift5-orange/20 hover:border-shift5-orange/40 hover:text-shift5-orange'
                            } ${isBookmarking ? 'animate-pulse' : ''}`}
                        >
                          <Heart size={14} fill={isBookmarked ? "currentColor" : "none"} />
                        </button>

                        {/* Play Button */}
                        <button
                          onClick={(e) => { e.stopPropagation(); handlePlayArtist(a.name, undefined, a.image); }}
                          className={`absolute bottom-3 right-3 w-10 h-10 flex items-center justify-center border transition-all duration-300 backdrop-blur-md ${isCurrentPlaying ? 'bg-shift5-orange border-shift5-orange text-white' : 'bg-shift5-dark/80 border-white/10 text-white opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 hover:bg-shift5-orange hover:border-shift5-orange'}`}
                        >
                          {isCurrentPlaying ? (
                            <svg width={14} height={14} viewBox="0 0 12 12" fill="currentColor">
                              <rect x="1" y="1" width="4" height="10" />
                              <rect x="7" y="1" width="4" height="10" />
                            </svg>
                          ) : (
                            <svg width={14} height={14} viewBox="0 0 12 12" fill="currentColor">
                              <polygon points="2,0 12,6 2,12" />
                            </svg>
                          )}
                        </button>
                      </div>

                      <div className="p-4 border-t border-white/5">
                        <div className="flex items-center justify-between">
                          <div className="min-w-0 flex-1">
                            <div className="text-[9px] font-mono text-white/20 uppercase tracking-widest mb-1">Identified_Node</div>
                            <h3 className="text-sm font-bold uppercase tracking-tight truncate group-hover:text-shift5-orange transition-colors">{a.name}</h3>
                          </div>
                          {isBookmarked && (
                            <Heart size={12} fill="currentColor" className="text-shift5-orange shrink-0 ml-2" />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Sidebar Column */}
          <aside className="lg:col-span-3 space-y-10">
            {similarGenres.length > 0 && (
              <section className="border border-white/5 p-6 bg-white/[0.01]">
                <div className="text-[10px] font-mono text-white/30 uppercase mb-6 tracking-[0.2em] border-b border-white/5 pb-2">Proximal_Signals</div>
                <div className="space-y-2">
                  {similarGenres.map((g) => (
                    <div key={g.name} className="group flex items-center justify-between p-2 border border-white/5 hover:border-white/20 transition-all cursor-pointer" onClick={() => router.push(`/genre/${encodeURIComponent(g.name)}`)}>
                      <span className="text-[11px] font-mono text-white/50 uppercase group-hover:text-white transition-colors">{g.name}</span>
                      <span className="text-[10px] text-white/10 group-hover:text-shift5-orange">→</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <div className="border border-dashed border-white/5 p-6 animate-pulse hover:animate-none group">
              <div className="text-[9px] font-mono text-shift5-orange/40 uppercase mb-2">Sector_Analysis</div>
              <div className="text-[10px] font-mono text-white/10 group-hover:text-white/30 transition-colors uppercase leading-tight">
                Displaying primary cluster nodes for {genreName}. Spatial distribution reflects frequency within sonic metadata headers.
              </div>
            </div>
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
}
