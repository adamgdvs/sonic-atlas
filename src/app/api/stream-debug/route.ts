import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const steps: string[] = [];

  try {
    steps.push("1. Importing youtubei.js...");
    const { Innertube, Platform } = await import("youtubei.js");

    steps.push("2. Setting up vm shim...");
    const vm = await import("node:vm");
    Platform.shim.eval = (
      data: { output: string; exported: string[] },
      env: Record<string, unknown>
    ) => {
      const wrapped = "(function() { " + data.output + " })()";
      const context = vm.createContext(env);
      const result = vm.runInContext(wrapped, context);
      if (data.exported.length === 1) {
        return { [data.exported[0]]: result };
      }
      return result;
    };

    steps.push("3. Creating Innertube instance...");
    const yt = await Innertube.create({ lang: "en", location: "US" });
    steps.push("3. OK - Innertube created");

    steps.push("4. Searching for Radiohead Burn the Witch...");
    const results = await yt.music.search("Radiohead Burn the Witch", { type: "song" });
    const contentsArray = results.contents as unknown as Array<{ type: string; contents?: unknown[] }>;
    const shelf = contentsArray?.[0];

    interface FlexColumn {
      title?: { runs?: Array<{ text: string; endpoint?: { payload?: { videoId?: string } } }> };
    }
    interface MusicItem {
      type: string;
      flex_columns?: FlexColumn[];
    }

    const items = (shelf as { contents?: MusicItem[] })?.contents || [];
    const first = items[0];
    const videoId = first?.flex_columns?.[0]?.title?.runs?.[0]?.endpoint?.payload?.videoId;
    steps.push(`4. OK - Found videoId: ${videoId}`);

    if (!videoId) {
      return NextResponse.json({ steps, error: "No videoId found" });
    }

    steps.push("5. Getting basic info with IOS client...");
    const info = await yt.getBasicInfo(videoId, { client: "IOS" });
    steps.push(`5. OK - Has streaming_data: ${!!info.streaming_data}`);

    if (!info.streaming_data) {
      steps.push("5. FAIL - No streaming data");
      return NextResponse.json({ steps });
    }

    const adaptive = info.streaming_data.adaptive_formats || [];
    const audioFormats = adaptive.filter((f) => f.has_audio && !f.has_video);
    steps.push(`6. Audio formats found: ${audioFormats.length}`);

    if (audioFormats.length === 0) {
      return NextResponse.json({ steps, error: "No audio formats" });
    }

    const best = audioFormats.sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0))[0];
    steps.push(`6. Best format: bitrate=${best.bitrate}, mime=${best.mime_type}, has_url=${!!best.url}`);

    let url = best.url;
    if (!url) {
      steps.push("7. Deciphering URL...");
      try {
        url = await best.decipher(yt.session.player);
        steps.push(`7. OK - Deciphered URL starts with: ${url?.substring(0, 60)}`);
      } catch (e) {
        steps.push(`7. FAIL - Decipher error: ${(e as Error).message}`);
      }
    } else {
      steps.push(`7. Direct URL starts with: ${url.substring(0, 60)}`);
    }

    return NextResponse.json({ steps, success: !!url, urlPreview: url?.substring(0, 100) });
  } catch (error) {
    steps.push(`FATAL: ${(error as Error).message}`);
    return NextResponse.json({ steps, error: (error as Error).message });
  }
}
