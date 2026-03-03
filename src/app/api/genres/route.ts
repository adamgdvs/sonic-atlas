import { NextResponse } from "next/server";
import genresData from "@/data/genres.json";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const DISCOGS_TACTICAL_STYLES = [
      "IDM", "Shoegaze", "Trip Hop", "Krautrock", "Post-Punk",
      "Ambient House", "Minimal Techno", "Glitch", "Dream Pop",
      "Indie Rock", "Noise", "Industrial", "Experimental", "Dub",
      "Techno", "House", "Trance", "Drum and Bass", "Jungle",
      "Oxford Indie"
    ].map(s => s.toLowerCase());

    const limit = parseInt(searchParams.get("limit") || "7500");
    const total = genresData.genres.length;

    // 1. Evenly distribute selection from the main dataset
    let selectedGenres = genresData.genres;
    if (limit < total) {
      const step = total / limit;
      selectedGenres = [];
      for (let i = 0; i < limit; i++) {
        selectedGenres.push(genresData.genres[Math.floor(i * step)]);
      }
    }

    // 2. Ensure Tactical Styles are always included (inject and deduplicate)
    // Filter out potential duplicates if they already exist in selectedGenres
    const tacticalToInject = DISCOGS_TACTICAL_STYLES.filter(s => !selectedGenres.includes(s));
    selectedGenres = [...selectedGenres, ...tacticalToInject];


    // Map to { name, count } format, generating a pseudo-random count for font sizing
    const mappedGenres = selectedGenres
      .map((name) => {
        // Simple hash to guarantee consistent sizes for the same genre
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
          hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        const pseudoRandomCount = Math.abs(hash * 4321) % 450000 + 50000;

        return {
          name,
          count: pseudoRandomCount,
          isAuthoritative: DISCOGS_TACTICAL_STYLES.includes(name.toLowerCase())
        };
      });


    return NextResponse.json({ genres: mappedGenres });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
