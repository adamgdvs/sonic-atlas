import { NextResponse } from "next/server";
import { CURATED_CATALOG, type CatalogCategory } from "@/lib/curated-catalog";
import { buildVirtualCuratedPlaylist } from "@/lib/virtual-curated";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Map hub collection tabs to catalog categories
const COLLECTION_CATEGORY_MAP: Record<string, CatalogCategory[]> = {
  featured: ["mood", "vibe", "genre", "era"],
  mood:     ["mood"],
  genre:    ["genre"],
  activity: ["vibe"],
  era:      ["era"],
};

// For the "featured" tab, prefer entries marked featured or pick top variety
function selectFeatured(limit: number) {
  const featured = CURATED_CATALOG.filter((e) => e.featured);
  if (featured.length >= limit) return featured.slice(0, limit);

  // Fill remaining slots with variety across all categories
  const used = new Set(featured.map((e) => e.slug));
  const categoryCounts: Record<string, number> = {};
  const fill: typeof CURATED_CATALOG = [];

  for (const entry of CURATED_CATALOG) {
    if (used.has(entry.slug)) continue;
    const count = categoryCounts[entry.category] || 0;
    if (count >= 12) continue; // cap per category for variety
    categoryCounts[entry.category] = count + 1;
    fill.push(entry);
    if (featured.length + fill.length >= limit) break;
  }

  return [...featured, ...fill].slice(0, limit);
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const collection = (searchParams.get("collection") || "featured").toLowerCase();
  const limitParam = Number.parseInt(searchParams.get("limit") || "0", 10);
  const offsetParam = Number.parseInt(searchParams.get("offset") || "0", 10);
  const availableCollections = ["featured", "genre", "mood", "activity", "era"];

  const pageSize = limitParam > 0 ? Math.min(limitParam, 100) : 60;
  const offset = offsetParam > 0 ? offsetParam : 0;

  try {
    let entries;
    if (collection === "all") {
      entries = CURATED_CATALOG;
    } else if (collection === "featured") {
      entries = selectFeatured(200);
    } else {
      const categories = COLLECTION_CATEGORY_MAP[collection] || [];
      entries = CURATED_CATALOG.filter((e) => categories.includes(e.category));
    }

    const page = entries.slice(offset, offset + pageSize);
    const collections = page.map((entry) => ({
      label: entry.title,
      query: entry.searchQuery,
      category: entry.category,
      tone: entry.subtitle,
      playlist: buildVirtualCuratedPlaylist({
        title: entry.title,
        description: entry.subtitle,
        category: entry.category,
        query: entry.searchQuery,
      }),
    }));

    return NextResponse.json({
      collection,
      collections,
      total: entries.length,
      offset,
      pageSize,
      hasMore: offset + pageSize < entries.length,
      availableCollections,
    });
  } catch (error) {
    console.error("Failed to load curated collections:", error);
    return NextResponse.json({ collection, collections: [], total: 0, availableCollections });
  }
}
