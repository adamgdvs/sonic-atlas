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



    return (
        <div className="min-h-screen bg-shift5-dark text-white flex flex-col">
            <Header />
            <MyAtlasClient bookmarks={bookmarks} />
        </div>
    );
}
