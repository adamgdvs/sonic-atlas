import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
    const type = request.nextUrl.searchParams.get("type") || "recent";

    try {
        if (type === "trending") {
            // Top 10 most-scanned artists in the last 24 hours
            const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
            const trending = await prisma.scanEvent.groupBy({
                by: ["artistName"],
                where: { createdAt: { gte: since } },
                _count: { artistName: true },
                orderBy: { _count: { artistName: "desc" } },
                take: 10,
            });

            return NextResponse.json({
                trending: trending.map(t => ({
                    artistName: t.artistName,
                    scanCount: t._count.artistName,
                })),
            });
        }

        if (type === "stats") {
            const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
            const [totalScans, uniqueArtists, recentScans] = await Promise.all([
                prisma.scanEvent.count(),
                prisma.scanEvent.groupBy({ by: ["artistName"] }).then(r => r.length),
                prisma.scanEvent.count({ where: { createdAt: { gte: since24h } } }),
            ]);

            return NextResponse.json({
                stats: { totalScans, uniqueArtists, recentScans },
            });
        }

        // Default: recent scans (last 50)
        const scans = await prisma.scanEvent.findMany({
            orderBy: { createdAt: "desc" },
            take: 50,
            select: {
                id: true,
                artistName: true,
                createdAt: true,
            },
        });

        return NextResponse.json({ scans });
    } catch (error) {
        console.error("Feed error:", error);
        return NextResponse.json({ scans: [], error: "Feed unavailable" }, { status: 200 });
    }
}
