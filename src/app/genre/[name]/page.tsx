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

export default function GenreDetailPage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name: rawName } = use(params);
  const genreName = decodeURIComponent(rawName);
  const router = useRouter();
  const { pushNode } = useJourney();

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
  const [playingUrl, setPlayingUrl] = useState<string | null>(null);
  const [previewMap, setPreviewMap] = useState<Record<string, string>>({});
  const [imageMap, setImageMap] = useState<Record<string, string>>({});
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    setLoading(true);
    setArtists([]);
    setSimilarGenres([]);
    setPreviewMap({});
    setImageMap({});
    handleStop();

    Promise.all([
      getGenreArtists(genreName),
      getSimilarGenres(genreName),
    ])
      .then(([artistsData, similarData]) => {
        setArtists(artistsData);
        setSimilarGenres(similarData);
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [genreName]);

  // Fetch preview URLs in batches once artists load
  useEffect(() => {
    if (artists.length === 0) return;

    let cancelled = false;

    async function fetchPreviews() {
      // Fetch in batches of 3 with delay to respect Deezer rate limits
      // Each preview call triggers 2 Deezer requests (search + top tracks)
      for (let i = 0; i < artists.length; i += 3) {
        if (cancelled) return;
        if (i > 0) await new Promise((r) => setTimeout(r, 800));
        if (cancelled) return;
        const batch = artists.slice(i, i + 3);
        const results = await Promise.allSettled(
          batch.map(async (a) => {
            const data = await getArtistPreviewData(a.name);
            return { name: a.name, url: data.tracks[0]?.preview || null, image: data.image };
          })
        );
        if (cancelled) return;

        const newPreviews: Record<string, string> = {};
        const newImages: Record<string, string> = {};
        let hasUpdates = false;

        for (const r of results) {
          if (r.status === "fulfilled") {
            if (r.value.url) newPreviews[r.value.name] = r.value.url;
            if (r.value.image) newImages[r.value.name] = r.value.image;
            hasUpdates = true;
          }
        }

        if (hasUpdates) {
          setPreviewMap((prev) => ({ ...prev, ...newPreviews }));
          setImageMap((prev) => ({ ...prev, ...newImages }));
        }
      }
    }

    fetchPreviews();
    return () => { cancelled = true; };
  }, [artists]);

  // Cleanup audio on unmount / genre change
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [genreName]);

  const handleExplore = (name: string) => {
    router.push(`/artist/${encodeURIComponent(name)}`);
  };

  const handlePlay = (url: string) => {
    if (playingUrl === url) {
      handleStop();
      return;
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    const audio = new Audio(url);
    audio.onended = () => setPlayingUrl(null);
    audio.onerror = () => setPlayingUrl(null);
    audio.play();
    audioRef.current = audio;
    setPlayingUrl(url);
  };

  const handleStop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setPlayingUrl(null);
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <Breadcrumbs />

      {/* Search bar */}
      <div className="flex items-center gap-3 border-b border-[#F0F0F0] px-4 sm:px-10 py-4">
        <button
          onClick={() => router.push("/genres")}
          className="border-none bg-none cursor-pointer text-lg text-[#9CA3AF] p-1 hover:text-[#1D1D1F] transition-colors"
        >
          ←
        </button>
        <div className="flex-1 max-w-[360px]">
          <SearchBar
            onSelectArtist={handleExplore}
            onSelectGenre={(name) => router.push(`/genre/${encodeURIComponent(name)}`)}
            compact
          />
        </div>
      </div>

      <div
        className="max-w-[1600px] mx-auto px-4 sm:px-10 py-6 sm:py-8"
        style={{ animation: "fadeIn 0.3s ease" }}
      >
        {/* Header */}
        <div className="mb-6">
          <h1
            className="text-2xl sm:text-3xl font-semibold text-[#1D1D1F] mb-1"
            style={{ letterSpacing: "-0.03em" }}
          >
            {genreName}
          </h1>
          {!loading && (
            <p className="text-sm text-[#9CA3AF]">
              {artists.length} top artists
            </p>
          )}
        </div>

        {/* Related genres */}
        {similarGenres.length > 0 && (
          <div className="mb-8">
            <div
              className="text-[11px] font-semibold text-[#9CA3AF] uppercase mb-3"
              style={{ letterSpacing: "0.08em" }}
            >
              Related Genres
            </div>
            <div className="flex flex-wrap gap-0.5 overflow-x-auto">
              {similarGenres.map((g) => (
                <GenreTag
                  key={g.name}
                  genre={g.name}
                  href={`/genre/${encodeURIComponent(g.name)}`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Artists grid */}
        {loading ? (
          <div className="text-sm text-[#9CA3AF] py-12 text-center">
            Loading artists...
          </div>
        ) : artists.length === 0 ? (
          <div className="text-sm text-[#9CA3AF] py-12 text-center">
            No artists found for this genre
          </div>
        ) : (
          <div>
            <div
              className="text-[11px] font-semibold text-[#9CA3AF] uppercase mb-4"
              style={{ letterSpacing: "0.08em" }}
            >
              Top Artists
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
              {artists.map((a, i) => {
                const preview = previewMap[a.name];
                const isPlaying = !!preview && playingUrl === preview;

                return (
                  <div
                    key={a.name}
                    className="border border-[#F0F0F0] bg-white hover:border-[#E5E5E5] transition-all duration-150 p-3 sm:p-4 cursor-pointer group"
                    style={{
                      animation: `fadeSlideIn 0.3s ease ${i * 0.02}s both`,
                    }}
                    onClick={() => handleExplore(a.name)}
                  >
                    <div className="relative w-full aspect-square bg-[#F0F0F0] mb-3 overflow-hidden">
                      {imageMap[a.name] || a.image ? (
                        <Image
                          src={imageMap[a.name] || a.image || ""}
                          alt={a.name}
                          width={200}
                          height={200}
                          className="object-cover w-full h-full"
                          unoptimized
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ArtistInitials name={a.name} size={64} />
                        </div>
                      )}
                      {/* Play button overlay */}
                      {preview && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            isPlaying ? handleStop() : handlePlay(preview);
                          }}
                          className={`absolute bottom-2 right-2 flex items-center justify-center border cursor-pointer transition-all duration-150 ${isPlaying
                            ? "border-white bg-[#1D1D1F] text-white opacity-100"
                            : "border-white/60 bg-[#1D1D1F]/70 text-white opacity-0 group-hover:opacity-100"
                            }`}
                          style={{ width: 32, height: 32, backdropFilter: "blur(4px)" }}
                          title={isPlaying ? "Stop" : "Play preview"}
                        >
                          {isPlaying ? (
                            <svg width={10} height={10} viewBox="0 0 12 12" fill="currentColor">
                              <rect x="1" y="1" width="4" height="10" />
                              <rect x="7" y="1" width="4" height="10" />
                            </svg>
                          ) : (
                            <svg width={10} height={10} viewBox="0 0 12 12" fill="currentColor">
                              <polygon points="2,0 12,6 2,12" />
                            </svg>
                          )}
                        </button>
                      )}
                    </div>
                    <p
                      className="text-sm font-semibold text-[#1D1D1F] truncate group-hover:underline"
                      title={a.name}
                    >
                      {a.name}
                    </p>
                    <p className="text-[11px] text-[#9CA3AF] mt-0.5">
                      Explore →
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
