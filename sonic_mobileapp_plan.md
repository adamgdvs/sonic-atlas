# Sonic Atlas — Mobile App Plan
**Target: Android first, iOS follow**

---

## 1. What Sonic Atlas Is Today

Sonic Atlas is a music discovery platform built on Next.js 16 (App Router). It lets users explore artists by genre and mood, discover similar artists via a constellation graph, browse and play curated playlists, and track their listening activity. Here is everything that currently works:

### Features

| Feature | Description |
|---|---|
| Artist Discovery | Search artists, view bios, discography, similar artists, top tracks |
| Constellation Graph | D3 force-directed graph of sonic relationships between artists |
| Genre Explorer | Browse genres/micro-genres, view top artists per genre |
| Curated Playlists | 418-entry catalog (mood, genre, era, activity, scene, world music) resolved via YouTube Music |
| Live Deezer Search | Real-time Deezer editorial playlist search (50 results, paginated, cached) |
| Track Playback | Full-length YouTube Music streams via yt-dlp + Node.js proxy; 30-sec Deezer previews |
| Radio Mode | Auto-queues similar artists endlessly |
| Queue / History | Full playback queue management, listening history tracking |
| Frequency Hub | Global scan events, activity feed across all users |
| My Atlas | Personal bookmarked artists, created/saved playlists |
| Authentication | Email/password via NextAuth + PostgreSQL |
| Playlist CRUD | Create, edit, save curated sets, import from Deezer |
| Tour Dates | Artist concert events via Ticketmaster |

### External APIs in Use

| API | Purpose | Auth Required |
|---|---|---|
| Last.fm | Artist data, similar artists, top tags, autocomplete | API key |
| YouTube Music (Innertube) | Full track streaming, playlist resolution | None (public) |
| yt-dlp | Audio stream extraction from YouTube | None |
| Deezer | Playlist search, track previews, artist images | None (public) |
| Discogs | Genre enrichment, artist bios, group members | API key |
| MusicBrainz | Track/artist metadata | None |
| iTunes | Artwork, track previews (fallback) | None |
| Ticketmaster | Tour dates and concert events | API key |
| Every Noise at Once | Micro-genre mapping | None |
| Spotify | Audio feature scoring (energy, valence) for re-ranking | Client credentials |

### Current Tech Stack

- **Framework**: Next.js 16, React 19, TypeScript (strict)
- **Database**: PostgreSQL + Prisma ORM
- **Auth**: NextAuth v4
- **Styling**: Tailwind CSS v4 ("Shift5" dark design system)
- **Visualization**: D3.js
- **Animation**: Framer Motion
- **Caching**: Two-tier — in-memory L1 + PostgreSQL L2 via `dbCache()`
- **Hosting**: Vercel (frontend + API routes), Neon/Supabase PostgreSQL

---

## 2. Mobile App Architecture Options

There are three realistic paths to a Sonic Atlas mobile app. Each has trade-offs.

### Option A — React Native (Recommended)
Re-use existing React/TypeScript knowledge and most business logic. Shared codebase with the web app over time.

**Stack**: React Native + Expo, TypeScript, React Navigation, Zustand or React Query

**Pros**
- Existing Next.js API backend works unchanged — the app is just a new frontend
- Large ecosystem, good audio libraries
- Expo simplifies Android/iOS builds significantly
- Code sharing possible with the web app (hooks, API client, types)

**Cons**
- D3.js constellation graph requires a complete rewrite using React Native Skia or SVG
- Some platform-specific work needed for audio background playback

---

### Option B — Flutter
Best raw performance and most native-feeling UI on both Android and iOS.

**Stack**: Flutter (Dart), same REST API backend

**Pros**
- Excellent performance, truly native rendering
- Strong audio playback ecosystem (`just_audio`, background service)
- Single codebase for Android + iOS

**Cons**
- Dart — completely different language, no code sharing with existing web app
- Larger initial investment to rebuild all components

---

### Option C — Capacitor (Progressive Web App shell)
Wrap the existing Next.js app in a native WebView shell.

**Pros**
- Fastest path to an app store listing — weeks not months
- Zero frontend rewrite

**Cons**
- Does not feel like a native app — WebView performance is noticeably worse
- Audio background playback is unreliable in WebViews
- App stores (especially Apple) scrutinise thin WebView wrappers

**Verdict**: Viable as a quick proof of concept but not recommended for a real product.

---

## 3. Recommended Approach — React Native + Expo

Build a native React Native app that talks to the existing Sonic Atlas backend. The web app and mobile app share the same API, database, and authentication.

```
┌─────────────────────────┐     ┌─────────────────────────┐
│   Sonic Atlas Web       │     │   Sonic Atlas Android   │
│   (Next.js / Vercel)    │     │   (React Native / Expo) │
└────────────┬────────────┘     └────────────┬────────────┘
             │                               │
             └──────────────┬────────────────┘
                            │  HTTPS REST API
                  ┌─────────▼──────────┐
                  │  Sonic Atlas API   │
                  │  (Next.js routes   │
                  │   on Vercel)       │
                  └─────────┬──────────┘
                            │
                  ┌─────────▼──────────┐
                  │  PostgreSQL        │
                  │  (Neon/Supabase)   │
                  └────────────────────┘
```

---

## 4. Screen-by-Screen Mobile Breakdown

### Bottom Tab Navigation
```
[ Discover ] [ Search ] [ Playlists ] [ My Atlas ] [ Now Playing ]
```

---

### Discover (Home)
- Featured curated playlists grid (existing `/api/playlists/collections?collection=featured`)
- Genre quick-links (existing `/api/genres`)
- "What's Trending" pull from Frequency Hub
- Artist of the day / recommended

### Search
- Global search bar (existing `/api/search/autocomplete`)
- Results: Artists, Genres, Playlists, Deezer playlists
- Quick-query chips (same as web hub)
- Live Deezer playlist search as user types

### Playlists Hub
- Tab bar: Featured / Genre / Mood / Activity / Era / Live Search
- Scrollable card grid — same data from `/api/playlists/collections`
- Tap card → opens Now Playing with track list
- Search across all 418 catalog entries + live Deezer

### Artist Detail
- Header: artist photo (Deezer), name, genres, follower count
- Top Tracks — playable
- Similar Artists — horizontal scroll, tappable
- Bio, Discography, Tour Dates
- Bookmark / Vote buttons

### My Atlas
- Auth-gated: login/signup screen if unauthenticated
- Bookmarked artists
- Created playlists
- Saved curated sets
- Listening history

### Now Playing (Persistent mini-player + full-screen modal)
- Album art, title, artist
- Scrubber / progress bar
- Controls: prev, play/pause, next, shuffle, repeat
- Queue panel (swipe up)
- Radio mode toggle
- "Add to playlist" button

### Constellation Graph *(Phase 2)*
- Interactive artist relationship graph
- React Native Skia or `react-native-svg` for D3 recreation
- Pinch-to-zoom, tap node to navigate to artist

---

## 5. Audio Playback on Mobile

This is the most critical and complex piece. The current web app uses two systems:

| Source | Web | Mobile equivalent |
|---|---|---|
| YouTube Music (full tracks) | yt-dlp + Node.js proxy → HTML5 `<audio>` | Stream URL from `/api/stream/[videoId]` → `expo-av` or `react-native-track-player` |
| Deezer previews (30 sec) | HTML5 `<audio>` | Direct URL → `expo-av` |

### Recommended: `react-native-track-player`
The most battle-tested audio library for React Native. Features:
- **Background playback** — keeps playing when screen is off or app is backgrounded
- **Lock screen controls** — Android media session + iOS Control Centre
- **Notification controls** — playback controls in the notification drawer
- **Queue management** — built-in, mirrors the web app's queue system
- **Gapless playback** — smooth transitions between tracks

The existing `/api/stream/[videoId]` endpoint already returns an audio stream URL. The mobile app points `react-native-track-player` at that URL — no backend changes needed.

---

## 6. Authentication on Mobile

The current NextAuth setup uses cookies for session management. Mobile apps need tokens.

**Recommended change**: Add JWT-based API auth alongside the existing cookie session.

- User logs in → app receives a JWT access token + refresh token
- All API calls include `Authorization: Bearer <token>` header
- Refresh token stored securely in device keychain (`expo-secure-store`)
- Existing NextAuth session stays unchanged for web

This is a backend-only addition — roughly a new `/api/auth/token` route.

---

## 7. API Changes Needed

The existing API is mostly mobile-ready as-is. The following additions/changes are needed:

| Change | Reason |
|---|---|
| JWT token endpoint (`/api/auth/token`) | Mobile needs token-based auth, not cookies |
| Pagination on artist/genre endpoints | Mobile infinite scroll needs cursor-based pagination |
| `Content-Type: audio/*` headers on stream route | Some Android media players require explicit content type |
| Push notification endpoint | For "new releases from bookmarked artists" notifications |
| Image optimisation params on API responses | Mobile bandwidth — return smaller images where possible |

No API routes need to be rewritten. These are additive changes.

---

## 8. New Mobile-Only Dependencies

### Core
| Package | Purpose |
|---|---|
| `expo` | Build toolchain, OTA updates, managed workflow |
| `expo-router` | File-based routing (mirrors Next.js familiarity) |
| `react-native-track-player` | Background audio, lock screen controls, queue |
| `expo-secure-store` | Secure token storage (keychain/keystore) |
| `@tanstack/react-query` | API data fetching, caching, background refresh |
| `zustand` | Global state (player state, auth, queue) |

### UI
| Package | Purpose |
|---|---|
| `react-native-reanimated` | Smooth animations (player transitions, card swipes) |
| `react-native-gesture-handler` | Swipe gestures for queue, bottom sheet |
| `@gorhom/bottom-sheet` | Now Playing full-screen modal, queue panel |
| `react-native-skia` | Constellation graph rendering (Phase 2) |
| `expo-image` | Optimised image loading with blurhash placeholders |

### UX
| Package | Purpose |
|---|---|
| `react-native-haptic-feedback` | Subtle haptics on play, bookmark, swipe |
| `expo-notifications` | Push notifications for new releases |
| `expo-splash-screen` | Branded loading experience |

---

## 9. Phased Rollout Plan

### Phase 1 — Android MVP (8–12 weeks)
- [ ] Expo project setup, navigation skeleton, design system port
- [ ] Auth screens (login, signup) with JWT token flow
- [ ] Discover screen pulling from existing API
- [ ] Playlist Hub — browse + search (catalog + Deezer)
- [ ] Track playback via `react-native-track-player` + `/api/stream`
- [ ] Mini-player + Now Playing screen
- [ ] Queue management
- [ ] My Atlas — bookmarks, saved playlists
- [ ] Play store submission

### Phase 2 — Polish + iOS (4–6 weeks)
- [ ] iOS build + App Store submission
- [ ] Constellation graph (React Native Skia)
- [ ] Artist detail page — full feature parity
- [ ] Radio mode
- [ ] Push notifications
- [ ] Offline mode for saved playlists (cache tracks)
- [ ] Widget (Android home screen, iOS lock screen)

### Phase 3 — Growth (ongoing)
- [ ] Social features — shared playlists, follow friends
- [ ] Personalised recommendations (based on listening history)
- [ ] Apple Music / Spotify playlist import
- [ ] CarPlay / Android Auto integration

---

## 10. Backend Hosting Notes

The Vercel-hosted Next.js API requires no changes to serve a mobile app — it already handles CORS via standard headers. The only consideration:

- **Streaming route** (`/api/stream/[videoId]`): Vercel functions have a 60-second timeout on the free tier. If audio proxying times out, move the stream proxy to a long-running service (Railway, Fly.io, or a dedicated VPS). The rest of the API can stay on Vercel.
- **Database**: The existing PostgreSQL (Neon/Supabase) handles mobile traffic the same as web traffic.
- **Cache warming**: Existing Vercel cron jobs keep the catalog warm for both web and mobile.

---

## 11. Design System on Mobile

The web app uses the "Shift5" design system — dark backgrounds, orange `#ff5841` accent, monospace uppercase labels. This translates cleanly to mobile:

- Background: `#121212`
- Surface: `rgba(255,255,255,0.03)`
- Accent: `#ff5841`
- Text primary: `#ffffff`
- Text muted: `rgba(255,255,255,0.45)`
- Font: `JetBrains Mono` or `SpaceMono` (both available via `expo-google-fonts`)
- Border radius: 2px (intentionally sharp)
- Cards: deterministic gradient colors (same `getGenreColor()` hash function, portable to JS)

---

## 12. Summary

| Item | Status |
|---|---|
| Backend API | ✅ Ready — no rewrite needed |
| Database | ✅ Ready |
| Auth | ⚠️ Add JWT token endpoint |
| Audio streaming | ✅ Ready — existing stream proxy works |
| Curated playlists | ✅ Ready |
| Deezer search | ✅ Ready |
| Constellation graph | 🔄 Requires rewrite in React Native Skia |
| Design system | ✅ Portable |
| Recommended framework | **React Native + Expo** |
| Android target | **API level 26+** (Android 8.0, covers ~95% of devices) |
| iOS target | **iOS 15+** (Phase 2) |
