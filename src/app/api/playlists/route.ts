import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

// GET /api/playlists — list user's playlists
export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const playlists = await prisma.playlist.findMany({
        where: { userId: session.user.id },
        include: { _count: { select: { tracks: true } } },
        orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json(playlists);
}

// POST /api/playlists — create a new playlist
export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { name, description } = body;

    if (!name || typeof name !== "string") {
        return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const playlist = await prisma.playlist.create({
        data: {
            userId: session.user.id,
            name: name.trim(),
            description: description?.trim() || null,
        },
    });

    return NextResponse.json(playlist, { status: 201 });
}

// DELETE /api/playlists?id=xxx — delete a playlist
export async function DELETE(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing playlist id" }, { status: 400 });

    // Verify ownership
    const playlist = await prisma.playlist.findUnique({ where: { id } });
    if (!playlist || playlist.userId !== session.user.id) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.playlist.delete({ where: { id } });
    return NextResponse.json({ ok: true });
}
