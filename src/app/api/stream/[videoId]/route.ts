import { NextRequest, NextResponse } from "next/server";
import { getStreamRedirectUrl } from "@/lib/youtube";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Proxies YouTube audio from a Piped instance to the browser.
 * Fetches the audio from Piped and streams it through, forwarding
 * Content-Type, Content-Length, and Range headers so the browser's
 * <audio> element can play and seek properly.
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

    // Forward the browser's Range header for seeking support
    const headers: Record<string, string> = {};
    const rangeHeader = request.headers.get("range");
    if (rangeHeader) {
      headers["Range"] = rangeHeader;
    }

    const audioResp = await fetch(cdnUrl, {
      headers,
      signal: AbortSignal.timeout(15000),
    });

    if (!audioResp.ok && audioResp.status !== 206) {
      console.error(`[Stream] Piped proxy returned ${audioResp.status} for videoId=${videoId}`);
      return NextResponse.json(
        { error: "Stream not available" },
        { status: 404 }
      );
    }

    // Forward relevant headers from the Piped response
    const responseHeaders = new Headers();
    const contentType = audioResp.headers.get("content-type");
    if (contentType) responseHeaders.set("Content-Type", contentType);
    const contentLength = audioResp.headers.get("content-length");
    if (contentLength) responseHeaders.set("Content-Length", contentLength);
    const contentRange = audioResp.headers.get("content-range");
    if (contentRange) responseHeaders.set("Content-Range", contentRange);
    const acceptRanges = audioResp.headers.get("accept-ranges");
    if (acceptRanges) responseHeaders.set("Accept-Ranges", acceptRanges);
    responseHeaders.set("Cache-Control", "private, max-age=3600");

    console.log(`[Stream] Proxying videoId=${videoId} status=${audioResp.status} size=${contentLength || "unknown"}`);

    return new NextResponse(audioResp.body, {
      status: audioResp.status,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("[Stream] Error for videoId=" + videoId + ":", error);
    return NextResponse.json(
      { error: "Stream proxy failed" },
      { status: 500 }
    );
  }
}
