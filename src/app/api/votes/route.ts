import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

// POST /api/votes — cast, change, or remove a vote
export async function POST(request: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { artistId, vote } = body;

    if (!artistId || ![1, -1, 0].includes(vote)) {
        return NextResponse.json({ error: "Invalid request. artistId required, vote must be 1, -1, or 0." }, { status: 400 });
    }

    const normalizedArtistId = artistId.toLowerCase();

    try {
        if (vote === 0) {
            // Remove vote
            await prisma.artistVote.deleteMany({
                where: {
                    userId: session.user.id,
                    artistId: normalizedArtistId,
                },
            });
        } else {
            // Upsert vote
            await prisma.artistVote.upsert({
                where: {
                    userId_artistId: {
                        userId: session.user.id,
                        artistId: normalizedArtistId,
                    },
                },
                update: { vote },
                create: {
                    userId: session.user.id,
                    artistId: normalizedArtistId,
                    vote,
                },
            });
        }

        // Return updated aggregate
        const aggregate = await getAggregateVotes(normalizedArtistId);
        const userVote = vote === 0 ? 0 : vote;

        return NextResponse.json({ ...aggregate, userVote });
    } catch (error) {
        console.error("Vote error:", error);
        return NextResponse.json({ error: "Failed to process vote" }, { status: 500 });
    }
}

// GET /api/votes?artistId=radiohead — get aggregate for one artist
// GET /api/votes?artistIds=radiohead,nirvana — get aggregates for multiple artists (batch)
export async function GET(request: NextRequest) {
    const session = await getServerSession(authOptions);
    const artistId = request.nextUrl.searchParams.get("artistId");
    const artistIds = request.nextUrl.searchParams.get("artistIds");

    if (!artistId && !artistIds) {
        return NextResponse.json({ error: "artistId or artistIds required" }, { status: 400 });
    }

    try {
        if (artistId) {
            // Single artist
            const normalizedId = artistId.toLowerCase();
            const aggregate = await getAggregateVotes(normalizedId);

            let userVote = 0;
            if (session?.user?.id) {
                const existing = await prisma.artistVote.findUnique({
                    where: {
                        userId_artistId: {
                            userId: session.user.id,
                            artistId: normalizedId,
                        },
                    },
                });
                userVote = existing?.vote || 0;
            }

            return NextResponse.json({ ...aggregate, userVote });
        }

        // Batch: multiple artists
        const ids = artistIds!.split(",").map(id => id.trim().toLowerCase()).filter(Boolean);
        if (ids.length === 0) {
            return NextResponse.json({ votes: {} });
        }

        // Get all votes for these artists in one query
        const allVotes = await prisma.artistVote.groupBy({
            by: ["artistId", "vote"],
            where: { artistId: { in: ids } },
            _count: { vote: true },
        });

        // Get user's own votes if logged in
        let userVotes: Record<string, number> = {};
        if (session?.user?.id) {
            const own = await prisma.artistVote.findMany({
                where: {
                    userId: session.user.id,
                    artistId: { in: ids },
                },
                select: { artistId: true, vote: true },
            });
            userVotes = Object.fromEntries(own.map(v => [v.artistId, v.vote]));
        }

        // Assemble results
        const votes: Record<string, { up: number; down: number; total: number; approval: number; userVote: number }> = {};

        for (const id of ids) {
            const upEntry = allVotes.find(v => v.artistId === id && v.vote === 1);
            const downEntry = allVotes.find(v => v.artistId === id && v.vote === -1);
            const up = upEntry?._count?.vote || 0;
            const down = downEntry?._count?.vote || 0;
            const total = up + down;

            votes[id] = {
                up,
                down,
                total,
                approval: total > 0 ? Math.round((up / total) * 100) : 0,
                userVote: userVotes[id] || 0,
            };
        }

        return NextResponse.json({ votes });
    } catch (error) {
        console.error("Votes fetch error:", error);
        return NextResponse.json({ error: "Failed to fetch votes" }, { status: 500 });
    }
}

async function getAggregateVotes(artistId: string) {
    const [upCount, downCount] = await Promise.all([
        prisma.artistVote.count({ where: { artistId, vote: 1 } }),
        prisma.artistVote.count({ where: { artistId, vote: -1 } }),
    ]);

    const total = upCount + downCount;

    return {
        up: upCount,
        down: downCount,
        total,
        approval: total > 0 ? Math.round((upCount / total) * 100) : 0,
    };
}
