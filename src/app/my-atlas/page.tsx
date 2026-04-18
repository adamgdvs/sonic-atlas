import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Header from "@/components/Header";
import MyAtlasClient from "./MyAtlasClient";

export default async function MyAtlasPage() {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        redirect("/");
    }

    const bookmarks = await prisma.bookmarkedArtist.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
    });

    const playlists = await prisma.playlist.findMany({
        where: { userId: session.user.id },
        include: {
            tracks: { orderBy: { position: "asc" } },
            _count: { select: { tracks: true } },
        },
        orderBy: { updatedAt: "desc" },
    });

    return (
        <div className="min-h-screen lg:h-screen lg:overflow-hidden bg-shift5-dark text-white flex flex-col">
            <Header />
            <MyAtlasClient bookmarks={bookmarks} playlists={playlists} />
        </div>
    );
}
