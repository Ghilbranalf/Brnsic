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

    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").trim();

    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [{ requesterId: user.id }, { addresseeId: user.id }]
      },
      include: {
        requester: { select: { id: true, name: true, email: true, avatar: true } },
        addressee: { select: { id: true, name: true, email: true, avatar: true } }
      },
      orderBy: { updatedAt: "desc" }
    });

    const friends: any[] = [];
    const incomingRequests: any[] = [];
    const outgoingRequests: any[] = [];
    const relatedUserIds = new Set<string>([user.id]);

    for (const f of friendships) {
      const isRequester = f.requesterId === user.id;
      const peer = isRequester ? f.addressee : f.requester;
      relatedUserIds.add(peer.id);

      if (f.status === "accepted") {
        friends.push({
          friendshipId: f.id,
          id: peer.id,
          name: peer.name,
          email: peer.email,
          avatar: peer.avatar
        });
      } else if (f.status === "pending") {
        if (isRequester) {
          outgoingRequests.push({
            friendshipId: f.id,
            id: peer.id,
            name: peer.name,
            email: peer.email,
            avatar: peer.avatar
          });
        } else {
          incomingRequests.push({
            friendshipId: f.id,
            id: peer.id,
            name: peer.name,
            email: peer.email,
            avatar: peer.avatar
          });
        }
      }
    }

    let searchResults: any[] = [];
    if (q.length >= 2) {
      const matched = await prisma.user.findMany({
        where: {
          id: { not: user.id },
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } }
          ]
        },
        select: { id: true, name: true, email: true, avatar: true },
        take: 10
      });

      searchResults = matched.map((u) => {
        const existing = friendships.find(
          (f) => f.requesterId === u.id || f.addresseeId === u.id
        );
        let relation: "none" | "friend" | "outgoing" | "incoming" = "none";
        if (existing) {
          if (existing.status === "accepted") relation = "friend";
          else if (existing.requesterId === user.id) relation = "outgoing";
          else relation = "incoming";
        }
        return {
          ...u,
          relation,
          friendshipId: existing?.id || null
        };
      });
    }

    return NextResponse.json({
      success: true,
      friends,
      incomingRequests,
      outgoingRequests,
      searchResults
    });
  } catch (err: any) {
    console.error("Friends GET error:", err);
    return NextResponse.json({ error: "Gagal memuat data teman" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { action, targetUserId, friendshipId, email } = body || {};

    if (action === "request") {
      let targetId = targetUserId as string | undefined;
      if (!targetId && email) {
        const found = await prisma.user.findUnique({
          where: { email: String(email).toLowerCase().trim() },
          select: { id: true }
        });
        targetId = found?.id;
      }
      if (!targetId || targetId === user.id) {
        return NextResponse.json({ error: "Pengguna tidak valid" }, { status: 400 });
      }

      const existing = await prisma.friendship.findFirst({
        where: {
          OR: [
            { requesterId: user.id, addresseeId: targetId },
            { requesterId: targetId, addresseeId: user.id }
          ]
        }
      });

      if (existing) {
        if (existing.status === "accepted") {
          return NextResponse.json({ success: true, status: "accepted" });
        }
        // If target already sent a request to us, auto-accept!
        if (existing.requesterId === targetId) {
          await prisma.friendship.update({
            where: { id: existing.id },
            data: { status: "accepted" }
          });
          return NextResponse.json({ success: true, status: "accepted" });
        }
        return NextResponse.json({ success: true, status: "pending" });
      }

      const created = await prisma.friendship.create({
        data: {
          requesterId: user.id,
          addresseeId: targetId,
          status: "pending"
        }
      });
      return NextResponse.json({ success: true, friendship: created });
    }

    if (action === "accept" && friendshipId) {
      const f = await prisma.friendship.findUnique({ where: { id: friendshipId } });
      if (!f || f.addresseeId !== user.id) {
        return NextResponse.json({ error: "Permintaan tidak ditemukan" }, { status: 404 });
      }
      await prisma.friendship.update({
        where: { id: friendshipId },
        data: { status: "accepted" }
      });
      return NextResponse.json({ success: true });
    }

    if ((action === "reject" || action === "remove") && friendshipId) {
      const f = await prisma.friendship.findUnique({ where: { id: friendshipId } });
      if (!f || (f.requesterId !== user.id && f.addresseeId !== user.id)) {
        return NextResponse.json({ error: "Data pertemanan tidak ditemukan" }, { status: 404 });
      }
      await prisma.friendship.delete({ where: { id: friendshipId } });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Aksi tidak valid" }, { status: 400 });
  } catch (err: any) {
    console.error("Friends POST error:", err);
    return NextResponse.json({ error: "Gagal memproses permintaan teman" }, { status: 500 });
  }
}
