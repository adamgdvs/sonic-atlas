import { NextRequest, NextResponse } from "next/server";
import { getArtistTourStatus } from "@/lib/ticketmaster";
import { dbCache } from "@/lib/dbCache";

const TOUR_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ name: string }> }
) {
    const { name } = await params;
    const artistName = decodeURIComponent(name);

    try {
        const tourStatus = await dbCache(
            `ticketmaster:tour:${artistName.toLowerCase()}`,
            TOUR_CACHE_TTL,
            () => getArtistTourStatus(artistName)
        );

        return NextResponse.json(tourStatus);
    } catch (error) {
        console.error("Tour status error:", error);
        return NextResponse.json(
            { hasEvents: false, eventCount: 0 },
            { status: 200 }
        );
    }
}
