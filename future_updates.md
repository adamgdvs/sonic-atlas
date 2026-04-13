# Sonic Atlas — Future Updates & Feature Roadmap

## High Impact — Core Experience

### 1. Queue Management UI
Users can queue tracks but have no way to see, reorder, or remove items from the queue. A draggable queue panel (slide-up sheet on mobile) would make Sonic Atlas feel like a real player, not just a preview tool.

**Status:** In Progress

### 2. Playlist Creation & Export
Let users save collections of tracks (not just bookmarked artists) as playlists. Export to Spotify/Apple Music via their APIs would be the killer feature — "discovered on Sonic Atlas, listening on Spotify."

**Status:** In Progress

### 3. "Start Radio" from Any Artist/Genre
Radio mode infrastructure already exists. Surfacing a prominent "Radio" button that auto-generates an endless mix from similar artists + genre neighbors would be the single most engaging feature for passive listening.

**Status:** In Progress

### 4. Listening History / Recently Played
No way to find "that song I heard 20 minutes ago." A simple chronological list with one-tap replay. Low effort, high payoff.

**Status:** In Progress

---

## Medium Impact — Discovery & Engagement

### 5. Smart Recommendations Feed
Use the user's bookmarked artists and listening history to generate a personalized "Discover" feed on the home page. "Because you saved Interpol" -> 5 artists you haven't explored yet. Turns My Atlas from a static list into an active discovery engine.

**Status:** Planned

### 6. Social Proof / Activity
The Frequency Hub exists but is disconnected from the core flow. Showing "trending in your genres" or "other fans of [artist] also explored..." directly on artist pages creates FOMO-driven discovery.

**Status:** Planned

### 7. Lyrics or Track Context
When playing a full track, the expanded mobile player has empty space below the controls. Synced lyrics (Musixmatch API) or artist/album context would fill that space meaningfully and increase time spent in the expanded player.

**Status:** Planned

### 8. Offline Bookmarks with Preview Cache
Cache the first 30 seconds of top tracks for bookmarked artists using the Service Worker API. Users on subway/flights could still browse their atlas and hear previews.

**Status:** Planned

---

## Lower Effort, Nice Polish

### 9. Sleep Timer
Common in music apps, trivial to implement. "Stop playing after 15/30/60 min."

**Status:** Planned

### 10. Crossfade Between Tracks
When using queue or radio mode, a 2-3 second crossfade between tracks eliminates the jarring silence gap and makes the experience feel dramatically more polished.

**Status:** Planned
