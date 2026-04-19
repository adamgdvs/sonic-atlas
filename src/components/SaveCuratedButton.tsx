"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

interface CuratedTrack {
  title: string;
  artist: string;
  videoId?: string;
  coverUrl?: string | null;
}

interface Props {
  name: string;
  description?: string;
  coverUrl?: string | null;
  tracks: CuratedTrack[];
  className?: string;
}

type State = "idle" | "saving" | "saved" | "error";

export default function SaveCuratedButton({
  name,
  description,
  coverUrl,
  tracks,
  className,
}: Props) {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const [state, setState] = useState<State>("idle");

  async function handleSave() {
    if (sessionStatus === "loading" || state === "saving" || state === "saved") return;

    if (!session?.user) {
      const cb =
        typeof window !== "undefined" ? encodeURIComponent(window.location.pathname) : "/";
      router.push(`/login?callbackUrl=${cb}`);
      return;
    }

    if (tracks.length === 0) return;

    setState("saving");
    try {
      const res = await fetch("/api/playlists/import-curated", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, coverUrl, tracks }),
      });

      if (!res.ok) {
        setState("error");
        return;
      }

      await res.json().catch(() => null);
      setState("saved");
    } catch {
      setState("error");
    }
  }

  function handleOpenLibrary(event: React.MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    router.push("/my-atlas?tab=playlists");
  }

  if (state === "saved") {
    return (
      <div className={`flex gap-2 ${className ?? ""}`}>
        <span className="px-5 py-3 border-2 border-shift5-orange text-shift5-orange font-mono text-[10px] font-bold uppercase tracking-[0.2em] inline-flex items-center justify-center">
          In_My_Atlas ✓
        </span>
        <button
          onClick={handleOpenLibrary}
          className="px-5 py-3 border-2 border-white/20 text-white/80 hover:border-white/50 hover:text-white font-mono text-[10px] font-bold uppercase tracking-[0.2em] transition-colors cursor-pointer"
        >
          View_Library →
        </button>
      </div>
    );
  }

  let label: string;
  if (state === "saving") label = "Saving...";
  else if (state === "error") label = "Retry_Save";
  else label = "Save_To_My_Atlas";

  return (
    <button
      onClick={handleSave}
      disabled={state === "saving" || tracks.length === 0}
      className={`px-5 py-3 border-2 border-white/20 text-white/90 hover:border-shift5-orange hover:text-shift5-orange font-mono text-[10px] font-bold uppercase tracking-[0.2em] transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${className ?? ""}`}
    >
      {label}
    </button>
  );
}
