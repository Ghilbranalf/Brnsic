import { NextResponse } from "next/server";
import { getAuthUser, toSafeUser } from "@/lib/auth";
import { dbUpdateUser } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: "Sesi tidak valid" }, { status: 401 });
    }

    const body = await req.json();
    const { likedSongs, playlists, taste } = body || {};

    const updates: any = {};

    // Sync liked songs
    if (Array.isArray(likedSongs)) {
      if (body.replaceLikes) {
        updates.likedSongs = Array.from(new Set(likedSongs));
      } else {
        const mergedLikes = Array.from(new Set([...(user.likedSongs || []), ...likedSongs]));
        updates.likedSongs = mergedLikes;
      }
    }

    // Merge playlists (avoid duplicates by playlist id or name)
    if (Array.isArray(playlists)) {
      const existingPlMap = new Map((user.playlists || []).map((p: any) => [p.id || p.name, p]));
      for (const pl of playlists) {
        if (!existingPlMap.has(pl.id || pl.name)) {
          existingPlMap.set(pl.id || pl.name, pl);
        }
      }
      updates.playlists = Array.from(existingPlMap.values());
    }

    // Merge taste weights if provided
    if (taste && typeof taste === "object") {
      const mergedWeights = { ...(user.taste?.artistWeights || {}) };
      if (taste.artistWeights) {
        for (const [k, v] of Object.entries(taste.artistWeights)) {
          mergedWeights[k] = Math.max(mergedWeights[k] || 0, Number(v) || 0);
        }
      }
      updates.taste = {
        ...user.taste,
        artistWeights: mergedWeights,
        totalPlays: Math.max(user.taste?.totalPlays || 0, Number(taste.totalPlays) || 0)
      };
    }

    const updated = await dbUpdateUser(user.id, updates);
    if (!updated) {
      return NextResponse.json({ error: "Gagal menyinkronkan data" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      user: toSafeUser(updated)
    });
  } catch (err: any) {
    console.error("Sync error:", err);
    return NextResponse.json({ error: "Gagal memproses sinkronisasi" }, { status: 500 });
  }
}
