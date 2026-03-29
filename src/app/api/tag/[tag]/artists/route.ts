import { NextResponse } from 'next/server';

const LASTFM_API_KEY = process.env.LASTFM_API_KEY;

export async function GET(
    request: Request,
    { params }: { params: Promise<{ tag: string }> }
) {
    if (!LASTFM_API_KEY) {
        return NextResponse.json({ error: 'Last.fm API key not configured' }, { status: 500 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const limitStr = searchParams.get('limit') || '50';
        let limit = parseInt(limitStr, 10);
        if (isNaN(limit) || limit < 1 || limit > 200) {
            limit = 50;
        }

        const resolvedParams = await params;
        const tag = resolvedParams.tag;

        // 1. Fetch top artists for the tag from Last.fm
        const lastFmUrl = `http://ws.audioscrobbler.com/2.0/?method=tag.gettopartists&tag=${encodeURIComponent(tag)}&api_key=${LASTFM_API_KEY}&format=json&limit=${limit}`;
        // console.log("Fetching tag artists:", lastFmUrl);

        const lastFmResponse = await fetch(lastFmUrl);

        if (!lastFmResponse.ok) {
            throw new Error(`Last.fm API responded with status ${lastFmResponse.status}`);
        }

        const lastFmData = await lastFmResponse.json();

        // 2. Parse results
        let artists = [];

        if (lastFmData.topartists && lastFmData.topartists.artist) {
            // Last.fm might return a single object instead of an array if there's only one result
            const artistsArray = Array.isArray(lastFmData.topartists.artist)
                ? lastFmData.topartists.artist
                : [lastFmData.topartists.artist];

            // Map standard properties first
            artists = artistsArray.map((artist: { name: string; mbid?: string; url?: string }) => ({
                name: artist.name,
                mbid: artist.mbid || '',
                url: artist.url,
                image: null,
                match: 0 // Will assign later for display purposes
            }));
        }

        // 3. Fallback: Search Deezer for primary image (sequentially with a delay to avoid rate limiting)
        for (let i = 0; i < artists.length; i++) {
            const artist = artists[i];
            try {
                const dzUrl = `https://api.deezer.com/search/artist?q=${encodeURIComponent(artist.name)}&limit=1`;
                const dzRes = await fetch(dzUrl);
                if (dzRes.ok) {
                    const dzData = await dzRes.json();
                    if (dzData.data && dzData.data.length > 0) {
                        artist.image = dzData.data[0].picture_medium || null;
                    }
                }
            } catch (dzErr) {
                console.warn(`Failed to fetch Deezer image for ${artist.name}`);
            }

            // Small delay to respect rate limits
            await new Promise(resolve => setTimeout(resolve, 50));
        }

        return NextResponse.json({
            tag: tag,
            artists: artists
        });

    } catch (error) {
        console.error('Error fetching tag artists:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
