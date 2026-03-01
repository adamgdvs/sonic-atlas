
Sonic Atlas
Product Requirements Document


An open-source music discovery platform for exploring
similar artists, genres, and sonic neighborhoods.

Version
1.0
Date
February 2026
Status
Draft
Author
Product Team

1. Executive Summary
Sonic Atlas is an open-source music discovery platform that helps users explore artists, genres, and sonic relationships through an intuitive, visually refined interface. Unlike existing tools that rely on cluttered scatter plots or opaque algorithmic recommendations, Sonic Atlas combines multiple open data sources with audio analysis to surface meaningful artist similarities — and explain why they exist.
The platform is designed as a spiritual successor to Every Noise at Once, rebuilt with modern web technologies, cleaner UX patterns, and sustainable open-source data pipelines that don’t depend on any single proprietary API.

2. Problem Statement
Music discovery today is fragmented and opaque. Spotify’s algorithmic recommendations don’t explain their reasoning. Apple Music’s “Similar Artists” is a black box. Every Noise at Once was the gold standard for genre-based exploration, but it’s no longer maintained and its scatter-plot interface was difficult for casual users to navigate.
Users need a tool that answers a simple question: “If I like this artist, who else should I listen to — and why?”

3. Goals and Non-Goals
3.1 Goals
	•	Provide accurate, explainable artist similarity powered by open data
	•	Deliver a clean, accessible interface that works for casual listeners and music nerds alike
	•	Offer audio previews so users can hear before they commit
	•	Support genre-based exploration as a secondary navigation path
	•	Maintain full open-source transparency in data sourcing and methodology
3.2 Non-Goals
	•	Building a streaming service or playlist generator (out of scope for v1)
	•	Replacing Spotify/Apple Music recommendations (complementary, not competitive)
	•	Real-time collaborative filtering from user listening data (v2+ consideration)
	•	Mobile-native apps (responsive web-first; native apps are a future phase)

4. Target Users
Persona
Description
Primary Need
Casual Explorer
Listens to music daily but doesn’t actively seek new artists
Simple, fast way to find “more like this”
Music Nerd
Deep knowledge of genres, actively curates playlists and collections
Genre drilling, understanding sonic relationships, finding obscure artists
DJ / Curator
Builds sets, playlists, or editorial content around music
Finding artists that bridge genres, filtering by sonic attributes
Developer
Wants to build on top of the platform or contribute
Open API access, transparent methodology, extensible architecture

5. Data Architecture
5.1 Data Sources
Primary Sources
The following data sources form the canonical data pipeline:
Source
Data Provided
Role in Pipeline
Wikidata
Genre taxonomy, hierarchical relationships (P31/P279), stable Q-IDs
Canonical genre spine — the single source of truth for genre identity and hierarchy
MusicBrainz
Artist metadata, release info, genre tags, Wikidata links
Artist identity layer; bridges to Wikidata via existing URL relationships
Last.fm
Crowd-sourced artist tags, listening counts, artist similarity scores
Popularity signals, tag coverage, collaborative-filtering-based similarity baseline
ListenBrainz
Collaborative filtering similarity, listening history aggregates
Pre-computed similar artist data from open scrobble data; reduces cold-start problem
AcousticBrainz (archived)
Audio feature vectors (timbre, rhythm, key, BPM, mood descriptors)
Sonic similarity computation for tracks in the dataset
Discogs
Curated genre/style taxonomy (~500 styles), release metadata
Cross-reference for genre reconciliation; high-quality human-curated labels

Supplementary Sources
	•	Deezer API — 30-second audio preview URLs (primary preview source)
	•	Essentia (self-hosted) — Compute audio features for tracks not in AcousticBrainz
	•	MusicBrainz Cover Art Archive — Artist and release artwork
	•	YouTube oEmbed — Fallback audio/video previews when Deezer coverage gaps exist

5.2 Genre Reconciliation Pipeline
Genre labels are inconsistent across sources. The reconciliation pipeline normalizes all genre data onto a single canonical taxonomy using Wikidata as the spine:
	•	Bootstrap canonical list from Wikidata. SPARQL query for all instances/subclasses of Q188451 (music genre). Yields ~4,000–5,000 entries with hierarchical relationships and multilingual aliases.
	•	Map MusicBrainz genres via existing links. MusicBrainz stores Wikidata URLs on genre entities. Match remaining entries on normalized name.
	•	Collapse Last.fm tags. Pass 1: Exact/normalized string match (lowercase, strip hyphens/spaces, expand abbreviations). Pass 2: Sentence-transformer embedding similarity (all-MiniLM-L6-v2) for unmatched popular tags. Manual review for ~200–300 ambiguous cases.
	•	Layer Discogs styles. ~500 styles map one-to-one or one-to-many. Hand-built mapping table (approximately one afternoon of work).
	•	Retain novel micro-genres. Single-source tags with sufficient artist associations and distinct audio feature clusters are preserved as provisional entries.
	•	Audio feature tiebreaking. When two tags might be duplicates, compare average feature vectors of associated artists. Close vectors = merge. Distant vectors = keep separate.

5.3 Similarity Computation
Artist similarity is a weighted composite of three independent signals:
Signal
Weight
Method
Sonic Similarity
40%
Cosine similarity of aggregated audio feature vectors (AcousticBrainz/Essentia). Features: MFCCs, spectral contrast, rhythm patterns, key/mode, BPM.
Audience Overlap
35%
ListenBrainz collaborative filtering scores + Last.fm similar artist API. Captures “fans also listen to” relationships.
Genre Proximity
25%
Graph distance in the Wikidata genre hierarchy. Artists sharing leaf-level genres score higher than those sharing only parent genres.

The composite score is pre-computed for all artist pairs above a minimum threshold and stored as a nearest-neighbor index using FAISS or Annoy for sub-millisecond lookup at query time.

6. Tech Stack
6.1 Frontend
Layer
Technology
Rationale
Framework
Next.js (App Router)
SSR for SEO, API routes, fast page loads
Styling
Tailwind CSS
Utility-first, consistent with flat design system
Visualization
D3.js (force simulation)
Constellation graph for sidebar; limited scope (20–30 nodes, no WebGL needed)
Search
Fuse.js or MiniSearch
Client-side fuzzy search over genre/artist names
Audio Previews
Deezer 30s previews (primary), YouTube oEmbed (fallback)
No auth needed for Deezer previews; best UX for instant playback
State Management
React Context + SWR
Lightweight; SWR for data fetching/caching

6.2 Backend and Data
Layer
Technology
Rationale
API
Next.js API Routes or FastAPI
Simple REST endpoints for similarity queries
Database
PostgreSQL + pgvector
Relational data + vector similarity search in one system
Nearest Neighbors
FAISS (batch) / pgvector (runtime)
Pre-compute with FAISS, serve via pgvector for simplicity
Data Pipeline
Python (pandas, rapidfuzz, sentence-transformers)
Genre reconciliation, feature aggregation, similarity computation
Audio Analysis
Essentia (self-hosted)
Compute features for tracks missing from AcousticBrainz dataset
File Format
Parquet via DuckDB
Efficient intermediate storage for pipeline stages
Hosting
Vercel (frontend) + Railway or Fly.io (API/DB)
Low-ops deployment; scale as needed

7. Information Architecture
7.1 Core Interface Pattern
The primary interface follows a search-first pattern with three distinct zones:
	•	Search + Filters (top/left): Fuzzy search by artist, genre, or mood. Filter results by similarity type (sonic, audience, genre), era, and popularity.
	•	Results Cards (center): Ranked list of similar artists. Each card shows name, genre tags, similarity score, one-line rationale, preview button, and “Explore” action that re-centers on that artist.
	•	Constellation Graph (sidebar): Ego-centric network showing the searched artist at center with nearest neighbors radiating outward. Distance encodes similarity. Hover/click syncs between cards and graph.

7.2 Navigation Paths
	•	Artist → Similar Artists (primary flow)
	•	Genre → Top Artists in Genre → Similar Artists
	•	Constellation node click → Re-center on new artist (seamless drilling)
	•	Genre tag click → Genre detail page with representative artists

7.3 Design Principles
	•	Flat styling throughout — no gradients, no border-radius, no drop shadows
	•	Monochrome base palette with color reserved for genre tags
	•	Information density without clutter — every element earns its space
	•	Explanations over scores — users see why artists are similar, not just that they are
	•	Progressive disclosure — simple on first glance, detailed on interaction

8. Key Features
8.1 MVP (v1.0)
Feature
Description
Priority
Artist Search
Fuzzy search across 500K+ artists with autocomplete
P0
Similar Artists
Top 20 similar artists with composite similarity scores
P0
Similarity Rationale
One-line explanation for each similarity (sonic / audience / genre)
P0
Audio Previews
30-second clips via Deezer API with inline player
P0
Genre Tags
Color-coded genre labels on every artist card
P0
Constellation Graph
Sidebar ego-centric network with hover/click sync
P1
Similarity Filters
Filter by: all, sonic, audience overlap, genre proximity
P1
Genre Exploration
Browse genres → see representative artists
P1
Genre Detail Pages
Genre taxonomy view with parent/child/sibling genres
P2

8.2 Future Phases (v2+)
	•	User accounts with listening history integration (Last.fm / ListenBrainz scrobble import)
	•	Personalized recommendations based on listening profile
	•	Shareable discovery paths (“From Radiohead to Burial in 4 hops”)
	•	Public API for third-party developers
	•	Playlist export to Spotify/Apple Music/Tidal
	•	Community-driven genre corrections and artist tagging

9. Implementation Roadmap
Phase 1: Data Foundation (Weeks 1–3)
	•	Bootstrap Wikidata genre taxonomy via SPARQL
	•	Ingest MusicBrainz artist/genre dump and link to Wikidata IDs
	•	Run Last.fm tag reconciliation pipeline (string normalization + embedding matching)
	•	Map Discogs styles to canonical taxonomy
	•	Import AcousticBrainz archived dataset and index by MusicBrainz recording ID
	•	Set up PostgreSQL + pgvector schema
Deliverable: Canonical genre table + artist-genre mapping covering 500K+ artists.

Phase 2: Similarity Engine (Weeks 4–6)
	•	Aggregate audio features per artist (mean/median across top tracks)
	•	Ingest ListenBrainz similar-artist data via API
	•	Pull Last.fm similar artist scores as secondary signal
	•	Compute genre graph distance for all artist pairs sharing any genre
	•	Build composite similarity function with tunable weights
	•	Pre-compute top-100 nearest neighbors per artist using FAISS
	•	Load results into pgvector for runtime queries
Deliverable: Similarity API returning top-N similar artists with scores and signal breakdown.

Phase 3: Frontend MVP (Weeks 7–10)
	•	Set up Next.js project with Tailwind, flat design system
	•	Build search landing page with fuzzy autocomplete
	•	Build artist detail view with ranked cards, genre tags, rationale text
	•	Integrate Deezer preview URLs with inline audio player
	•	Build constellation graph sidebar with D3 force simulation
	•	Implement hover/click sync between cards and graph
	•	Add filter controls (similarity type, era, popularity)
	•	Responsive layout for tablet/mobile (cards stack, graph moves to expandable panel)
Deliverable: Deployed MVP at sonic-atlas.com (or equivalent).

Phase 4: Polish and Launch (Weeks 11–12)
	•	Performance optimization (lazy loading, prefetching, CDN caching)
	•	SEO: server-rendered artist/genre pages for crawlability
	•	Analytics integration (Plausible or PostHog, privacy-respecting)
	•	Error handling, empty states, loading skeletons
	•	Documentation: README, contributing guide, data methodology writeup
	•	Open-source repository setup (license, CI/CD, issue templates)
Deliverable: Production-ready public launch.

10. API Reference (v1)
GET /api/artist/:id/similar
Returns the top N similar artists for a given MusicBrainz artist ID.

Parameter
Type
Description
limit
int (default 20)
Number of results (max 100)
signal
string
Filter by similarity type: sonic, audience, genre, or all
min_score
float (0–1)
Minimum composite similarity threshold

GET /api/genre/:id
Returns genre metadata including parent/child genres and top artists.

GET /api/search
Fuzzy search across artists and genres. Returns ranked results with type labels.

11. Risks and Mitigations
Risk
Severity
Mitigation
AcousticBrainz dataset is static
Medium
Use Essentia to compute features for new/missing tracks. Prioritize popular artists.
Deezer kills preview URLs
Medium
YouTube oEmbed fallback. Jamendo for CC-licensed tracks. Architecture abstracts preview provider.
Genre reconciliation quality
High
Start at 90% accuracy, add user feedback loop. Manual review for top 1,000 genres by artist count.
API rate limits (Last.fm, MusicBrainz)
Low
Batch import from data dumps rather than live API calls. Cache aggressively.
Scale beyond 500K artists
Low
pgvector handles millions of rows. FAISS index is memory-efficient. Shard if needed in v2.

12. Success Metrics
	•	Discovery depth: Average number of “Explore” clicks per session (target: 4+)
	•	Preview engagement: Percentage of sessions that play at least one audio preview (target: 60%+)
	•	Search success rate: Percentage of searches that return results (target: 95%+ for artists with 10K+ Last.fm listeners)
	•	Data coverage: Number of artists with complete similarity data (target: 500K+ at launch)
	•	Community adoption: GitHub stars, API consumers, and genre correction submissions

13. Open Questions
	•	Should v1 include a public API, or gate it behind registration for rate limiting?
	•	What is the minimum viable artist count for a useful launch? 100K? 500K?
	•	Should the constellation graph be the default view or opt-in? User testing needed.
	•	How should we handle artists with insufficient audio data for sonic similarity? Display partial results with a transparency label?
	•	Licensing considerations for Essentia-computed features on copyrighted audio — legal review needed.

14. Appendix
14.1 Key External APIs
API
Endpoint / Resource
Auth / Limits
MusicBrainz
Data dumps (weekly) + REST API
Rate limit: 1 req/sec (with User-Agent header)
Last.fm
artist.getSimilar, artist.getTopTags
API key required; 5 req/sec
ListenBrainz
/similar/artists endpoint
No auth needed; generous limits
Deezer
track.preview URL (direct)
No auth for preview URLs; 50 req/5sec for API
Wikidata
SPARQL endpoint + REST API
No auth; be polite with query volume
Discogs
database dump (monthly) + REST API
OAuth for API; 60 req/min

14.2 Python Libraries
	•	rapidfuzz — Fast fuzzy string matching for genre normalization
	•	sentence-transformers — Embedding-based genre matching (all-MiniLM-L6-v2)
	•	FAISS — Approximate nearest neighbor search for batch similarity computation
	•	Essentia — Audio feature extraction (MFCCs, spectral, rhythm)
	•	DuckDB — Fast analytical queries over Parquet files during pipeline stages
	•	pandas / polars — Data manipulation and transformation

General Visual Design and Styling:

import { useState, useRef, useEffect, useCallback } from "react";

// --- Mock Data ---
const MOCK_ARTISTS = {
  "radiohead": {
    name: "Radiohead",
    genres: ["art rock", "alternative rock", "electronic", "experimental"],
    img: "https://i.scdn.co/image/ab6761610000e5eba03696716c9ee605006047fd",
    popularity: 92,
    similar: [
      { id: "portishead", name: "Portishead", genres: ["trip hop", "art rock", "electronic"], similarity: 0.89, reason: "Sonic texture, experimental production", img: "https://i.scdn.co/image/ab6761610000e5eb4ebf2fa2b4eaf1696a4e tried" },
      { id: "thom-yorke", name: "Thom Yorke", genres: ["electronic", "art rock", "experimental"], similarity: 0.94, reason: "Solo work, shared DNA", img: null },
      { id: "massive-attack", name: "Massive Attack", genres: ["trip hop", "electronic", "downtempo"], similarity: 0.82, reason: "Atmospheric electronics, dark textures", img: null },
      { id: "sigur-ros", name: "Sigur Rós", genres: ["post-rock", "ambient", "art rock"], similarity: 0.80, reason: "Emotional sprawl, textural guitars", img: null },
      { id: "boards-of-canada", name: "Boards of Canada", genres: ["idm", "ambient", "electronic"], similarity: 0.76, reason: "Nostalgic electronics, warp aesthetics", img: null },
      { id: "bjork", name: "Björk", genres: ["art pop", "electronic", "experimental"], similarity: 0.78, reason: "Genre-defying experimentation", img: null },
      { id: "aphex-twin", name: "Aphex Twin", genres: ["idm", "ambient techno", "electronic"], similarity: 0.72, reason: "Electronic experimentation, Warp Records", img: null },
      { id: "talking-heads", name: "Talking Heads", genres: ["new wave", "art rock", "post-punk"], similarity: 0.71, reason: "Art rock lineage, angular rhythms", img: null },
      { id: "pixies", name: "Pixies", genres: ["alternative rock", "indie rock", "noise pop"], similarity: 0.70, reason: "90s alt-rock foundation, loud-quiet dynamics", img: null },
      { id: "everything-everything", name: "Everything Everything", genres: ["art rock", "indie pop", "experimental pop"], similarity: 0.68, reason: "Harmonic complexity, genre blending", img: null },
    ]
  },
  "kendrick-lamar": {
    name: "Kendrick Lamar",
    genres: ["west coast hip hop", "conscious hip hop", "jazz rap", "rap"],
    img: null,
    popularity: 96,
    similar: [
      { id: "j-cole", name: "J. Cole", genres: ["conscious hip hop", "rap", "hip hop"], similarity: 0.88, reason: "Lyrical depth, introspective rap", img: null },
      { id: "joey-badass", name: "Joey Bada$$", genres: ["east coast hip hop", "boom bap", "conscious hip hop"], similarity: 0.82, reason: "Boom bap revival, lyrical focus", img: null },
      { id: "isaiah-rashad", name: "Isaiah Rashad", genres: ["southern hip hop", "conscious hip hop"], similarity: 0.80, reason: "TDE family, melodic introspection", img: null },
      { id: "anderson-paak", name: "Anderson .Paak", genres: ["r&b", "hip hop", "funk"], similarity: 0.77, reason: "Genre fluidity, rhythmic innovation", img: null },
      { id: "childish-gambino", name: "Childish Gambino", genres: ["hip hop", "funk", "r&b", "art pop"], similarity: 0.74, reason: "Creative ambition, genre blending", img: null },
      { id: "vince-staples", name: "Vince Staples", genres: ["west coast hip hop", "experimental hip hop"], similarity: 0.76, reason: "West coast grit, experimental edge", img: null },
      { id: "thundercat", name: "Thundercat", genres: ["jazz fusion", "funk", "r&b"], similarity: 0.69, reason: "Jazz-rap crossover, TPAB collaborator", img: null },
      { id: "denzel-curry", name: "Denzel Curry", genres: ["hardcore hip hop", "trap", "experimental hip hop"], similarity: 0.68, reason: "Intense delivery, sonic range", img: null },
    ]
  },
  "fka-twigs": {
    name: "FKA twigs",
    genres: ["art pop", "electronic", "avant-garde", "trip hop"],
    img: null,
    popularity: 74,
    similar: [
      { id: "arca", name: "Arca", genres: ["experimental", "electronic", "art pop", "reggaeton"], similarity: 0.86, reason: "Avant-garde production, physical movement", img: null },
      { id: "bjork", name: "Björk", genres: ["art pop", "electronic", "experimental"], similarity: 0.84, reason: "Visionary art pop, sonic worlds", img: null },
      { id: "kelela", name: "Kelela", genres: ["r&b", "electronic", "ambient"], similarity: 0.82, reason: "Electronic R&B, textural vocals", img: null },
      { id: "sevdaliza", name: "Sevdaliza", genres: ["art pop", "electronic", "trip hop"], similarity: 0.80, reason: "Dark cinematic pop, movement", img: null },
      { id: "rosalia", name: "Rosalía", genres: ["flamenco", "reggaeton", "art pop"], similarity: 0.73, reason: "Cultural fusion, visual artistry", img: null },
      { id: "james-blake", name: "James Blake", genres: ["electronic", "post-dubstep", "art pop"], similarity: 0.78, reason: "Fragile electronics, vocal processing", img: null },
    ]
  }
};

const GENRE_COLORS = {
  "art rock": "#E85D45", "alternative rock": "#C44D3A", "electronic": "#3B82F6",
  "experimental": "#8B5CF6", "trip hop": "#6366F1", "post-rock": "#10B981",
  "ambient": "#14B8A6", "idm": "#7C3AED", "art pop": "#EC4899", "new wave": "#F59E0B",
  "post-punk": "#D97706", "indie rock": "#84CC16", "noise pop": "#22D3EE",
  "west coast hip hop": "#EF4444", "conscious hip hop": "#F97316", "jazz rap": "#FBBF24",
  "rap": "#DC2626", "hip hop": "#EA580C", "r&b": "#A855F7", "funk": "#F59E0B",
  "southern hip hop": "#B91C1C", "boom bap": "#9A3412", "avant-garde": "#6D28D9",
  "downtempo": "#0891B2", "indie pop": "#F472B6", "experimental pop": "#D946EF",
  "jazz fusion": "#CA8A04", "trap": "#991B1B", "flamenco": "#B45309",
  "reggaeton": "#65A30D", "post-dubstep": "#4F46E5", "ambient techno": "#0E7490",
  "experimental hip hop": "#7E22CE",
};

const getGenreColor = (genre) => GENRE_COLORS[genre] || "#6B7280";

// --- Components ---

const GenreTag = ({ genre }) => (
  <span
    style={{
      display: "inline-block",
      padding: "2px 8px",
      fontSize: "11px",
      fontWeight: 500,
      letterSpacing: "0.03em",
      color: getGenreColor(genre),
      border: `1px solid ${getGenreColor(genre)}33`,
      backgroundColor: `${getGenreColor(genre)}0A`,
      marginRight: "6px",
      marginBottom: "4px",
    }}
  >
    {genre}
  </span>
);

const SimilarityBar = ({ value }) => (
  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
    <div style={{ width: "48px", height: "3px", backgroundColor: "#E5E5E5", position: "relative" }}>
      <div
        style={{
          position: "absolute", left: 0, top: 0, height: "3px",
          width: `${value * 100}%`,
          backgroundColor: value > 0.85 ? "#1D1D1F" : value > 0.7 ? "#6B7280" : "#A1A1AA",
        }}
      />
    </div>
    <span style={{ fontSize: "11px", color: "#A1A1AA", fontVariantNumeric: "tabular-nums", fontWeight: 500 }}>
      {Math.round(value * 100)}%
    </span>
  </div>
);

const ArtistInitials = ({ name, size = 40 }) => {
  const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  const hash = name.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const hue = hash % 360;
  return (
    <div style={{
      width: size, height: size, minWidth: size,
      backgroundColor: `hsl(${hue}, 25%, 88%)`,
      color: `hsl(${hue}, 30%, 40%)`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.35, fontWeight: 600, letterSpacing: "0.02em",
    }}>
      {initials}
    </div>
  );
};

const PlayButton = ({ small }) => (
  <button
    style={{
      width: small ? 28 : 36, height: small ? 28 : 36,
      border: "1px solid #E5E5E5", backgroundColor: "#FAFAFA",
      display: "flex", alignItems: "center", justifyContent: "center",
      cursor: "pointer", transition: "all 0.15s ease",
      color: "#1D1D1F", flexShrink: 0,
    }}
    onMouseEnter={e => { e.currentTarget.style.backgroundColor = "#1D1D1F"; e.currentTarget.style.color = "#FFF"; e.currentTarget.style.borderColor = "#1D1D1F"; }}
    onMouseLeave={e => { e.currentTarget.style.backgroundColor = "#FAFAFA"; e.currentTarget.style.color = "#1D1D1F"; e.currentTarget.style.borderColor = "#E5E5E5"; }}
    title="Preview"
  >
    <svg width={small ? 10 : 12} height={small ? 10 : 12} viewBox="0 0 12 12" fill="currentColor">
      <polygon points="2,0 12,6 2,12" />
    </svg>
  </button>
);

const ArtistCard = ({ artist, index, onExplore, isHighlighted, onHover }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => { setHovered(true); onHover?.(artist.id); }}
      onMouseLeave={() => { setHovered(false); onHover?.(null); }}
      style={{
        display: "flex", alignItems: "flex-start", gap: "14px",
        padding: "16px 20px",
        borderBottom: "1px solid #F0F0F0",
        backgroundColor: isHighlighted ? "#F8F8FA" : hovered ? "#FCFCFC" : "#FFF",
        transition: "background-color 0.15s ease",
        cursor: "default",
        animation: `fadeSlideIn 0.3s ease ${index * 0.04}s both`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "14px", flex: 1, minWidth: 0 }}>
        <ArtistInitials name={artist.name} size={44} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
            <span
              onClick={() => onExplore(artist.id)}
              style={{
                fontSize: "15px", fontWeight: 600, color: "#1D1D1F",
                cursor: "pointer", letterSpacing: "-0.01em",
              }}
              onMouseEnter={e => e.currentTarget.style.textDecoration = "underline"}
              onMouseLeave={e => e.currentTarget.style.textDecoration = "none"}
            >
              {artist.name}
            </span>
            <SimilarityBar value={artist.similarity} />
          </div>
          <div style={{ marginBottom: "6px" }}>
            {artist.genres.slice(0, 3).map(g => <GenreTag key={g} genre={g} />)}
          </div>
          <p style={{ fontSize: "12px", color: "#9CA3AF", margin: 0, lineHeight: 1.4 }}>
            {artist.reason}
          </p>
        </div>
      </div>
      <div style={{ display: "flex", gap: "6px", alignItems: "flex-start", paddingTop: "2px" }}>
        <PlayButton small />
        <button
          onClick={() => onExplore(artist.id)}
          style={{
            padding: "5px 12px", fontSize: "11px", fontWeight: 600,
            border: "1px solid #E5E5E5", backgroundColor: "#FAFAFA",
            color: "#1D1D1F", cursor: "pointer", whiteSpace: "nowrap",
            letterSpacing: "0.03em", transition: "all 0.15s ease",
          }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = "#1D1D1F"; e.currentTarget.style.color = "#FFF"; e.currentTarget.style.borderColor = "#1D1D1F"; }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = "#FAFAFA"; e.currentTarget.style.color = "#1D1D1F"; e.currentTarget.style.borderColor = "#E5E5E5"; }}
        >
          Explore →
        </button>
      </div>
    </div>
  );
};

// Mini constellation graph
const ConstellationGraph = ({ center, similar, highlightedId, onHover, onExplore }) => {
  const width = 320;
  const height = 320;
  const cx = width / 2;
  const cy = height / 2;
  const maxRadius = 130;

  const nodes = similar.slice(0, 8).map((artist, i) => {
    const angle = (i / Math.min(similar.length, 8)) * Math.PI * 2 - Math.PI / 2;
    const distance = maxRadius * (1 - (artist.similarity - 0.5) * 1.5);
    return {
      ...artist,
      x: cx + Math.cos(angle) * distance,
      y: cy + Math.sin(angle) * distance,
    };
  });

  return (
    <svg width={width} height={height} style={{ display: "block" }}>
      {/* Concentric rings */}
      {[0.33, 0.66, 1].map((r, i) => (
        <circle key={i} cx={cx} cy={cy} r={maxRadius * r}
          fill="none" stroke="#F0F0F0" strokeWidth="1" />
      ))}

      {/* Edges */}
      {nodes.map((node, i) => (
        <line key={`edge-${i}`} x1={cx} y1={cy} x2={node.x} y2={node.y}
          stroke={highlightedId === node.id ? "#1D1D1F" : "#E5E5E5"}
          strokeWidth={highlightedId === node.id ? 1.5 : 1}
          style={{ transition: "all 0.2s ease" }}
        />
      ))}

      {/* Outer nodes */}
      {nodes.map((node, i) => {
        const isHighlighted = highlightedId === node.id;
        return (
          <g key={`node-${i}`}
            onMouseEnter={() => onHover?.(node.id)}
            onMouseLeave={() => onHover?.(null)}
            onClick={() => onExplore?.(node.id)}
            style={{ cursor: "pointer" }}
          >
            <circle cx={node.x} cy={node.y}
              r={isHighlighted ? 22 : 18}
              fill={isHighlighted ? "#1D1D1F" : "#FAFAFA"}
              stroke={isHighlighted ? "#1D1D1F" : "#E0E0E0"}
              strokeWidth="1"
              style={{ transition: "all 0.2s ease" }}
            />
            <text x={node.x} y={node.y}
              textAnchor="middle" dominantBaseline="central"
              fontSize="8" fontWeight="600" letterSpacing="0.02em"
              fill={isHighlighted ? "#FFF" : "#6B7280"}
              style={{ transition: "fill 0.2s ease", pointerEvents: "none" }}
            >
              {node.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
            </text>
            {isHighlighted && (
              <text x={node.x} y={node.y + 32}
                textAnchor="middle" fontSize="10" fontWeight="500"
                fill="#1D1D1F"
              >
                {node.name}
              </text>
            )}
          </g>
        );
      })}

      {/* Center node */}
      <circle cx={cx} cy={cy} r={26} fill="#1D1D1F" />
      <text x={cx} y={cy - 4} textAnchor="middle" dominantBaseline="central"
        fontSize="10" fontWeight="700" fill="#FFF" letterSpacing="0.02em">
        {center.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
      </text>
      <text x={cx} y={cy + 10} textAnchor="middle"
        fontSize="7" fill="#999" letterSpacing="0.04em">
        CENTER
      </text>
    </svg>
  );
};

// Filter pills
const FilterPill = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    style={{
      padding: "5px 14px", fontSize: "12px", fontWeight: 500,
      border: active ? "1px solid #1D1D1F" : "1px solid #E5E5E5",
      backgroundColor: active ? "#1D1D1F" : "#FFF",
      color: active ? "#FFF" : "#6B7280",
      cursor: "pointer", transition: "all 0.15s ease",
      letterSpacing: "0.02em",
    }}
  >
    {label}
  </button>
);

// Main App
export default function SonicAtlas() {
  const [query, setQuery] = useState("");
  const [activeArtist, setActiveArtist] = useState(null);
  const [highlightedId, setHighlightedId] = useState(null);
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchFocused, setSearchFocused] = useState(false);
  const inputRef = useRef(null);

  const suggestions = Object.values(MOCK_ARTISTS).filter(a =>
    query.length > 0 && a.name.toLowerCase().includes(query.toLowerCase())
  );

  const handleSearch = (artistKey) => {
    const key = artistKey || Object.keys(MOCK_ARTISTS).find(k =>
      MOCK_ARTISTS[k].name.toLowerCase() === query.toLowerCase()
    );
    if (key && MOCK_ARTISTS[key]) {
      setActiveArtist(MOCK_ARTISTS[key]);
      setQuery("");
      setActiveFilter("all");
    }
  };

  const handleExplore = (id) => {
    if (MOCK_ARTISTS[id]) {
      setActiveArtist(MOCK_ARTISTS[id]);
      setActiveFilter("all");
      setHighlightedId(null);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const filteredSimilar = activeArtist?.similar.filter(a => {
    if (activeFilter === "all") return true;
    if (activeFilter === "sonic") return a.similarity > 0.75;
    if (activeFilter === "genre") return a.genres.some(g => activeArtist.genres.includes(g));
    return true;
  }) || [];

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#FFF", fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        ::selection { background: #1D1D1F; color: #FFF; }
        input::placeholder { color: #C4C4C4; }
      `}</style>

      {/* Header */}
      <header style={{
        borderBottom: "1px solid #F0F0F0",
        padding: "0 40px",
        height: "56px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{
            width: "8px", height: "8px", backgroundColor: "#1D1D1F",
            borderRadius: "50%",
          }} />
          <span style={{
            fontSize: "15px", fontWeight: 700, color: "#1D1D1F",
            letterSpacing: "-0.03em",
          }}>
            sonic atlas
          </span>
        </div>
        <div style={{ display: "flex", gap: "24px", fontSize: "13px", color: "#9CA3AF" }}>
          <span style={{ cursor: "pointer" }}>About</span>
          <span style={{ cursor: "pointer" }}>API</span>
          <span style={{ cursor: "pointer" }}>GitHub</span>
        </div>
      </header>

      {/* Hero / Search */}
      {!activeArtist && (
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: "center", padding: "120px 40px 80px",
          animation: "fadeIn 0.5s ease",
        }}>
          <h1 style={{
            fontSize: "48px", fontWeight: 300, color: "#1D1D1F",
            letterSpacing: "-0.04em", marginBottom: "12px", textAlign: "center",
          }}>
            Discover similar artists
          </h1>
          <p style={{
            fontSize: "16px", color: "#9CA3AF", marginBottom: "48px",
            fontWeight: 400, letterSpacing: "-0.01em",
          }}>
            Search an artist. Explore the constellation.
          </p>
          <div style={{ position: "relative", width: "100%", maxWidth: "480px" }}>
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSearch()}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
              placeholder="Artist name..."
              style={{
                width: "100%", padding: "14px 20px",
                fontSize: "16px", fontWeight: 400,
                border: searchFocused ? "1px solid #1D1D1F" : "1px solid #E5E5E5",
                backgroundColor: "#FFF", outline: "none",
                color: "#1D1D1F", letterSpacing: "-0.01em",
                transition: "border-color 0.15s ease",
                fontFamily: "'DM Sans', sans-serif",
              }}
            />
            {suggestions.length > 0 && searchFocused && (
              <div style={{
                position: "absolute", top: "100%", left: 0, right: 0,
                backgroundColor: "#FFF", border: "1px solid #E5E5E5",
                borderTop: "none", zIndex: 10,
              }}>
                {suggestions.map(a => {
                  const key = Object.keys(MOCK_ARTISTS).find(k => MOCK_ARTISTS[k].name === a.name);
                  return (
                    <div key={a.name}
                      onClick={() => handleSearch(key)}
                      style={{
                        padding: "10px 20px", cursor: "pointer",
                        fontSize: "14px", color: "#1D1D1F",
                        display: "flex", alignItems: "center", gap: "10px",
                      }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = "#FAFAFA"}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = "#FFF"}
                    >
                      <ArtistInitials name={a.name} size={28} />
                      <div>
                        <div style={{ fontWeight: 500 }}>{a.name}</div>
                        <div style={{ fontSize: "11px", color: "#9CA3AF" }}>{a.genres.slice(0, 2).join(" · ")}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <div style={{ display: "flex", gap: "8px", marginTop: "20px" }}>
            {["radiohead", "kendrick-lamar", "fka-twigs"].map(key => (
              <button key={key}
                onClick={() => handleSearch(key)}
                style={{
                  padding: "6px 16px", fontSize: "12px", fontWeight: 500,
                  border: "1px solid #E5E5E5", backgroundColor: "#FFF",
                  color: "#9CA3AF", cursor: "pointer",
                  transition: "all 0.15s ease", letterSpacing: "0.01em",
                }}
                onMouseEnter={e => { e.currentTarget.style.color = "#1D1D1F"; e.currentTarget.style.borderColor = "#1D1D1F"; }}
                onMouseLeave={e => { e.currentTarget.style.color = "#9CA3AF"; e.currentTarget.style.borderColor = "#E5E5E5"; }}
              >
                {MOCK_ARTISTS[key].name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Results View */}
      {activeArtist && (
        <div style={{ animation: "fadeIn 0.3s ease" }}>
          {/* Search bar (compact) */}
          <div style={{
            padding: "16px 40px", borderBottom: "1px solid #F0F0F0",
            display: "flex", alignItems: "center", gap: "12px",
          }}>
            <button onClick={() => setActiveArtist(null)} style={{
              border: "none", background: "none", cursor: "pointer",
              fontSize: "18px", color: "#9CA3AF", padding: "4px",
            }}>←</button>
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSearch()}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
              placeholder="Search another artist..."
              style={{
                flex: 1, maxWidth: "360px", padding: "10px 16px",
                fontSize: "14px", border: "1px solid #E5E5E5",
                backgroundColor: "#FAFAFA", outline: "none",
                color: "#1D1D1F", fontFamily: "'DM Sans', sans-serif",
              }}
            />
            {suggestions.length > 0 && searchFocused && (
              <div style={{
                position: "absolute", top: "128px", left: "92px",
                width: "360px",
                backgroundColor: "#FFF", border: "1px solid #E5E5E5",
                zIndex: 10,
              }}>
                {suggestions.map(a => {
                  const key = Object.keys(MOCK_ARTISTS).find(k => MOCK_ARTISTS[k].name === a.name);
                  return (
                    <div key={a.name}
                      onClick={() => handleSearch(key)}
                      style={{
                        padding: "10px 16px", cursor: "pointer",
                        fontSize: "14px", color: "#1D1D1F",
                        display: "flex", alignItems: "center", gap: "10px",
                      }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = "#FAFAFA"}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = "#FFF"}
                    >
                      <ArtistInitials name={a.name} size={24} />
                      <span style={{ fontWeight: 500 }}>{a.name}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div style={{ display: "flex", maxWidth: "1200px", margin: "0 auto" }}>
            {/* Main content */}
            <div style={{ flex: 1, minWidth: 0 }}>
              {/* Artist header */}
              <div style={{ padding: "32px 40px 24px", borderBottom: "1px solid #F0F0F0" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: "18px" }}>
                  <ArtistInitials name={activeArtist.name} size={56} />
                  <div>
                    <h2 style={{
                      fontSize: "28px", fontWeight: 600, color: "#1D1D1F",
                      letterSpacing: "-0.03em", marginBottom: "8px", lineHeight: 1,
                    }}>
                      {activeArtist.name}
                    </h2>
                    <div style={{ marginBottom: "8px" }}>
                      {activeArtist.genres.map(g => <GenreTag key={g} genre={g} />)}
                    </div>
                  </div>
                  <div style={{ marginLeft: "auto" }}>
                    <PlayButton />
                  </div>
                </div>
              </div>

              {/* Filters */}
              <div style={{
                padding: "16px 40px", borderBottom: "1px solid #F0F0F0",
                display: "flex", alignItems: "center", gap: "8px",
              }}>
                <span style={{ fontSize: "12px", color: "#9CA3AF", marginRight: "8px", fontWeight: 500 }}>
                  Similar by:
                </span>
                {[
                  { key: "all", label: "All" },
                  { key: "sonic", label: "Sound" },
                  { key: "genre", label: "Genre overlap" },
                ].map(f => (
                  <FilterPill key={f.key} label={f.label}
                    active={activeFilter === f.key}
                    onClick={() => setActiveFilter(f.key)}
                  />
                ))}
                <span style={{ marginLeft: "auto", fontSize: "12px", color: "#C4C4C4" }}>
                  {filteredSimilar.length} results
                </span>
              </div>

              {/* Results list */}
              <div>
                {filteredSimilar.map((artist, i) => (
                  <ArtistCard
                    key={artist.id}
                    artist={artist}
                    index={i}
                    onExplore={handleExplore}
                    isHighlighted={highlightedId === artist.id}
                    onHover={setHighlightedId}
                  />
                ))}
              </div>
            </div>

            {/* Sidebar - Constellation */}
            <div style={{
              width: "360px", borderLeft: "1px solid #F0F0F0",
              padding: "24px 20px", position: "sticky", top: 0,
              height: "fit-content", flexShrink: 0,
            }}>
              <div style={{
                fontSize: "11px", fontWeight: 600, color: "#9CA3AF",
                letterSpacing: "0.08em", textTransform: "uppercase",
                marginBottom: "16px",
              }}>
                Constellation
              </div>
              <ConstellationGraph
                center={activeArtist.name}
                similar={activeArtist.similar}
                highlightedId={highlightedId}
                onHover={setHighlightedId}
                onExplore={handleExplore}
              />
              <div style={{
                marginTop: "16px", padding: "12px 0",
                borderTop: "1px solid #F0F0F0",
              }}>
                <div style={{ fontSize: "11px", color: "#C4C4C4", lineHeight: 1.6 }}>
                  Distance from center = similarity.
                  <br />Hover a card to highlight its node.
                  <br />Click any node to re-center.
                </div>
              </div>

              {/* Genre breakdown */}
              <div style={{ marginTop: "20px" }}>
                <div style={{
                  fontSize: "11px", fontWeight: 600, color: "#9CA3AF",
                  letterSpacing: "0.08em", textTransform: "uppercase",
                  marginBottom: "12px",
                }}>
                  Genre Map
                </div>
                {[...new Set(activeArtist.similar.flatMap(a => a.genres))].slice(0, 10).map(genre => {
                  const count = activeArtist.similar.filter(a => a.genres.includes(genre)).length;
                  return (
                    <div key={genre} style={{
                      display: "flex", alignItems: "center", gap: "8px",
                      marginBottom: "6px",
                    }}>
                      <div style={{
                        width: "6px", height: "6px",
                        backgroundColor: getGenreColor(genre),
                        flexShrink: 0,
                      }} />
                      <span style={{ fontSize: "12px", color: "#6B7280", flex: 1 }}>{genre}</span>
                      <span style={{
                        fontSize: "11px", color: "#C4C4C4",
                        fontFamily: "'DM Mono', monospace",
                      }}>
                        {count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}