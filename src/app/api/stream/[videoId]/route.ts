import { NextRequest, NextResponse } from "next/server";
import { getAudioStream } from "@/lib/youtube";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Streams full YouTube Music audio to the browser.
 * Uses yt-dlp for authenticated URL extraction + node:https proxy with
 * proper Content-Length and Range support for browser audio playback.
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
    const rangeHeader = request.headers.get("range");
    const result = await getAudioStream(videoId, rangeHeader);

    if (!result) {
      console.error(`[Stream] No stream available for videoId=${videoId}`);
      return NextResponse.json(
        { error: "Stream not available" },
        { status: 404 }
      );
    }

    // Convert Node.js Readable to Web ReadableStream
    const webStream = new ReadableStream({
      start(controller) {
        result.stream.on("data", (chunk: Buffer) => {
          controller.enqueue(new Uint8Array(chunk));
        });
        result.stream.on("end", () => {
          controller.close();
        });
        result.stream.on("error", (err) => {
          controller.error(err);
        });
      },
      cancel() {
        result.stream.destroy();
      },
    });

    const responseHeaders = new Headers();
    responseHeaders.set("Cache-Control", "private, max-age=3600");

    // Forward CDN headers for proper browser audio playback
    for (const [key, value] of Object.entries(result.headers)) {
      responseHeaders.set(key, value);
    }

    console.log(`[Stream] Serving videoId=${videoId} status=${result.statusCode}`);

    return new NextResponse(webStream, {
      status: result.statusCode,
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
