import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface IncomingTrack {
  title?: string;
  artist?: string;
  videoId?: string;
  coverUrl?: string | null;
  genres?: string[];
}

interface IncomingBody {
  name?: string;
  description?: string;
  coverUrl?: string | null;
  tracks?: IncomingTrack[];
}

const MAX_TRACKS = 200;

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as IncomingBody;
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const rawTracks = Array.isArray(body.tracks) ? body.tracks.slice(0, MAX_TRACKS) : [];
  const cleanTracks = rawTracks
    .map((t, index) => {
      const title = typeof t?.title === "string" ? t.title.trim() : "";
      const artist = typeof t?.artist === "string" ? t.artist.trim() : "";
      if (!title || !artist) return null;
      return {
        title,
        artist,
        url: "",
        videoId: typeof t.videoId === "string" && t.videoId.trim() ? t.videoId.trim() : null,
        coverUrl: typeof t.coverUrl === "string" && t.coverUrl ? t.coverUrl : null,
        genres: JSON.stringify(Array.isArray(t.genres) ? t.genres.filter((g): g is string => typeof g === "string") : []),
        position: index,
      };
    })
    .filter((t): t is NonNullable<typeof t> => t !== null);

  if (cleanTracks.length === 0) {
    return NextResponse.json({ error: "No playable tracks" }, { status: 400 });
  }

  const playlist = await prisma.playlist.create({
    data: {
      userId: session.user.id,
      name,
      description: body.description?.trim() || null,
      coverUrl: body.coverUrl || null,
      tracks: { create: cleanTracks },
    },
    include: { _count: { select: { tracks: true } } },
  });

  return NextResponse.json(
    { id: playlist.id, name: playlist.name, trackCount: playlist._count.tracks },
    { status: 201 }
  );
}
