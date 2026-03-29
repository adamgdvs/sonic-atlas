# Sonic Atlas

Music discovery platform for exploring similar artists, genres, and sonic neighborhoods.

## Tech Stack

- **Framework**: Next.js 16 (App Router) with React 19
- **Language**: TypeScript (strict — no `any` types)
- **Database**: PostgreSQL via Prisma ORM
- **Auth**: NextAuth v4 with credentials provider + Prisma adapter
- **Styling**: Tailwind CSS v4 with custom design system ("Shift5" — dark theme, orange accent `#ff5841`)
- **Visualization**: D3.js force-directed graphs for artist constellation maps
- **Animation**: Framer Motion

## External APIs

- **Last.fm** (required) — artist search, similar artists, top tags, autocomplete
- **Deezer** — artist images, top tracks, albums, track previews
- **Discogs** — genre/style enrichment, artist bios, member/group relationships
- **EveryNoise** — micro-genre mapping
- **iTunes** — fallback track previews
- **Ticketmaster** — concert/event data

## Project Structure

```
src/
  app/           # Next.js App Router pages and API routes
    api/         # REST API endpoints (artist, genre, search, bookmarks, auth, feed)
    artist/      # Artist detail page
    genre/       # Genre detail page
    my-atlas/    # User's bookmarked artists dashboard
    frequency/   # Global frequency hub
  components/    # React components (ConstellationGraph, ArtistDrawer, GenreDrawer, etc.)
  lib/           # API clients, utilities, caching (lastfm, deezer, discogs, etc.)
  contexts/      # React contexts (JourneyContext)
  providers/     # Global providers (session, theme, journey)
prisma/          # Prisma schema and migrations
```

## Key Patterns

- **Caching**: Two-tier — L1 in-memory Map caches + L2 database cache via `dbCache()` in `src/lib/dbCache.ts`
- **Niche Depth Slider**: Similar artist scoring uses a configurable depth factor (0-100) that shifts weight between Last.fm popularity and genre similarity
- **D3 Force Layouts**: Used in ConstellationGraph and HomeConstellationGraph. Post-simulation, link `source`/`target` are mutated from string IDs to node objects — typed via `SimLink` interfaces
- **Rate Limiting**: Middleware at `src/middleware.ts` applies per-IP rate limiting to all `/api/*` routes

## Commands

```bash
npm run dev      # Start dev server
npm run build    # Production build
npm run lint     # Run ESLint
```

## Conventions

- Design system uses "Shift5" aesthetic: dark backgrounds, monospace labels, uppercase tracking, orange accent
- Component labels use underscore-separated uppercase (e.g., `System_Error`, `Node_Ident`)
- API routes use Next.js route handlers with `params: Promise<{ name: string }>` pattern
- Bookmark data flows: API → `{ id, name, genres (JSON string), imageUrl, createdAt }`
