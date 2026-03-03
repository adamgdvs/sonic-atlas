# Future Implementations

This document outlines robust, high-impact features planned for future phases of Sonic Atlas, designed to elevate it from a standalone discovery tool into a personalized, sticky platform.

## 1. "My Atlas" (Bookmarking & User Accounts)
Allowing users to save their discoveries is crucial for retention. We will implement a lightweight authentication system (like NextAuth or Supabase) to give them a personalized space:
* **The "Pinned" Constellation:** Bookmarked artists don't just go into a boring list; they form the user's personal "Home Constellation Graph" that they can interact with.
* **Journey History (Breadcrumbs):** Sonic Atlas is all about getting lost in the rabbit hole. We will track the user's session history (e.g., *Taylor Swift → Bleachers → The 1975 → Japanese House*) and let them save these "Paths" or "Crates".

## 2. Community "Vibe Checking" (Voting)
To make the data feel alive, we can crowdsource similarity intelligence:
* **Edge Upvoting:** When looking at the Constellation Graph, users can hover over the line connecting two artists and "Upvote" or "Downvote" the connection based on whether they actually sound alike. 
* **Genre Tagging:** Allow users to propose or vote on genre tags for artists, making our data even richer than the Last.fm defaults.

## 3. Spotify/Apple Music Integration (The Ultimate Utility)
The Deezer previews are incredible for fast discovery, but eventually, the user wants the full tracks.
* **"Create Playlist from Constellation" button:** A user can lasso a group of artists on the graph (or just click a single button for the visible neighbors) and instantly generate a Spotify/Apple Music playlist containing their top tracks.
* **Auto-login Sync:** If they log in via Spotify, we instantly drop their top 5 lifetime artists into the center of the Constellation Graph for immediate, hyper-personalized discovery.

## 4. Endless "Radio" Discovery Mode
Right now, the Global Audio Player plays a 30-second snippet and stops.
* **"Autoplay Radar":** If toggled on, when an artist's preview finishes, the engine automatically selects their *most similar neighbor* and immediately starts playing their top track. You could leave the graph open on a second monitor and let it endlessly auto-DJ your discovery journey while the graph visually pans to the new artist automatically!

## 5. Temporal Filtering (The "Time Machine")
Right now we filter by Sound, Genre, and Audience.
## 6. Global Intelligence & Live Feeds
To make the platform feel like a living, breathing ecosystem:
*   **The Global Frequency Hub:** A dedicated page showing a real-time "Signal Ticker" of what the global community is currently discovering (e.g., `SIGNAL_DETECTED: [USER] scanned [ARTIST]`).
*   **Acoustic Intelligence (Mood Filtering):** Implement advanced metadata filtering for "Energy," "Danceability," and "Valence" (happiness/sadness) to scan only for "High-Energy" or "Ambient/Focus" neighbors.

## 7. Advanced Discovery Pages
Expanding the surface area of the platform:
*   **"Deep Scan" Search Explorer:** A specialized explorer for complex queries, using technical data tables to allow for multi-variable filtering (e.g., "90s Grunge with High BPM").
*   **Album Intel (Deep Dive):** Dedicated album nodes and pages featuring instrumentation data, production credits, and granular "Similar Album" constellations.
*   **Operational Methodology (Labs):** A transparent "About" page that visualizes the "Hidden Layers" of our similarity engine and recommendation algorithm.

## 8. Professional Utility Features
Features designed for the "Power Listener":
*   **Keyboard Operation (Command Palette):** A `Cmd+K` palette for technical users to run commands like `/search [artist]`, `/play`, or `/bookmark` without leaving the keyboard.
*   **Data Export (Crate Digging):** Allow users to export their "My Atlas" manifests or specific constellations as technical JSON/CSV files or direct integration with **Discogs**.
*   **Concert Tour Signal:** Integrate live data (Songkick/Bandsintown) to pulse an artist's node on the graph if a "Live Signal" (Tour) is currently active.
*   **Constellation Pulse:** Add dynamic background grid lines that warp or blip based on the density of the graph or the BPM of the active audio frequency.

## 9. The "Protocol Overlay" (Modular Command Center)
Replacing standard navigation with a high-contrast, technical menu inspired by `shift5.io`. This single overlay acts as the **Operator's Command Center**, integrating four distinct modules:

*   **Vibe Controller (Discovery Settings):** Real-time sliders for "Discovery Depth" (Stable vs. Chaotic) and "Filter Persistence."
*   **The Path Log (Session History):** A technical, scrollsable manifest of every artist/node scanned in the current session (e.g., `SCAN_01 -> SCAN_02`).
*   **System Diagnostics (Account & Sync):** Live status indicators for Spotify/Apple Music encryption and session data integrity.
*   **Experimental Labs:** Toggles for tactical high-contrast themes (Neon Cyan / Toxic Green) and reactive background visualizers.
