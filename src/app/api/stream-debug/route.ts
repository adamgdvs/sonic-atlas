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

    const clients = ["IOS", "ANDROID", "TV_EMBEDDED", "WEB", "YTMUSIC", "YTMUSIC_ANDROID", "MWEB", "WEB_CREATOR"] as const;

    for (const client of clients) {
      try {
        steps.push(`5. Trying client=${client}...`);
        const info = await yt.getBasicInfo(videoId, { client: client as "IOS" | "ANDROID" | "TV_EMBEDDED" | "WEB" | "YTMUSIC" | "YTMUSIC_ANDROID" | "MWEB" | "WEB_CREATOR" });
        const hasData = !!info.streaming_data;
        const formatCount = hasData ? (info.streaming_data?.adaptive_formats?.length || 0) : 0;
        const audioCount = hasData ? (info.streaming_data?.adaptive_formats?.filter((f) => f.has_audio && !f.has_video)?.length || 0) : 0;
        steps.push(`   ${client}: streaming_data=${hasData}, adaptive=${formatCount}, audio_only=${audioCount}`);

        if (hasData && audioCount > 0) {
          const best = info.streaming_data!.adaptive_formats
            .filter((f) => f.has_audio && !f.has_video)
            .sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0))[0];
          steps.push(`   Best: bitrate=${best.bitrate}, mime=${best.mime_type}, has_url=${!!best.url}, has_cipher=${!!best.signature_cipher || !!best.cipher}`);

          let url = best.url;
          if (!url) {
            try {
              url = await best.decipher(yt.session.player);
              steps.push(`   Deciphered: ${url?.substring(0, 80)}`);
            } catch (e) {
              steps.push(`   Decipher FAILED: ${(e as Error).message}`);
            }
          } else {
            steps.push(`   Direct URL: ${url.substring(0, 80)}`);
          }

          if (url) {
            return NextResponse.json({ steps, success: true, client, urlPreview: url.substring(0, 100) });
          }
        }

        // Also check playability_status
        const ps = (info as unknown as { playability_status?: { status?: string; reason?: string } }).playability_status;
        if (ps) {
          steps.push(`   playability: status=${ps.status}, reason=${ps.reason || 'none'}`);
        }
      } catch (e) {
        steps.push(`   ${client} ERROR: ${(e as Error).message?.substring(0, 100)}`);
      }
    }

    return NextResponse.json({ steps, success: false });
  } catch (error) {
    steps.push(`FATAL: ${(error as Error).message}`);
    return NextResponse.json({ steps, error: (error as Error).message });
  }
}
