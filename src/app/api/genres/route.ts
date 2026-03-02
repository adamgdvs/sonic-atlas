import { NextResponse } from "next/server";
import genresData from "@/data/genres.json";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "2000");

    // Map to { name, count } format, generating a pseudo-random count for font sizing
    const mappedGenres = genresData.genres
      .slice(0, limit)
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
        };
      });

    return NextResponse.json({ genres: mappedGenres });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
