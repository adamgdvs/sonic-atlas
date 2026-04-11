import { NextRequest, NextResponse } from "next/server";
import { getStreamRedirectUrl } from "@/lib/youtube";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Returns a redirect to the YouTube CDN audio URL.
 * The browser's <audio> element follows the redirect and plays directly
 * from the CDN, avoiding Vercel's serverless function timeout limits.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ videoId: string }> }
) {
  const { videoId } = await params;

  if (!videoId || videoId.length < 5) {
    return NextResponse.json({ error: "Invalid videoId" }, { status: 400 });
  }

  try {
    const cdnUrl = await getStreamRedirectUrl(videoId);

    if (!cdnUrl) {
      console.error(`[Stream] No URL available for videoId=${videoId}`);
      return NextResponse.json(
        { error: "Stream not available" },
        { status: 404 }
      );
    }

    console.log(`[Stream] Redirecting videoId=${videoId} to CDN`);

    return NextResponse.redirect(cdnUrl, 302);
  } catch (error) {
    console.error("[Stream] Error for videoId=" + videoId + ":", error);
    return NextResponse.json(
      { error: "Stream proxy failed" },
      { status: 500 }
    );
  }
}
