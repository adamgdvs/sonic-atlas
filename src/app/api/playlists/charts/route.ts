import { NextResponse } from "next/server";
import { getCharts } from "@/lib/ytmusic";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const country = (searchParams.get("country") || "US").toUpperCase();
    const charts = await getCharts(country);
    return NextResponse.json(charts);
  } catch (error) {
    console.error("Failed to load charts:", error);
    return NextResponse.json({
      country: "US",
      songs: [],
      videos: [],
      artists: [],
    });
  }
}
