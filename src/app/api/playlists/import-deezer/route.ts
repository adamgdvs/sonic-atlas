import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import {
  matchDeezerPlaylistToYouTube,
  normalizeDeezerPlaylistImport,
} from "@/lib/deezer-import";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ImportDeezerBody {
  playlist?: unknown;
  trackPages?: unknown[];
  save?: boolean;
  limit?: number;
}

const MAX_IMPORT_TRACKS = 200;

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as ImportDeezerBody;

  try {
    const normalized = normalizeDeezerPlaylistImport(
      body.playlist,
      Array.isArray(body.trackPages) ? body.trackPages : []
    );

    const limit = Math.min(
      Math.max(typeof body.limit === "number" ? body.limit : normalized.tracks.length, 1),
      MAX_IMPORT_TRACKS
    );
    const result = await matchDeezerPlaylistToYouTube(normalized, { limit, batchSize: 6 });

    let savedPlaylist: { id: string; name: string; trackCount: number } | null = null;

    if (body.save) {
      const session = await getServerSession(authOptions);
      if (!session?.user) {
        return NextResponse.json(
          { error: "Unauthorized", import: result },
          { status: 401 }
        );
      }

      const createTracks = result.matches
        .filter((match) => match.status === "matched" && match.videoId)
        .map((match, index) => ({
          title: match.deezerTrack.title,
          artist: match.deezerTrack.artist,
          url: match.deezerTrack.preview || "",
          videoId: match.videoId,
          coverUrl: match.thumbnailUrl || match.deezerTrack.coverUrl,
          genres: JSON.stringify([]),
          position: index,
        }));

      if (createTracks.length === 0) {
        return NextResponse.json(
          { error: "No playable tracks matched", import: result },
          { status: 400 }
        );
      }

      const playlist = await prisma.playlist.create({
        data: {
          userId: session.user.id,
          name: normalized.title,
          description:
            normalized.description ||
            `Imported from Deezer${normalized.creatorName ? ` by ${normalized.creatorName}` : ""}`,
          coverUrl: normalized.coverUrl,
          tracks: { create: createTracks },
        },
        include: { _count: { select: { tracks: true } } },
      });

      savedPlaylist = {
        id: playlist.id,
        name: playlist.name,
        trackCount: playlist._count.tracks,
      };
    }

    return NextResponse.json({
      import: result,
      savedPlaylist,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid Deezer import payload";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
