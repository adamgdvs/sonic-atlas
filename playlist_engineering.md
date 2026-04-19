# Playlist Engineering Plan

## Goal

Surface useful, playable curated playlists inside `Sonic Atlas` — organized by **mood**, **genre**, and **region/era** — plus one **personalized Daily Discovery** mix seeded by the user's `My Atlas` bookmarks and listening history.

Rather than building a full deterministic recipe/scoring/sequencing engine from scratch, pull curated playlist data from an external source that already does this well: **YouTube Music (via `ytmusicapi`)**. This slots directly into the existing `yt-dlp` streaming pipeline — tracks come back as YT Music `videoId`s and play through the current playback path with no track-matching step.

## Why YouTube Music / ytmusicapi

- Tracks are YT Music `videoId`s → native fit with the current `yt-dlp` streaming proxy
- Curation is already mood / genre / activity organized
- Public library, no paid API key required
- Reads-only; no user-state sync to manage

### Endpoints we will use

- `get_mood_categories()` — top-level categories like "Feel Good", "Workout", "Commute", "Sleep", "Focus"
- `get_mood_playlists(params)` — curated playlists for a selected mood/category
- `get_charts(country)` — top songs / artists / videos per region
- `get_playlist(playlistId)` — full track listing for a curated playlist
- `get_watch_playlist(videoId)` — seed-track radio (Artist/Track Radio analog)
- `search(query, filter="playlists")` — genre/keyword driven playlist discovery

### What we will NOT try to build

Removed from scope (YouTube Music already provides acceptable versions, or we are deferring):

- Custom mood vocabulary + tag-to-mood mapping
- Deterministic scoring/sequencing engine with weighted affinity/novelty/cohesion
- Modular `src/lib/playlist/` (types/recipes/tasteProfile/moods/candidates/scoring/sequencing/explain/generate) split
- `Genre Drift` mode, `Comfort vs Discovery` slider, `Scene Capsule`
- Per-track explainability rationale bullets
- Novelty floor/ceiling enforcement

If any of these are needed later, revisit after the API-driven surface is shipping.

## What We Keep

One rule-based playlist stays in-app:

- **Personalized Daily Discovery** — the existing `buildGeneratedDiscoveryMix` in `src/lib/playlist-engine.ts`, seeded from `My Atlas` bookmarks + recent history. Kept because no external API knows the user's saved graph.

Everything else (Mood, Genre, Region/Charts, Artist Radio) comes from YT Music.

## Architecture

### Layer 1 — ytmusicapi bridge

`ytmusicapi` is Python. We call it from Next.js via a small subprocess-backed service or a thin Python sidecar.

Two acceptable implementations (pick one during build):

1. **Inline subprocess**: Next.js API route spawns `python3 -c "..."` with `ytmusicapi` installed in a local venv. Simple, no extra deploy target.
2. **Python sidecar**: small FastAPI service that the Next.js routes `fetch()` against. Better for caching + warm imports, worth it only if call volume grows.

Start with option 1. Move to option 2 only if cold-start latency becomes a problem.

### Layer 2 — API routes

Add under `src/app/api/playlists/`:

- `GET /api/playlists/moods` → list of mood categories with one representative playlist per category
- `GET /api/playlists/mood/[category]` → playlists for a specific category
- `GET /api/playlists/charts?country=US` → top songs / top artists for region
- `GET /api/playlists/curated/[ytPlaylistId]/tracks` → resolved track list (title, artist, videoId, coverUrl)
- `GET /api/playlists/genre-spotlights` → keyword-driven curated playlists
- `GET /api/playlists/daily-discovery` → existing personalized mix (unchanged)
- `POST /api/playlists/import-curated` → **save a curated playlist into the user's library.** Body: `{ name, description?, coverUrl?, tracks: [{ title, artist, videoId?, coverUrl? }] }`. Creates a `Playlist` row + bulk-inserts `PlaylistTrack` rows in a single transaction. Returns `{ id, name, trackCount }`.

Responses are normalized to the existing track shape the player expects:

```ts
interface PlaylistTrack {
  title: string;
  artist: string;
  videoId: string;
  coverUrl: string | null;
}

interface CuratedPlaylist {
  id: string;            // ytmusic playlistId
  title: string;
  description: string;
  coverUrl: string | null;
  source: "ytmusic" | "atlas";
  category: string;      // "mood" | "genre" | "chart" | "daily_discovery"
  tracks?: PlaylistTrack[]; // only present in detail response
}
```

### Layer 3 — Caching

ytmusicapi calls are slow and mood/chart data moves slowly. Cache aggressively.

- Mood categories list: **24h**
- Playlists for a mood: **6h**
- Charts by country: **6h**
- Playlist track listing: **24h** (playlists update rarely)
- Daily Discovery: **not cached** — regenerated on load (already behavior)

Reuse the existing `dbCache()` in `src/lib/dbCache.ts` (two-tier L1 memory + L2 DB).

### Layer 4 — UI surfaces on Discovery

Add rows to the homepage (`src/app/page.tsx`) between `RotatingBanners` and `DiscoverFeed`:

1. **Curated Moods** — horizontal row of cards, one per `get_mood_categories` entry (Feel Good, Workout, Focus, Sleep, …). Click → opens playlist panel with track list.
2. **Charts by Region** — small card row showing current top artists/songs for the user's country (default US, user-selectable later).
3. **Genre Spotlights** — ~12 hand-picked genre searches (shoegaze, ambient drone, hyperpop, jazz fusion, dream pop, afrobeats, lo-fi hip hop, city pop, post-rock, bossa nova, neo-soul, krautrock) passed through `search(filter="playlists")` and surfaced as cards.

Every curated playlist detail panel exposes two primary actions:

- **`Play_<set>`** — loads the tracks into the global player queue and starts streaming through yt-dlp.
- **`Save_To_My_Atlas`** — imports the playlist into the user's library via `POST /api/playlists/import-curated`. If unauthenticated, redirects to `/login?callbackUrl=...`. After save, the button flips to `In_My_Atlas ✓ / View_Library →` so the user can jump straight to `/my-atlas?tab=playlists`.

The existing **Daily Discovery** panel in `DiscoverFeed` stays where it is.

### Known limitation — duplicate saves

The current `Playlist` model has no `sourcePlaylistId` column, so a user who clicks `Save_To_My_Atlas` on the same curated playlist across separate page loads will get duplicate entries in their library. The in-session button state prevents double-save within a single load, but cross-session dedupe requires a schema migration (add `sourcePlaylistId String?` with a `@@unique([userId, sourcePlaylistId])` constraint). Revisit when duplicate-save becomes a real complaint; for v1 the manual-action framing is acceptable.

## Data Model

No Prisma schema changes required for v1. Curated playlists are not persisted — we cache the ytmusicapi responses and render them on the fly.

If users start "saving" curated playlists into their own library later, reuse the existing `/api/playlists/route.ts` persistence and store `{ sourcePlaylistId, source: "ytmusic" }` in the playlist row.

## Implementation Steps

### Step 1 — Python bridge

- Add `scripts/ytmusic_bridge.py` with functions: `moods()`, `mood_playlists(id)`, `charts(country)`, `playlist_tracks(id)`, `search_playlists(query)`
- Document venv setup in repo README (`python3 -m venv .venv && .venv/bin/pip install ytmusicapi`)

### Step 2 — Node wrapper

- Add `src/lib/ytmusic.ts` with async functions that spawn the Python bridge and parse JSON stdout
- Wrap each function with `dbCache()` using the cache durations above

### Step 3 — API routes

- `src/app/api/playlists/moods/route.ts`
- `src/app/api/playlists/mood/[category]/route.ts`
- `src/app/api/playlists/charts/route.ts`
- `src/app/api/playlists/curated/[id]/tracks/route.ts`
- `src/app/api/playlists/genre-spotlights/route.ts`
- `src/app/api/playlists/import-curated/route.ts` — save a curated playlist into the user's library

### Step 4 — UI components

- `src/components/CuratedMoodsRow.tsx` — horizontal mood card strip
- `src/components/ChartsRow.tsx` — region charts strip
- `src/components/GenreSpotlightsRow.tsx` — genre-keyword-driven curated playlists
- `src/components/SaveCuratedButton.tsx` — shared `Save_To_My_Atlas` action used by all three rows; handles auth redirect + idle/saving/saved/error states

### Step 5 — Wire into homepage

- Insert the three new rows into `src/app/page.tsx`
- Leave `Daily Discovery` / `YourAtlasRotation` / `GenreCards` in place for now

## Quality Constraints

1. Every rendered playlist must have ≥ 1 playable `videoId` track; otherwise hide the card
2. Trim YT Music responses to our `PlaylistTrack` shape before returning to the client — never leak raw ytmusicapi blobs
3. Respect cache TTLs; do not call the Python bridge on every request
4. Fail soft: if the Python bridge errors, the row hides itself rather than breaking the page
5. **Session stability — no in-session regeneration.** Curated playlists, mood rows, chart rows, genre spotlights, and the personalized Daily Discovery mix are all fetched/sampled **once on page load** and remain stable until the user navigates away or refreshes. No `setInterval`-driven reshuffle, re-sample, or re-roll while the user is on the page. Manual reshuffle buttons may be exposed for user-initiated re-rolls, but they must never fire automatically.
   - Rationale: the user expects a predictable surface. Content shifting underneath them while they're reading or deciding what to play is disorienting.
   - Applies to: `CuratedMoodsRow`, `ChartsRow`, `GenreSpotlightsRow`, `YourAtlasRotation`, `DiscoverFeed` generated mix.
   - Exception: the `RotatingBanners` hero carousel cycles through a fixed array of hand-curated banners — this is a display carousel, not regeneration, and is permitted.

## Rollout

### Phase 1

- Python bridge + Node wrapper + `/api/playlists/moods` + `CuratedMoodsRow` on homepage

### Phase 2

- Charts row + Genre Spotlights row
- Cache-warming cron (optional)

### Phase 3 (only if needed)

- Python sidecar service if subprocess cold-start is too slow
- Persisted "saved curated playlist" flow

## Risks & Mitigations

### Risk: ytmusicapi breaks due to YT Music frontend changes

Mitigation: pin a ytmusicapi version; cache aggressively so outages are absorbed; fail soft in UI.

### Risk: Subprocess spawn overhead on every API call

Mitigation: caching makes most requests never hit Python. If P95 is still bad, move to the sidecar (Phase 3).

### Risk: Regional curation differences

Mitigation: accept a `country` query param (default `US`), expose as a user setting later.

## Summary

- Drop the full rule-based recipe/scoring/sequencing engine plan
- Use **ytmusicapi** for mood, genre, and region/chart curation — tracks plug into the existing yt-dlp playback path
- Keep the **personalized Daily Discovery** rule-based mix as the one in-app generator
- Normalize, cache, and render as card rows on the Discovery homepage
