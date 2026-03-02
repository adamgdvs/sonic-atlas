import { PreviewTrack } from "./api";

const ITUNES_BASE_URL = "https://itunes.apple.com/search";

export async function getItunesTopTracks(
    artistName: string,
    limit = 5
): Promise<PreviewTrack[]> {
    try {
        // We use entity=song and sort by popularity (which iTunes does implicitly for searches)
        const url = `${ITUNES_BASE_URL}?term=${encodeURIComponent(
            artistName
        )}&entity=song&limit=${limit}`;

        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) {
            console.error(`iTunes Search API error: ${res.status}`);
            return [];
        }

        const data = await res.json();
        if (!data.results || data.results.length === 0) {
            return [];
        }

        // Map iTunes results to our PreviewTrack format
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return data.results.map((track: any) => ({
            id: track.trackId,
            title: track.trackName,
            preview: track.previewUrl || "",
            duration: Math.floor((track.trackTimeMillis || 0) / 1000),
        }));
    } catch (error) {
        console.error("iTunes connection error:", error);
        return [];
    }
}
