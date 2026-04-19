import { NextResponse } from "next/server";
import {
  CURATED_CATALOG,
  PRIORITY_CURATED_SLUGS,
  type CatalogEntry,
} from "@/lib/curated-catalog";
import { resolveVirtualCuratedPlaylist } from "@/lib/virtual-curated";
import { getCharts, getMoodCards } from "@/lib/ytmusic";
import { cleanExpiredCache } from "@/lib/dbCache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV !== "production";

  const authHeader = request.headers.get("authorization");
  const bearer = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const headerSecret = request.headers.get("x-cron-secret");
  const querySecret = new URL(request.url).searchParams.get("secret");

  return bearer === secret || headerSecret === secret || querySecret === secret;
}

function getPriorityEntries(limit?: number) {
  const prioritySet = new Set(PRIORITY_CURATED_SLUGS);
  const ordered = PRIORITY_CURATED_SLUGS
    .map((slug) => CURATED_CATALOG.find((entry) => entry.slug === slug))
    .filter((entry): entry is CatalogEntry => Boolean(entry));

  const fallback = CURATED_CATALOG.filter((entry) => prioritySet.has(entry.slug));
  const merged = [...new Map([...ordered, ...fallback].map((entry) => [entry.slug, entry])).values()];
  return typeof limit === "number" ? merged.slice(0, limit) : merged;
}

async function warmCuratedEntries(entries: CatalogEntry[]) {
  const results = await Promise.allSettled(
    entries.map((entry) =>
      resolveVirtualCuratedPlaylist({
        title: entry.title,
        description: entry.subtitle,
        category: entry.category,
        query: entry.searchQuery,
      })
    )
  );

  const fulfilled = results.filter((result) => result.status === "fulfilled").length;
  return {
    attempted: entries.length,
    fulfilled,
    failed: entries.length - fulfilled,
  };
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const scope = url.searchParams.get("scope") || "daily";

  const summary: Record<string, unknown> = {
    scope,
    ranAt: new Date().toISOString(),
  };

  if (scope === "daily") {
    summary.charts = await getCharts("US")
      .then((data) => ({
        country: data.country,
        songs: data.songs.length,
        videos: data.videos.length,
        artists: data.artists.length,
      }))
      .catch((error) => ({ error: error instanceof Error ? error.message : "charts failed" }));

    summary.editorial = await warmCuratedEntries(getPriorityEntries(12));
  } else if (scope === "weekly") {
    summary.moods = await getMoodCards()
      .then((cards) => ({ cards: cards.length }))
      .catch((error) => ({ error: error instanceof Error ? error.message : "moods failed" }));

    summary.editorial = await warmCuratedEntries(getPriorityEntries());
  } else if (scope === "full") {
    summary.moods = await getMoodCards()
      .then((cards) => ({ cards: cards.length }))
      .catch((error) => ({ error: error instanceof Error ? error.message : "moods failed" }));
    summary.charts = await getCharts("US")
      .then((data) => ({
        country: data.country,
        songs: data.songs.length,
        videos: data.videos.length,
        artists: data.artists.length,
      }))
      .catch((error) => ({ error: error instanceof Error ? error.message : "charts failed" }));
    summary.editorial = await warmCuratedEntries(getPriorityEntries());
  } else {
    return NextResponse.json({ error: "Invalid scope" }, { status: 400 });
  }

  summary.cleanedExpiredCache = await cleanExpiredCache().catch(() => 0);

  return NextResponse.json(summary);
}
