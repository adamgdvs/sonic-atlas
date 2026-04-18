# Playlist Engineering Plan

## Goal

Build a playlist generation system for `Sonic Atlas` that creates useful, playable, and explainable playlists based on:

- mood
- genre
- artist
- the user's saved taste graph in `My Atlas`
- recent listening behavior

The system should feel closer to a modern discovery app than a static list builder. It should not just gather random tracks from similar artists. It should produce playlists with:

- clear intent
- a coherent flow
- controlled novelty
- enough familiarity to feel personal
- explicit reasoning the user can understand

This document is written as an implementation plan for the current `sonic_atlas` codebase.

## Product Principles

### Core principles

1. Personalization first
   Use `My Atlas` bookmarks and listening history as the primary taste model.

2. Discovery with guardrails
   Introduce new artists and tracks, but keep them near the user's demonstrated taste.

3. Playability matters
   Only include tracks that are actually playable through the app's current preview or YouTube-backed playback path.

4. Explainability matters
   Every playlist should be explainable in plain language: why it exists, what signals shaped it, and why certain artists were chosen.

5. Sequencing matters
   The playlist should feel intentionally ordered, not randomly shuffled from a candidate pool.

6. Rule-based before ML
   Start with a deterministic scoring and sequencing engine. Add learning later only after the heuristics are good.

## Recommended Playlist Types

Ship playlist modes in this order.

### Phase 1 playlist types

1. `Artist Radio`
   Seed from one artist and expand outward using similar artists.

2. `Daily Discovery`
   Build from `My Atlas` plus recent listening. Blend familiar-adjacent and new artists.

3. `Genre Mix`
   Start with one genre, then widen into nearby genres based on the user's saved graph.

4. `Mood Mix`
   Use mood proxies from tags and genres. Anchor the mood in the user's saved artists and related scenes.

### Phase 2 playlist types

1. `Genre Drift`
   Start in one genre and gradually move into neighboring genres or adjacent subcultures.

2. `Comfort vs Discovery`
   Add a slider that shifts the mix between familiar artists and more exploratory picks.

3. `Scene Capsule`
   Build around a micro-scene or hybrid cluster like `dream pop + shoegaze + slowcore`.

## Existing Codebase Assets To Reuse

The current codebase already has several building blocks.

### Relevant data and APIs

- `src/app/api/bookmarks/route.ts`
  Saved artist graph from `My Atlas`

- `src/contexts/AudioContext.tsx`
  Recent listening history and current playback model

- `src/app/api/artist/[name]/similar/route.ts`
  Similar artist expansion with niche depth logic

- `src/app/api/tag/[tag]/artists/route.ts`
  Genre/tag-based artist retrieval

- `src/lib/api.ts`
  Client helpers for:
  - `getSimilarArtists`
  - `getTopTagArtists`
  - `getArtistPreviewData`
  - `getDiscography`
  - `getArtistInfo`

- `src/components/DiscoverFeed.tsx`
  Current recommendation feed logic. This is the closest conceptual predecessor to playlist generation.

- `src/app/api/playlists/route.ts`
  Existing playlist persistence routes

- `src/app/api/playlists/[id]/tracks/route.ts`
  Existing playlist track persistence routes

### Existing taste signals

- saved bookmark artists
- saved bookmark genres
- listening history from `AudioContext`
- similar artist graph
- genre/tag artist retrieval
- top-track and preview retrieval

These are enough for a very capable first playlist engine.

## Target Architecture

Implement playlist generation as four layers.

### Layer 1: Recipe Construction

Input the user's request or auto-generation context and produce a normalized recipe object.

Example:

```ts
type PlaylistMode =
  | "artist_radio"
  | "daily_discovery"
  | "genre_mix"
  | "mood_mix"
  | "genre_drift";

interface PlaylistRecipe {
  mode: PlaylistMode;
  title?: string;
  description?: string;
  seedArtists: string[];
  seedGenres: string[];
  targetMoods: string[];
  novelty: number; // 0.0 to 1.0
  nicheDepth: number; // 0 to 100
  desiredTrackCount: number;
  allowRepeatArtists: boolean;
  userId?: string;
}
```

### Layer 2: Candidate Generation

Build a large candidate pool of artists, then gather playable tracks for those artists.

This step should produce more candidates than needed. Do not try to sequence here.

### Layer 3: Scoring

Score tracks based on:

- recipe fit
- user affinity
- novelty
- cohesion
- playability

### Layer 4: Sequencing

Take the top candidates and arrange them in an intentional order.

This should enforce constraints like:

- no artist repetition too close together
- reasonable energy and mood continuity
- controlled genre drift

## Proposed Files And Modules

Create a playlist engine under `src/lib/playlist`.

### New module structure

```txt
src/lib/playlist/
  types.ts
  recipes.ts
  tasteProfile.ts
  moods.ts
  candidates.ts
  scoring.ts
  sequencing.ts
  explain.ts
  generate.ts
```

### Responsibilities

- `types.ts`
  Shared playlist engine types

- `recipes.ts`
  Build recipe objects from user input and default app behaviors

- `tasteProfile.ts`
  Build a normalized user taste profile from bookmarks and history

- `moods.ts`
  Map tags and genres to mood dimensions

- `candidates.ts`
  Generate artist and track candidates

- `scoring.ts`
  Assign scores to tracks and artists

- `sequencing.ts`
  Build the final ordered playlist

- `explain.ts`
  Produce human-readable rationale for the playlist

- `generate.ts`
  Orchestration entry point

## Data Model Plan

The existing playlist persistence can likely be reused, but generation metadata should be stored too.

### Recommended additions

If Prisma schema changes are acceptable, add metadata to playlists:

```ts
generationMode: string | null
generationRecipe: Json | null
generationExplanation: Json | null
sourceSeeds: Json | null
```

If schema changes are not desired immediately, store generation metadata in:

- playlist description as serialized JSON prefix plus human text, or
- a separate `GeneratedPlaylistMeta` table

Preferred approach:

- add a dedicated metadata field or table

Reason:

- easier regeneration
- easier debugging
- cleaner UI explanations

## Taste Profile Design

Build a user taste profile from:

1. bookmarks
2. history
3. optional playlist saves later

### Proposed taste profile shape

```ts
interface TasteProfile {
  favoriteArtists: Array<{ name: string; weight: number }>;
  favoriteGenres: Array<{ name: string; weight: number }>;
  favoriteMoods: Array<{ name: string; weight: number }>;
  recentArtists: Array<{ name: string; weight: number }>;
  bookmarkGenres: Array<{ name: string; weight: number }>;
  discoveryTolerance: number;
}
```

### Weighting recommendation

For v1:

- bookmarks: strong persistent signal
- recent history: medium recency signal
- currently playing / very recent tracks: minor short-term signal

Suggested weights:

- bookmark artist frequency: `1.0`
- bookmark genre frequency: `0.9`
- recent history artist appearances: `0.6`
- recent history genre appearances: `0.5`
- last 5 played artists boost: `0.2`

## Mood System

Mood data will be approximate because the app does not currently have robust audio features like tempo, valence, danceability, or energy.

Use a tag-and-genre proxy system.

### Recommended mood vocabulary

Keep it small and useful:

- `calm`
- `dreamy`
- `dark`
- `warm`
- `energetic`
- `aggressive`
- `romantic`
- `nostalgic`
- `focused`
- `uplifting`

### Mood mapping approach

Create a mapping file like:

```ts
const moodTagMap = {
  calm: ["ambient", "soft", "meditative", "minimal", "acoustic"],
  dreamy: ["dream pop", "ethereal", "shoegaze", "lush", "floating"],
  dark: ["gothic", "industrial", "coldwave", "dark ambient", "bleak"],
  energetic: ["dance", "electro", "punk", "high energy", "club"],
  nostalgic: ["retro", "80s", "melancholic", "wistful", "classic"],
};
```

Then derive artist and track mood vectors from:

- Last.fm tags
- genres
- microgenres when available

### Important note

Mood should influence ranking, not act as an absolute filter for v1.

## Candidate Generation Plan

Generate candidates in two passes:

1. artist candidate generation
2. track candidate generation

### Artist candidate generation inputs

Depending on recipe mode:

#### `artist_radio`

- primary seed artist
- similar artists from `getSimilarArtists`
- optionally second-degree similar artists for higher novelty

#### `daily_discovery`

- top bookmarked artists
- most recent distinct artists from history
- top bookmark genres
- top history genres

#### `genre_mix`

- top artists from `getTopTagArtists`
- secondary genre neighbors from the user's taste graph

#### `mood_mix`

- artists connected to mood-aligned genres and tags
- favor bookmark-linked genres and recent listening

### Artist candidate generation rules

1. Deduplicate by normalized artist name
2. Remove direct seed artists unless the mode explicitly allows them
3. Remove artists already overrepresented in the user's saved graph if novelty is high
4. Assign source metadata

Example:

```ts
interface ArtistCandidate {
  artistName: string;
  sourceType: "bookmark" | "history" | "similar" | "genre" | "mood";
  sourceSeed: string;
  genres: string[];
  image: string | null;
  similarityScore: number;
  userAffinityScore: number;
  noveltyScore: number;
}
```

### Track candidate generation

For each selected artist candidate:

1. fetch preview data using `getArtistPreviewData`
2. optionally fetch discography and top tracks when needed
3. build track candidates only from playable tracks

### Candidate pool size recommendation

For a 20-track playlist:

- gather 30-60 artist candidates
- fetch 1-3 playable tracks per artist
- build a pool of 40-80 track candidates
- sequence the best 20

## Scoring Model

Start with a deterministic weighted score.

### Track candidate shape

```ts
interface TrackCandidate {
  artistName: string;
  trackTitle: string;
  previewUrl?: string;
  videoId?: string;
  coverUrl?: string | null;
  genres: string[];
  sourceSeed: string;
  sourceType: string;
  relevance: number;
  affinity: number;
  novelty: number;
  moodFit: number;
  cohesionHint: number;
  playable: boolean;
  finalScore: number;
}
```

### Recommended score weights

#### Default v1

- relevance: `0.35`
- affinity: `0.20`
- novelty: `0.15`
- mood fit: `0.15`
- diversity contribution: `0.10`
- playability confidence: `0.05`

### Relevance definition

How close is the candidate to the requested seed or mode?

Examples:

- similar-artist confidence
- genre overlap
- niche-style overlap
- mood tag overlap

### Affinity definition

How close is the candidate to the user's demonstrated taste?

Examples:

- genre overlap with bookmarks
- artist adjacency to bookmarked artists
- repeated presence in history-near clusters

### Novelty definition

How new is the candidate relative to the user's current graph?

Suggested novelty behavior:

- direct bookmarks receive low novelty
- first-ring similar artists receive medium novelty
- second-ring or adjacent-genre artists receive higher novelty

Novelty should be rewarded up to the recipe's novelty setting, not maximized blindly.

### Diversity contribution

Use this as a soft penalty or bonus:

- penalize same-artist repetition
- penalize too many tracks from one micro-scene
- reward underrepresented but relevant adjacent artists

## Sequencing Plan

This is where the playlist starts to feel intentional.

### Baseline sequencing rules

1. Never place two tracks by the same artist back-to-back
2. Avoid repeating an artist within a 5-track window
3. Avoid stacking too many tracks with identical primary genre tags
4. Start strong and legible
5. Increase novelty gradually rather than front-loading it

### Suggested sequence structure for 20 tracks

- tracks 1-4:
  recognizable and highly aligned with the recipe

- tracks 5-12:
  widen the space and introduce adjacent discoveries

- tracks 13-17:
  highest novelty zone

- tracks 18-20:
  resolve toward cohesion

### Mood-aware sequencing

For mood playlists:

- `calm` or `focused`
  keep transitions gentle and avoid abrupt genre jumps

- `energetic`
  allow more intensity and stronger pacing shifts

- `nostalgic`
  favor consistency over novelty spikes

### Genre drift sequencing

For `genre_drift`:

1. start with tracks tightly aligned to the seed genre
2. move into adjacent hybrid or neighboring genres
3. land in a related but slightly expanded zone

Example:

- start: `indie rock`
- middle: `dream pop`
- later: `shoegaze`
- close: `slowcore`

## Explanation Layer

Every generated playlist should include an explanation object.

### Explanation shape

```ts
interface PlaylistExplanation {
  summary: string;
  sourceSeeds: string[];
  sourceGenres: string[];
  targetMoods: string[];
  noveltyLevel: number;
  rationale: string[];
}
```

### Example rationale lines

- "Built from your saved artists: Slowdive, Cocteau Twins, Beach House"
- "Expanded through adjacent genres: dream pop, shoegaze, ethereal wave"
- "Includes 7 new artists outside your saved atlas"
- "Sequenced for a gradual drift from familiar to exploratory"

### Why this matters

This explanation can be shown in:

- the playlist header
- the playlist modal
- a `Why this playlist?` expandable section

It improves user trust and aligns with the app's graph/discovery identity.

## API Plan

Add a dedicated generation route.

### Proposed route

`src/app/api/playlists/generate/route.ts`

### Request body

```ts
interface GeneratePlaylistRequest {
  mode: "artist_radio" | "daily_discovery" | "genre_mix" | "mood_mix" | "genre_drift";
  artist?: string;
  genre?: string;
  moods?: string[];
  novelty?: number;
  desiredTrackCount?: number;
  nicheDepth?: number;
  save?: boolean;
  title?: string;
}
```

### Response body

```ts
interface GeneratePlaylistResponse {
  title: string;
  description: string;
  tracks: Array<{
    title: string;
    artist: string;
    url: string;
    videoId?: string;
    coverUrl?: string | null;
    genres: string[];
  }>;
  explanation: PlaylistExplanation;
}
```

### Save behavior

If `save: true`, persist to the existing playlist system.

If `save: false`, return as an ephemeral preview playlist.

## UI Integration Plan

Use current UI patterns. Do not introduce a new visual language.

### Recommended entry points

1. `My Atlas`
   Add playlist actions like:
   - `Generate Daily Discovery`
   - `Build Genre Mix`
   - `Start Artist Radio`

2. Artist page / drawer
   Add:
   - `Create Radio`
   - `Build Playlist From This Artist`

3. Genre page / drawer
   Add:
   - `Generate Genre Mix`
   - `Generate Genre Drift`

4. Global player / playlist modal
   Add:
   - `Save generated playlist`
   - `Regenerate with more discovery`

### Minimum UI for v1

- one modal or drawer to choose playlist mode and settings
- one loading state during generation
- one result state showing:
  - playlist title
  - explanation
  - track list
  - save action
  - regenerate action

## Caching Strategy

Playlist generation will hit the same artist and tag endpoints repeatedly. Cache aggressively.

### Cache what

- taste profiles by user
- artist candidate expansions
- tag artist lists
- preview data for artists
- mood vectors for artists

### Cache durations

- bookmark-derived taste profile: `5-15 minutes`
- similar artist expansions: `30-60 minutes`
- tag artist lists: `30-60 minutes`
- artist preview data: `30-60 minutes`

### Cache invalidation triggers

- bookmark added/removed
- playlist regenerated with a new recipe
- significant history updates if you later persist history server-side

## Rollout Strategy

### Phase 1

Build the core engine and support:

- `artist_radio`
- `daily_discovery`

Why:

- these reuse current app data most effectively
- they are easy to explain
- they are immediately valuable

### Phase 2

Add:

- `genre_mix`
- `mood_mix`

Why:

- richer discovery
- more personalized sessions

### Phase 3

Add:

- `genre_drift`
- familiarity/discovery slider
- regeneration controls

## Implementation Steps

### Step 1

Create `src/lib/playlist/types.ts`

Add:

- recipe types
- taste profile types
- candidate types
- explanation types

### Step 2

Create `src/lib/playlist/tasteProfile.ts`

Responsibilities:

- load bookmarks
- read recent history when available client-side
- aggregate artist and genre weights
- derive a taste profile

If generation happens server-side and history is only client-side:

- send recent history in the request body for now

### Step 3

Create `src/lib/playlist/moods.ts`

Responsibilities:

- define mood taxonomy
- tag/genre-to-mood mapping
- helper to compute mood vectors for artists and tracks

### Step 4

Create `src/lib/playlist/candidates.ts`

Responsibilities:

- build artist candidate pools for each mode
- fetch track candidates
- deduplicate
- drop unplayable candidates

### Step 5

Create `src/lib/playlist/scoring.ts`

Responsibilities:

- compute weighted candidate scores
- adapt scoring to the recipe mode
- enforce novelty preferences

### Step 6

Create `src/lib/playlist/sequencing.ts`

Responsibilities:

- enforce sequencing rules
- build final ordered track list

### Step 7

Create `src/lib/playlist/explain.ts`

Responsibilities:

- generate explanation summary and rationale bullets

### Step 8

Create `src/lib/playlist/generate.ts`

Responsibilities:

- orchestrate:
  - recipe
  - taste profile
  - candidate generation
  - scoring
  - sequencing
  - explanation

### Step 9

Create `src/app/api/playlists/generate/route.ts`

Responsibilities:

- validate input
- call generator
- optionally save playlist

### Step 10

Integrate into UI

Recommended first integration:

- add `Generate Daily Discovery` in `My Atlas`
- add `Create Radio` on artist context

## Quality Constraints

The engine should enforce these minimum guarantees.

### Playlist quality rules

1. At least 80% of tracks must be playable
2. No artist repeats within the configured repeat window
3. At least 25-40% of tracks should be novel in discovery-oriented modes
4. No more than 35% of tracks should come from direct bookmark artists in `daily_discovery`
5. Every generated playlist must produce an explanation object

## Metrics To Track

Once this ships, track:

- playlist generation success rate
- save rate
- play-through rate
- skip rate
- repeat generation rate
- novelty acceptance
  - percentage of new artists later bookmarked

### Best leading signal

Track:

- how often generated-playlist artists are later bookmarked

That is probably the best product-level signal that discovery quality is working.

## Risks And Mitigations

### Risk: Too repetitive

Mitigation:

- stronger dedupe
- novelty cap/floor
- artist repeat limits

### Risk: Mood quality feels fake

Mitigation:

- keep mood vocabulary small
- bias mood mixes toward genre and taste profile

### Risk: Not enough playable tracks

Mitigation:

- over-generate candidates
- prefer artists with known preview/full playback availability

### Risk: Playlists feel random

Mitigation:

- sequence intentionally
- produce explanations
- do not treat artist similarity as sufficient by itself

## Recommended First Deliverable

If only one version is built first, build this:

### `Daily Discovery`

Inputs:

- top 5 bookmarked artists
- top 3 bookmarked genres
- last 5 distinct history artists

Behavior:

- generate 40-60 artist candidates
- fetch playable tracks
- score for affinity plus novelty
- build a 20-track playlist
- save optionally
- show explanation

This gives the app the most visible value with the least speculative infrastructure.

## Summary

The best approach is:

1. build a taste profile from bookmarks and history
2. generate artist and genre candidate pools
3. fetch playable tracks
4. score candidates with deterministic weights
5. sequence intentionally
6. explain the result to the user

Do not start with machine learning.
Do not start with random artist-to-track selection.
Do not skip explanation and sequencing.

For `Sonic Atlas`, the winning feature is not just "playlist generation."
It is "personalized discovery playlists that feel graph-aware, coherent, and intentional."
