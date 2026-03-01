import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const bookmarks = await prisma.bookmarkedArtist.findMany({
            where: { userId: session.user.id },
            orderBy: { createdAt: "desc" },
        });
        return NextResponse.json(bookmarks);
    } catch (error) {
        console.error("Error fetching bookmarks:", error);
        return NextResponse.json(
            { error: "Failed to fetch bookmarks" },
            { status: 500 }
        );
    }
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { artistId, name, imageUrl, genres } = body;

        if (!artistId || !name) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        const bookmark = await prisma.bookmarkedArtist.create({
            data: {
                userId: session.user.id,
                artistId,
                name,
                imageUrl,
                genres: JSON.stringify(genres || []),
            },
        });

        return NextResponse.json(bookmark);
    } catch (error) {
        console.error("Error creating bookmark:", error);
        return NextResponse.json(
            { error: "Failed to create bookmark" },
            { status: 500 }
        );
    }
}

export async function DELETE(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const artistId = searchParams.get("artistId");

        if (!artistId) {
            return NextResponse.json(
                { error: "Artist ID is required" },
                { status: 400 }
            );
        }

        await prisma.bookmarkedArtist.delete({
            where: {
                userId_artistId: {
                    userId: session.user.id,
                    artistId: artistId,
                },
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        // If it doesn't exist, we don't care, it's deleted as far as the client is concerned
        console.error("Error deleting bookmark:", error);
        return NextResponse.json(
            { error: "Failed to delete bookmark" },
            { status: 500 }
        );
    }
}
