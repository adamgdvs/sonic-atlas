import { NextResponse } from "next/server";
import { getMoodCards } from "@/lib/ytmusic";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const moods = await getMoodCards();
    return NextResponse.json({ moods });
  } catch (error) {
    console.error("Failed to load curated moods:", error);
    return NextResponse.json({ moods: [] });
  }
}
