# Streaming Fix: Full Song Playback on Vercel

**Date:** 2026-04-11
**Backup tag:** `backup-youtube-iframe-working` (commit `906050d`)

## The Problem

Full YouTube Music song playback worked perfectly on localhost but only played 30-second Deezer previews when deployed to Vercel at https://sonic-atlas.vercel.app.

## Root Cause

The original streaming architecture used **yt-dlp** (a system binary installed via Homebrew) to extract authenticated YouTube CDN URLs. yt-dlp handled all of YouTube's anti-bot measures (PO tokens, signatures, etc.) and ran as a child process via `execFile("yt-dlp", [...])`.

**yt-dlp cannot run on Vercel** — Vercel's serverless functions only support Node.js packages, not system binaries.

## What Was Tried and Why It Failed

### Attempt 1: youtubei.js direct streaming
Replaced yt-dlp with `youtubei.js` (already an npm dependency) to extract stream URLs server-side using `yt.getBasicInfo(videoId, { client: "IOS" })`.

**Result:** Worked locally, failed on Vercel. YouTube returns `LOGIN_REQUIRED: Sign in to confirm you're not a bot` for ALL client types (IOS, ANDROID, WEB, TV_EMBEDDED, YTMUSIC, MWEB, WEB_CREATOR) when requests come from datacenter IPs like Vercel's.

### Attempt 2: Piped API proxy
Used Piped (open-source YouTube frontend) API instances to get stream URLs, since they handle YouTube's anti-bot measures on their own infrastructure.

**Result:** Most Piped instances were either down or also blocked by YouTube with the same `LOGIN_REQUIRED` error. The one working instance (`api.piped.private.coffee`) only returned streams for ~1 out of every 5 videos.

### Attempt 3: 302 redirect to Piped proxy URL
Instead of proxying audio bytes through the serverless function, returned a 302 redirect to the Piped proxy URL.

**Result:** The browser's `<audio>` element errored on the redirect before audio data arrived, triggering the preview fallback.

### Attempt 4: Proxy Piped audio through serverless function
Fetched audio from Piped and streamed the response body through the serverless function with proper headers.

**Result:** The stream endpoint itself worked (confirmed 3.5MB audio/mp4 responses), but the `<audio>` element's `play()` was called before the slow endpoint responded, causing an error event that triggered the preview fallback. After fixing with a `canplay` event listener, the underlying Piped reliability issue remained — most videos still returned 404 because Piped instances were also blocked by YouTube.

## The Solution: YouTube IFrame Player API

**Commit:** `906050d`
**File:** `src/contexts/AudioContext.tsx`

Instead of extracting audio server-side, the player now uses YouTube's **official IFrame Player API** running entirely in the user's browser.

### How It Works

1. The YouTube IFrame API script (`https://www.youtube.com/iframe_api`) is loaded on first play
2. A hidden 1x1px YouTube player iframe is created in the DOM
3. When a track has a `videoId`, the YouTube player loads and plays it
4. When a track has no `videoId` (genre previews), the HTML `<audio>` element plays the Deezer preview
5. All custom player controls (play/pause, seek, skip, shuffle, repeat) work with both engines
6. If a YouTube embed fails for a specific video, it falls back to the Deezer preview

### Why This Works

- Uses YouTube's official embed system — no anti-bot blocking
- Audio plays client-side through the user's browser (residential IP, not datacenter)
- No server-side audio extraction needed
- No dependency on yt-dlp, Piped, Invidious, or any third-party proxy
- Supports full playback controls via the IFrame Player API

### Architecture

```
Tracks WITH videoId:
  User clicks track → YouTube IFrame Player loads videoId → Full song plays

Tracks WITHOUT videoId (genre pages):
  User clicks track → HTML <audio> element → 30-second Deezer preview plays
```

### Key Implementation Details

- `activeEngineRef` tracks which engine is active ("yt" or "audio")
- `ytPlayerRef` holds the YouTube player instance (persists across tracks)
- `ytTimerRef` runs a 250ms interval to poll current time/duration from the YT player
- `handleTrackEndedRef` is a ref to avoid stale closures in YT callbacks
- `loadYTApi()` is idempotent — only loads the script once, queues callbacks until ready
- `startPlayback()` stops the current engine before switching to the new one

### Files Changed

- `src/contexts/AudioContext.tsx` — Complete rewrite to dual-engine (YT IFrame + HTML audio)
- `src/app/api/stream/[videoId]/route.ts` — Still exists but no longer used by the player
- `src/app/api/stream-debug/route.ts` — Removed (was temporary diagnostic)

## Restoring This State

If anything breaks, restore to this exact working state:

```bash
git checkout backup-youtube-iframe-working
```

Or reset main to this point:

```bash
git reset --hard backup-youtube-iframe-working
git push --force origin main
```
