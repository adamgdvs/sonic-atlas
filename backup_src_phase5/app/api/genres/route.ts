import { NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "2000");

    const filePath = path.join(process.cwd(), "src", "data", "genres.json");
    const fileContents = await fs.readFile(filePath, "utf8");
    const genresList: string[] = JSON.parse(fileContents);

    // Filter out invalid items and slice
    const sliced = genresList.slice(0, limit);

    const mapped = sliced.map((g) => ({
      name: g,
      count: 0,
    }));

    return NextResponse.json({ genres: mapped });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
