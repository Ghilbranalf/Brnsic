import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [receivedShares, sentShares] = await Promise.all([
      prisma.playlistShare.findMany({
        where: { receiverId: user.id },
        include: {
          sender: { select: { id: true, name: true, email: true, avatar: true } }
        },
        orderBy: { createdAt: "desc" },
        take: 30
      }),
      prisma.playlistShare.findMany({
        where: { senderId: user.id },
        include: {
          receiver: { select: { id: true, name: true, email: true, avatar: true } }
        },
        orderBy: { createdAt: "desc" },
        take: 20
      })
    ]);

    return NextResponse.json({
      success: true,
      receivedShares,
      sentShares
    });
  } catch (err: any) {
    console.error("Share GET error:", err);
    return NextResponse.json({ error: "Gagal memuat playlist kiriman" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { action, receiverId, playlistName, playlistCover, songs, playlistId, shareId } = body || {};

    if (action === "send") {
      if (!receiverId || !playlistName || !Array.isArray(songs)) {
        return NextResponse.json({ error: "Data playlist tidak lengkap" }, { status: 400 });
      }

      // Verify friendship exists and is accepted
      const friendship = await prisma.friendship.findFirst({
        where: {
          status: "accepted",
          OR: [
            { requesterId: user.id, addresseeId: receiverId },
            { requesterId: receiverId, addresseeId: user.id }
          ]
        }
      });

      if (!friendship) {
        return NextResponse.json({ error: "Kalian belum berteman" }, { status: 403 });
      }

      const share = await prisma.playlistShare.create({
        data: {
          senderId: user.id,
          receiverId,
          playlistId: playlistId ? String(playlistId) : null,
          playlistName: String(playlistName).slice(0, 120),
          playlistCover: playlistCover || (songs[0]?.cover ?? null),
          songs: songs.slice(0, 150),
          status: "pending"
        }
      });

      return NextResponse.json({ success: true, share });
    }

    if (action === "accept" && shareId) {
      const share = await prisma.playlistShare.findUnique({ where: { id: shareId } });
      if (!share || share.receiverId !== user.id) {
        return NextResponse.json({ error: "Kiriman tidak ditemukan" }, { status: 404 });
      }

      const clonedPlaylist = await prisma.playlist.create({
        data: {
          userId: user.id,
          name: share.playlistName,
          cover: share.playlistCover,
          songs: share.songs as any
        }
      });

      await prisma.playlistShare.update({
        where: { id: shareId },
        data: { status: "accepted" }
      });

      return NextResponse.json({
        success: true,
        playlist: {
          id: clonedPlaylist.id,
          name: clonedPlaylist.name,
          cover: clonedPlaylist.cover || undefined,
          songs: Array.isArray(clonedPlaylist.songs) ? clonedPlaylist.songs : [],
          createdAt: clonedPlaylist.createdAt.getTime()
        }
      });
    }

    if (action === "decline" && shareId) {
      const share = await prisma.playlistShare.findUnique({ where: { id: shareId } });
      if (!share || share.receiverId !== user.id) {
        return NextResponse.json({ error: "Kiriman tidak ditemukan" }, { status: 404 });
      }
      await prisma.playlistShare.delete({ where: { id: shareId } });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Aksi tidak valid" }, { status: 400 });
  } catch (err: any) {
    console.error("Share POST error:", err);
    return NextResponse.json({ error: "Gagal memproses kiriman playlist" }, { status: 500 });
  }
}
