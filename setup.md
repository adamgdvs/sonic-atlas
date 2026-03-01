# Sonic Atlas — Setup Guide

## Prerequisites

- **Node.js** 18+ (recommended: 20+)
- **npm** (comes with Node.js)

## Getting Started

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Start the development server**

   ```bash
   npm run dev
   ```

3. **Open in browser**

   Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
src/
├── app/
│   ├── layout.tsx              # Root layout (fonts, metadata)
│   ├── page.tsx                # Home page (search landing)
│   ├── globals.css             # Tailwind + custom animations
│   └── artist/[id]/page.tsx    # Artist detail view
├── components/
│   ├── Header.tsx              # Top navigation bar
│   ├── SearchBar.tsx           # Fuzzy search with autocomplete
│   ├── ArtistCard.tsx          # Similar artist result card
│   ├── GenreTag.tsx            # Color-coded genre label
│   ├── SimilarityBar.tsx       # Similarity score bar
│   ├── PlayButton.tsx          # Audio preview button
│   ├── FilterPill.tsx          # Filter toggle buttons
│   ├── ConstellationGraph.tsx  # SVG ego-centric network graph
│   └── ArtistInitials.tsx      # Colored avatar with initials
├── data/
│   └── mock.ts                 # Mock artist data and genre colors
└── lib/
    └── utils.ts                # Helper functions
```

## Environment Variables

None required for the MVP. All data is served from mock data (`src/data/mock.ts`).

## Available Scripts

- `npm run dev` — Start development server (with Turbopack)
- `npm run build` — Build for production
- `npm run start` — Start production server
- `npm run lint` — Run ESLint

## Tech Stack

- **Next.js 16** (App Router)
- **TypeScript**
- **Tailwind CSS v4**
- **DM Sans + DM Mono** fonts (via `next/font/google`)

## Notes

- This is a frontend-only MVP with mock data
- No database, API routes, or user authentication
- Future phases will add Supabase/PostgreSQL, Deezer audio previews, and more
