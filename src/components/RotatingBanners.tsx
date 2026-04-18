"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type BannerCategory = "MOOD" | "ERA" | "GENRE" | "REGION";

interface Banner {
  id: string;
  category: BannerCategory;
  label: string;
  title: string;
  subtitle: string;
  seedGenre: string;
  gradient: string;
  accent: string;
}

const BANNERS: Banner[] = [
  {
    id: "late-night",
    category: "MOOD",
    label: "Late_Night_Transmissions",
    title: "After Midnight",
    subtitle: "Downtempo signals for 2AM minds. Drift with ambient, trip-hop, and shoegaze.",
    seedGenre: "ambient",
    gradient: "from-indigo-950 via-purple-950 to-shift5-dark",
    accent: "#8b5cf6",
  },
  {
    id: "morning",
    category: "MOOD",
    label: "Morning_Calibration",
    title: "Bright Commute",
    subtitle: "Indie-pop and sunbeam guitars. Start your scan strong.",
    seedGenre: "indie pop",
    gradient: "from-amber-900 via-orange-900 to-shift5-dark",
    accent: "#fb923c",
  },
  {
    id: "80s-neon",
    category: "ERA",
    label: "1980_Neon_Archive",
    title: "Synthwave / Neon Grid",
    subtitle: "Analog synths, pulsing basslines, cassette haze.",
    seedGenre: "synthwave",
    gradient: "from-fuchsia-900 via-pink-900 to-shift5-dark",
    accent: "#f472b6",
  },
  {
    id: "90s-underground",
    category: "ERA",
    label: "1990_Underground",
    title: "90s Basement",
    subtitle: "Grunge, trip-hop, shoegaze — the static-warm decade.",
    seedGenre: "shoegaze",
    gradient: "from-teal-900 via-slate-900 to-shift5-dark",
    accent: "#2dd4bf",
  },
  {
    id: "hyperpop",
    category: "GENRE",
    label: "Genre_Frontier",
    title: "Hyperpop Nexus",
    subtitle: "Glitched vocals, pitched chaos, hyper-saturated signals.",
    seedGenre: "hyperpop",
    gradient: "from-pink-900 via-rose-900 to-shift5-dark",
    accent: "#f472b6",
  },
  {
    id: "ambient-drift",
    category: "GENRE",
    label: "Genre_Deep_Field",
    title: "Ambient Drift",
    subtitle: "Atmosphere-first signal. Long-form, slow-motion.",
    seedGenre: "ambient",
    gradient: "from-sky-950 via-cyan-950 to-shift5-dark",
    accent: "#38bdf8",
  },
  {
    id: "nordic-noir",
    category: "REGION",
    label: "Region_Scan // Nordic",
    title: "Nordic Noir",
    subtitle: "Icelandic post-rock, Scandinavian electronica, cold clarity.",
    seedGenre: "nordic",
    gradient: "from-slate-900 via-blue-950 to-shift5-dark",
    accent: "#60a5fa",
  },
  {
    id: "k-wave",
    category: "REGION",
    label: "Region_Scan // Seoul",
    title: "K-Wave Frequencies",
    subtitle: "K-indie, dream pop, hyperpop crossovers from Seoul.",
    seedGenre: "k-pop",
    gradient: "from-rose-900 via-red-900 to-shift5-dark",
    accent: "#fb7185",
  },
];

const ROTATION_MS = 6500;

export default function RotatingBanners() {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [startOffset, setStartOffset] = useState(0);

  // Randomize start offset on mount so the ordering feels different each session.
  // Avoids SSR/CSR mismatch (start at 0 both sides) while still feeling varied.
  useEffect(() => {
    const offset = Math.floor(Math.random() * BANNERS.length);
    if (offset === 0) return;
    // queued to next tick so the effect body itself stays side-effect free
    const id = window.setTimeout(() => setStartOffset(offset), 0);
    return () => window.clearTimeout(id);
  }, []);

  const ordered = BANNERS.map(
    (_, i) => BANNERS[(i + startOffset) % BANNERS.length]
  );

  useEffect(() => {
    if (paused) return;
    const timer = window.setInterval(() => {
      setIndex((n) => (n + 1) % ordered.length);
    }, ROTATION_MS);
    return () => window.clearInterval(timer);
  }, [paused, ordered.length]);

  const active = ordered[index];

  const go = (banner: Banner) => {
    router.push(`/genre/${encodeURIComponent(banner.seedGenre)}`);
  };

  return (
    <div
      className="w-full max-w-[900px] mt-14 sm:mt-20"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="mb-5 sm:mb-6 border-b border-white/[0.06] pb-3 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <div
            className="text-[10px] uppercase"
            style={{
              fontFamily: "var(--font-editorial-mono)",
              letterSpacing: "0.18em",
              color: "var(--color-edit-accent)",
              opacity: 0.85,
            }}
          >
            featured_channels
          </div>
          <div
            className="text-[12px] sm:text-[13px] mt-1"
            style={{
              fontFamily: "var(--font-editorial-body)",
              color: "var(--color-edit-ink-dim)",
            }}
          >
            Curated signals — mood, era, genre, region
          </div>
        </div>
        <span
          className="shrink-0 text-[9px] uppercase"
          style={{
            fontFamily: "var(--font-editorial-mono)",
            letterSpacing: "0.14em",
            color: "var(--color-edit-ink-mute)",
          }}
        >
          {(index + 1).toString().padStart(2, "0")}/{ordered.length.toString().padStart(2, "0")}
        </span>
      </div>

      {/* Primary rotating banner */}
      <button
        onClick={() => go(active)}
        className={`group relative w-full h-[200px] sm:h-[260px] overflow-hidden border border-white/[0.08] text-left cursor-pointer transition-all duration-500 bg-gradient-to-br ${active.gradient} hover:border-white/20`}
        style={{ borderRadius: "2px" }}
      >
        {/* Grid texture */}
        <div className="absolute inset-0 opacity-[0.04] bg-[linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)] bg-[size:32px_32px]" />

        {/* Accent tint (softer) */}
        <div
          className="absolute -top-20 -right-20 w-[320px] h-[320px] rounded-full blur-3xl opacity-20 group-hover:opacity-30 transition-opacity duration-700"
          style={{ backgroundColor: active.accent }}
        />

        {/* Dark scrim bottom */}
        <div className="absolute inset-0 bg-gradient-to-t from-shift5-dark via-shift5-dark/30 to-transparent" />

        <div className="relative z-10 p-5 sm:p-8 h-full flex flex-col justify-between">
          <div className="flex items-center gap-2">
            <span
              className="w-1 h-1 rounded-full"
              style={{ backgroundColor: active.accent }}
            />
            <span
              className="text-[9px] sm:text-[10px] uppercase tracking-[0.22em]"
              style={{
                color: active.accent,
                fontFamily: "var(--font-editorial-mono)",
              }}
            >
              {active.label}
            </span>
            <span
              className="text-[9px] text-white/30 uppercase tracking-widest ml-auto"
              style={{ fontFamily: "var(--font-editorial-mono)" }}
            >
              {active.category}
            </span>
          </div>

          <div>
            <h2
              key={active.id}
              className="text-3xl sm:text-5xl md:text-[56px] leading-[0.98] text-white mb-2 sm:mb-3 animate-fade-in"
              style={{
                fontFamily: "var(--font-editorial)",
                fontWeight: 300,
                letterSpacing: "-0.03em",
              }}
            >
              {active.title}
            </h2>
            <p
              className="text-[12px] sm:text-[13.5px] text-white/65 max-w-[520px] leading-relaxed"
              style={{ fontFamily: "var(--font-editorial-body)" }}
            >
              {active.subtitle}
            </p>
            <div
              className="mt-3 sm:mt-4 inline-flex items-center gap-2 text-[10px] sm:text-[11px] uppercase tracking-[0.16em] text-white/80 group-hover:text-shift5-orange transition-colors"
              style={{ fontFamily: "var(--font-editorial-mono)" }}
            >
              enter_channel <span className="group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </div>
        </div>
      </button>

      {/* Indicator dots */}
      <div className="flex items-center justify-center gap-1.5 mt-4">
        {ordered.map((b, i) => (
          <button
            key={b.id}
            onClick={() => setIndex(i)}
            aria-label={`Show ${b.title}`}
            className={`h-1 transition-all duration-300 ${
              i === index
                ? "w-8 bg-shift5-orange"
                : "w-4 bg-white/20 hover:bg-white/40"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
