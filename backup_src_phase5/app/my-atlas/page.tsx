import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Header from "@/components/Header";
import HomeConstellationGraph from "@/components/HomeConstellationGraph";
import Image from "next/image";
import Link from "next/link";
import ArtistInitials from "@/components/ArtistInitials";

export default async function MyAtlasPage() {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        redirect("/");
    }

    const bookmarks = await prisma.bookmarkedArtist.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
    });

    const graphNodes = bookmarks.map((b) => ({
        id: b.artistId,
        name: b.name,
        genres: b.genres ? JSON.parse(b.genres) : [],
        imageUrl: b.imageUrl,
    }));

    return (
        <div className="min-h-screen bg-[#FAFAFA] flex flex-col">
            <Header />
            <main className="flex-1 flex flex-col lg:flex-row overflow-hidden relative" style={{ height: "calc(100vh - 56px)" }}>

                {/* Left Sidebar - List */}
                <div className="w-full lg:w-[380px] bg-white border-r border-[#F0F0F0] flex flex-col h-[400px] lg:h-full shrink-0 z-10 shadow-[4px_0_24px_rgba(0,0,0,0.02)] relative">
                    <div className="px-6 py-5 border-b border-[#F0F0F0] sticky top-0 bg-white/80 backdrop-blur-md z-10">
                        <h1 className="text-xl font-bold text-[#1D1D1F] tracking-tight mb-1" style={{ letterSpacing: "-0.02em" }}>My Atlas</h1>
                        <p className="text-[13px] text-[#9CA3AF]">
                            {bookmarks.length} saved artist{bookmarks.length === 1 ? '' : 's'}
                        </p>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-1">
                        {bookmarks.length === 0 ? (
                            <div className="text-[13px] text-[#9CA3AF] text-center mt-10">
                                You haven&apos;t bookmarked any artists yet.
                            </div>
                        ) : (
                            bookmarks.map((b) => {
                                const genres = b.genres ? JSON.parse(b.genres) : [];
                                return (
                                    <Link
                                        key={b.id}
                                        href={`/artist/${encodeURIComponent(b.name)}`}
                                        className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-[#F8F8FA] transition-all border border-transparent hover:border-[#E5E5E5] group no-underline"
                                    >
                                        <div className="w-10 h-10 shrink-0 rounded-full overflow-hidden bg-[#F0F0F0]">
                                            {b.imageUrl ? (
                                                <Image src={b.imageUrl} alt={b.name} width={40} height={40} className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300" unoptimized />
                                            ) : (
                                                <ArtistInitials name={b.name} size={40} />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-[14px] font-semibold text-[#1D1D1F] truncate group-hover:text-blue-600 transition-colors" style={{ letterSpacing: "-0.01em" }}>{b.name}</h3>
                                            {genres.length > 0 && (
                                                <p className="text-[11px] text-[#9CA3AF] truncate mt-0.5">
                                                    {genres.slice(0, 2).join(", ")}
                                                </p>
                                            )}
                                        </div>
                                        <div className="text-[#E5E5E5] group-hover:text-[#1D1D1F] transition-colors pr-2">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                                        </div>
                                    </Link>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Right Content - Constellation Graph */}
                <div className="flex-1 relative bg-[#FAFAFA] min-h-[500px] lg:min-h-0 bg-[radial-gradient(#E5E5E5_1px,transparent_1px)] [background-size:24px_24px]">
                    <div className="absolute inset-0">
                        <HomeConstellationGraph bookmarks={graphNodes} size={1000} />
                    </div>
                    {/* Subtle vignette/shadow for depth */}
                    <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_100px_rgba(0,0,0,0.02)]"></div>
                </div>
            </main>
        </div>
    );
}
