import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(request: NextRequest) {
    try {
        const { artistName } = await request.json();
        if (!artistName || typeof artistName !== "string") {
            return NextResponse.json({ error: "Missing artistName" }, { status: 400 });
        }

        const session = await getServerSession(authOptions);
        const userId = session?.user?.id || null;

        // Rate limit: max 1 scan per artist per user/IP per 5 minutes
        const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
        const recentScan = await prisma.scanEvent.findFirst({
            where: {
                artistName: artistName.toLowerCase(),
                userId: userId,
                createdAt: { gte: fiveMinAgo },
            },
        });

        if (recentScan) {
            return NextResponse.json({ ok: true, deduplicated: true });
        }

        await prisma.scanEvent.create({
            data: {
                artistName: artistName.toLowerCase(),
                userId,
            },
        });

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error("Scan log error:", error);
        return NextResponse.json({ ok: false }, { status: 200 });
    }
}
