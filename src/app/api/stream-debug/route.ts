import { NextResponse } from "next/server";
import { getStreamRedirectUrl } from "@/lib/youtube";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    // Test with Burn the Witch videoId
    const videoId = "qIm0fsMo0Rg";
    const url = await getStreamRedirectUrl(videoId);
    return NextResponse.json({
      success: !!url,
      videoId,
      urlPreview: url?.substring(0, 100) || null,
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: (error as Error).message,
    });
  }
}
