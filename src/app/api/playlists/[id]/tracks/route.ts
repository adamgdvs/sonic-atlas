import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

// GET /api/playlists/[id]/tracks — get all tracks in a playlist
export async function GET(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const playlist = await prisma.playlist.findUnique({
        where: { id },
        include: { tracks: { orderBy: { position: "asc" } } },
    });

    if (!playlist || playlist.userId !== session.user.id) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(playlist);
}

// POST /api/playlists/[id]/tracks — add a track to a playlist
export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const playlist = await prisma.playlist.findUnique({ where: { id } });
    if (!playlist || playlist.userId !== session.user.id) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = await req.json();
    const { title, artist, url, videoId, coverUrl, genres } = body;

    if (!title || !artist) {
        return NextResponse.json({ error: "Title and artist required" }, { status: 400 });
    }

    // Get next position
    const maxPos = await prisma.playlistTrack.aggregate({
        where: { playlistId: id },
        _max: { position: true },
    });
    const nextPosition = (maxPos._max.position ?? -1) + 1;

    const track = await prisma.playlistTrack.create({
        data: {
            playlistId: id,
            title,
            artist,
            url: url || "",
            videoId: videoId || null,
            coverUrl: coverUrl || null,
            genres: JSON.stringify(genres || []),
            position: nextPosition,
        },
    });

    // Update playlist timestamp
    await prisma.playlist.update({ where: { id }, data: { updatedAt: new Date() } });

    return NextResponse.json(track, { status: 201 });
}

// DELETE /api/playlists/[id]/tracks?trackId=xxx — remove a track
export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const playlist = await prisma.playlist.findUnique({ where: { id } });
    if (!playlist || playlist.userId !== session.user.id) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const trackId = searchParams.get("trackId");
    if (!trackId) return NextResponse.json({ error: "Missing trackId" }, { status: 400 });

    await prisma.playlistTrack.delete({ where: { id: trackId } });
    return NextResponse.json({ ok: true });
}
