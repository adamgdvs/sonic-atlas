import { NextResponse } from 'next/server';

const LASTFM_API_KEY = process.env.LASTFM_API_KEY;
const LASTFM_BASE_URL = 'https://ws.audioscrobbler.com/2.0/';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');

    if (!q) {
        return NextResponse.json([]);
    }

    try {
        // 1. Fetch Artist Suggestions
        const artistUrl = `${LASTFM_BASE_URL}?method=artist.search&artist=${encodeURIComponent(
            q
        )}&api_key=${LASTFM_API_KEY}&format=json&limit=5`;
        const artistRes = await fetch(artistUrl, { next: { revalidate: 3600 } });
        if (!artistRes.ok) throw new Error('Last.fm artist search failed');
        const artistData = await artistRes.json();

        let artistResults: { type: 'artist'; name: string }[] = [];
        if (artistData.results?.artistmatches?.artist) {
            if (Array.isArray(artistData.results.artistmatches.artist)) {
                artistResults = artistData.results.artistmatches.artist.map((a: any) => ({
                    type: 'artist' as const,
                    name: a.name,
                }));
            } else {
                artistResults = [
                    {
                        type: 'artist' as const,
                        name: artistData.results.artistmatches.artist.name,
                    },
                ];
            }
        }

        // 2. Genre matches
        // Allow users to force-search any string as a genre
        const genreResults: { type: 'genre'; name: string }[] = [
            { type: 'genre', name: q.toLowerCase() }
        ];

        // Combine and limit
        const combined = [...artistResults.slice(0, 4), ...genreResults];

        return NextResponse.json(combined);
    } catch (error) {
        console.error('Autocomplete Error:', error);
        return NextResponse.json([], { status: 500 });
    }
}
