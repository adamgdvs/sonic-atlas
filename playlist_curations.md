# Playlist Curation Work

This document summarizes the playlist-focused work implemented around Sonic Atlas's Discovery and playlist surfaces. The goal of this pass was to improve playlist quality, make curated collections easier to find, and make result selection feel like a real curated-playlist product without changing the existing UI design language.

## Core Curation Improvements

### 1. Expanded the curated catalog substantially

The catalog was broadened so Discovery and playlist browsing can surface more recognizable, search-friendly collections across moods, eras, vibes, and genres.

Examples now covered include:

- `90's HipHop`
- `Midnight Roadtrip`
- `Indie Rock`
- `Garage Bands`
- `Happy Days`
- `Dream Pop`
- `Bossa Nights`
- `Post-Punk Wire`
- `Afro House`
- `Soul Revival`
- `Window Seat`
- `Moonlit Disco`
- `Velvet Weather`
- `Soft Landing`
- `60's Soul`
- `80's New Wave`
- `90's R&B`
- `2000's Emo`

This expansion gives the app a wider set of editorial-style starting points and improves coverage across user tastes.

### 2. Added richer curation metadata to catalog entries

Catalog entries are no longer just a title and search query. Many now include:

- `aliases`
- `requiredTerms`
- `preferredTerms`
- `excludedTerms`
- `minTracks`
- `idealTrackRange`

This metadata helps the resolver distinguish between multiple possible playlist matches and prefer candidates that actually fit the intended theme.

Examples:

- `90's HipHop` prefers terms like `golden era`, `boom bap`, and penalizes modern mismatches like `trap` or `drill`
- `Happy Days` prefers upbeat/feel-good phrasing and deprioritizes sad or heartbreak playlists
- `Focus Flow` favors instrumental/deep-focus results and avoids party/workout mismatches

## Resolver and Ranking Improvements

### 3. Added a reusable playlist ranking engine

Created:

- `src/lib/playlist-ranking.ts`

This ranking layer scores candidate playlists based on:

- exact title or query matches
- required-term coverage
- preferred-term coverage
- excluded-term penalties
- cover art presence
- description richness
- track count quality

This replaced weaker "take the first acceptable result" behavior with actual candidate comparison.

### 4. Enforced a stronger playlist size floor

The playlist system now treats short playlists as lower quality for curated discovery. The active rules are:

- minimum curated length: `40` tracks
- ideal range for most playlists: `40-100` tracks

Behavior:

- playlists under `40` tracks are heavily penalized or excluded
- playlists in the `40-100` range are preferred
- very oversized playlists are allowed but scored less favorably when they drift too far from the ideal range

This aligns better with the goal of making curated playlists feel substantial and reusable.

### 5. Centralized playlist resolution into a shared helper

Created:

- `src/lib/curated-resolver.ts`

This new shared resolver now:

- builds normalized ranking entries
- runs YouTube Music playlist search
- applies the shared ranking model
- enforces confidence and track-count thresholds consistently

This removed duplicated resolver logic from multiple API routes and makes future tuning easier.

## API and Discovery Surface Improvements

### 6. Improved catalog resolution

Updated:

- `src/app/api/playlists/catalog/route.ts`

Changes:

- catalog entries now resolve through the shared helper
- top-ranked candidates are selected instead of the first match
- debug candidate summaries remain available in non-production environments

This improves consistency when multiple candidate playlists exist for the same curation.

### 7. Improved curated collection generation

Updated:

- `src/app/api/playlists/collections/route.ts`

Changes:

- curated preset collections now use the same shared ranking helper
- collection picks respect the same quality floor
- featured, genre, mood, activity, and era presets are resolved more consistently

This makes collection rows more reliable and less likely to surface weak matches.

### 8. Improved playlist search quality

Updated:

- `src/app/api/playlists/search/route.ts`

Changes:

- search results are now ranked with the same resolver logic
- search results under `40` tracks are filtered out
- top results are chosen by fit instead of raw upstream order

This makes search more useful for curated playlist discovery.

## Discovery UX Support Already Added

These playlist-facing surfaces were also added or improved to make curated content easier to locate:

- `src/components/CuratedPlaylistsHub.tsx`
- `src/app/playlists/page.tsx`
- `src/components/Header.tsx`

Notable outcomes:

- curated playlists are easier to browse from Discovery/Home
- playlist themes are easier to search using recognizable labels
- desktop navigation exposes playlist access more clearly

## YT Music Integration Work Supporting Curation

The curation system also relies on the YouTube Music bridge and cache-backed helpers already added in this project:

- `scripts/ytmusic_bridge.py`
- `src/lib/ytmusic.ts`

Related endpoints supporting curation/discovery include:

- `src/app/api/playlists/moods/route.ts`
- `src/app/api/playlists/mood/[category]/route.ts`
- `src/app/api/playlists/charts/route.ts`
- `src/app/api/playlists/curated/[id]/tracks/route.ts`
- `src/app/api/playlists/genre-spotlights/route.ts`
- `src/app/api/playlists/catalog/route.ts`
- `src/app/api/playlists/collections/route.ts`
- `src/app/api/playlists/search/route.ts`

## Why This Matters

These changes move Sonic Atlas closer to a real curated-playlist product instead of a thin playlist search layer.

The main improvements are:

- better curation breadth
- more recognizable playlist concepts
- stronger result quality control
- better consistency across discovery, collections, and search
- more reliable long-form playlists appropriate for repeated listening

## Verification Completed

Verified during this pass:

- `npx eslint src/lib/curated-resolver.ts src/app/api/playlists/catalog/route.ts src/app/api/playlists/collections/route.ts src/app/api/playlists/search/route.ts`

No UI colors, visual style, or aesthetic system changes were made in this pass.
