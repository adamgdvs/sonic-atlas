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

#### Mini-Player (always visible at bottom)
- Spinning vinyl thumbnail — album art cropped to circle, rotates at 8 RPM while playing, eases to a stop on pause
- Vinyl groove overlay rendered on top of the art (radial gradient rings)
- Center spindle dot
- Track title + artist, animated slide-in on track change
- Play/Pause button
- Skip forward button
- Progress bar at top edge (3px orange fill)
- **Swipe left** → skip to next track
- **Swipe right** → go to previous track
- **Tap** → expands to full-screen player

#### Full-Screen Player (slides up from bottom)
- Drag handle at top — drag down to collapse
- Blurred album art background (80px blur, 40% opacity, covers entire screen)
- Dark gradient overlay over blur
- **Vinyl record assembly** (the centrepiece):
  - Outer vinyl disc: `radial-gradient` with layered groove rings (dark concentric bands), extends 12% beyond the art circle
  - Orange center label with inner spindle hole
  - Three white hairline groove rings at 15%, 25%, 35% inset
  - Light reflection shimmer: `linear-gradient(135deg, rgba(255,255,255,0.06)...)`
  - Album art on top: circular clip, full rotation at 12 RPM while playing
  - Vinyl groove overlay on the art itself (radial gradient rings at 38–42%)
  - Center spindle: dark circle, white inner dot, `backdrop-blur`
  - Loading spinner overlay when fetching next track
  - **Pulsing orange glow ring** when playing: `box-shadow: 0 0 40px rgba(255,88,65,0.15), 0 0 80px rgba(255,88,65,0.08)`, oscillates opacity 0.3→0.6→0.3 over 3 seconds
- Track title + artist (animated fade+slide on change), artist name links to artist page
- Seekbar: 5px height, orange fill, white thumb dot, touch-draggable
- Time elapsed / time remaining (countdown)
- Transport controls: Shuffle | Prev | Play/Pause (64px orange circle) | Next | Repeat
- Bottom icon row: Queue (badge with count) | History | Radio | Surge ⚡ | Save to playlist
- Safe area inset padding (notch/home bar aware)

### Constellation Graph *(Phase 2)*
- Interactive artist relationship graph — D3 force-directed simulation (web) needs a full rewrite in React Native
- **Web implementation**: `d3-force`, SVG `<circle>` nodes, `<line>` edges, drag + zoom behaviours
- **Mobile rewrite options**: `react-native-skia` (GPU-accelerated canvas, recommended) or `react-native-svg` (simpler, slower at scale)
- Node types: primary (tapped artist, large orange), similar (smaller white), genre cluster nodes
- Edges weighted by Last.fm similarity score — stroke opacity maps to weight
- Pinch-to-zoom, pan, tap node → push Artist Detail screen
- Depth controlled by the Niche Depth Slider (0 = mainstream neighbours, 100 = deep cuts)
- Data: existing `/api/artist/[name]/similar` endpoint — no backend changes needed

### Frequency Hub
- Global real-time activity feed — "who is scanning what right now"
- Events logged on every artist scan/play: `{ userId, artistName, genres, timestamp }`
- Mobile: flat scrollable list (same data as web `/api/feed`)
- Live updates via polling (every 30s) or WebSocket (Phase 2)
- Each event card shows: artist image, name, genre chips, time ago, user avatar

### Surge ⚡
- The ⚡ button in the Now Playing screen (web and mobile)
- One tap randomly picks a track from a **related genre** of the current artist — instant discovery
- Algorithm: takes current artist's top tags → picks a random tag → fetches top tracks for that genre → picks randomly weighted by Last.fm play count
- API: hits existing `/api/genre/[name]/tracks` or similar — no new endpoint needed
- Mobile: same button visible in full-screen player bottom row, triggers haptic feedback on fire

### Radio Mode
- Activated via the Radio icon in the Now Playing bottom row
- Auto-queues tracks endlessly based on current artist
- Algorithm: when queue drops below 3 tracks, calls `/api/artist/[name]/similar` → picks top similar artist → fetches their top tracks → appends to queue
- Chains through similar artists so the station drifts naturally over time
- On mobile: `react-native-track-player`'s `PlaybackQueueEnded` event triggers the next-batch fetch
- Visual indicator: Radio icon glows orange when active; queue panel shows "Radio" badge on auto-added tracks

### Queue & History Panels
- **Queue**: Slide-up bottom sheet (`@gorhom/bottom-sheet`) — draggable list of upcoming tracks, remove/reorder by long-press drag
- **History**: Same sheet, tab-switched — list of previously played tracks, tap to re-queue
- Both persist in Zustand store (cleared on app restart unless user is logged in, where history also writes to DB)

---

## 5. Audio Playback on Mobile

### How Streaming Works Today (Web)

Sonic Atlas does not use the YouTube Data API v3 for playback — it uses YouTube Music's internal **Innertube API** directly, which is the same protocol the official YouTube Music app uses.

```
User taps Play
       │
       ▼
POST /api/stream/[videoId]
       │
       ▼
Node.js API route
  ├─ Calls yt-dlp (or Innertube.js) to extract audio stream URL
  ├─ Gets a direct CDN URL to the audio (opus/webm or m4a, 128–256kbps)
  └─ Pipes it through as an HTTP audio stream
       │
       ▼
Browser HTML5 <audio> plays the proxied stream
```

**Why proxy it?** YouTube's extracted stream URLs are signed and IP-locked — they must be fetched server-side and proxied to the client. The `/api/stream/[videoId]` route handles this entirely.

**Track metadata** (title, artist, thumbnail) comes from the YouTube Music search that resolves each playlist entry — also via Innertube, not the Data API v3. No YouTube API key is required for any of this.

**Deezer previews** (30-second clips) are a fallback when a YouTube Music match isn't found. These are direct CDN URLs — no proxy needed.

---

### Mobile: Background Playback (Screen Off)

This is a hard requirement and the most important audio consideration for mobile. When the screen turns off or the user switches apps, music must keep playing. The web app's HTML5 `<audio>` tag handles this automatically in browsers, but React Native requires explicit setup.

**Solution: `react-native-track-player`**

This library runs audio in a **native foreground service** (Android) and **AVAudioSession** (iOS), which are the same mechanisms Spotify and Apple Music use. Key guarantees:

| Behaviour | How it works |
|---|---|
| Screen turns off | Audio continues — native service keeps running |
| User switches apps | Audio continues — foreground service survives backgrounding |
| User pulls down notification shade | Playback controls appear (Android Media Session) |
| Lock screen | Album art + controls show on lock screen |
| Headphone unplugged | Auto-pauses (standard Android/iOS behaviour) |
| Bluetooth connects | Auto-routes audio to headset |
| Phone call interrupts | Auto-pauses, resumes after call |

**Setup required:**
```
android/app/src/main/AndroidManifest.xml
  → <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
  → <service android:name="com.doublesymmetry.trackplayer.service.HeadlessJsMediaService" ... />
```

The existing `/api/stream/[videoId]` proxy URL is passed directly to `react-native-track-player` — the library handles the HTTP streaming, buffering, and OS integration. No backend changes needed.

**Vinyl animation while screen is off:** The spinning vinyl is a UI element only — it will naturally stop rendering when the screen is off (the OS suspends the UI thread). Music continues in the native layer. When the user wakes the screen, the vinyl resumes spinning if the track is still playing.

---

### Full Audio Stack Comparison

| Feature | Web (current) | Mobile (React Native) |
|---|---|---|
| Full tracks | yt-dlp → `/api/stream` proxy → `<audio>` | `/api/stream` proxy → `react-native-track-player` |
| Previews | Deezer CDN → `<audio>` | Deezer CDN → `react-native-track-player` |
| Background play | Browser handles it | `react-native-track-player` native service |
| Lock screen controls | Not applicable | Android Media Session / iOS Now Playing |
| Notification controls | Not applicable | Auto — provided by the library |
| Queue management | Custom `AudioContext` hook | `react-native-track-player` built-in queue |
| Vinyl animation | Framer Motion CSS rotation | `react-native-reanimated` continuous rotation |
| Seek scrubbing | Mouse/touch on custom div | `react-native-track-player` seek API |
| Gapless playback | Manual pre-load logic | Built into `react-native-track-player` |

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
