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
* **Decade/Era Pills:** Add filters for "1980s", "1990s", "2010s", etc. You could search for a modern Synth-Pop artist, hit the "1980s" filter, and the graph immediately re-orients to show only their legacy influences from that era.
