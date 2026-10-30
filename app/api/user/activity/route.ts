import { NextResponse } from "next/server";
import { getAuthUser, toSafeUser } from "@/lib/auth";
import { dbLogUserActivity } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: "Sesi tidak valid, silakan masuk ke akun Anda" }, { status: 401 });
    }

    const body = await req.json();
    const { songId, title, artist, genre, action, duration, listenSeconds, cover } = body || {};

    if (!title || !artist || !action) {
      return NextResponse.json({ error: "Data interaksi tidak lengkap" }, { status: 400 });
    }

    // Package genre and cover into metadata string so cover is preserved in UserActivity
    const metaGenre = cover ? JSON.stringify({ genre: genre || "Pop", cover }) : (genre || null);

    const updatedUser = await dbLogUserActivity(user.id, {
      songId: songId || title,
      title: title.trim(),
      artist: artist.trim(),
      genre: metaGenre,
      action,
      duration: duration || null,
      listenSeconds: listenSeconds || null
    });

    if (!updatedUser) {
      return NextResponse.json({ error: "Gagal mencatat interaksi" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      taste: updatedUser.taste,
      user: toSafeUser(updatedUser)
    });
  } catch (err: any) {
    console.error("Activity log error:", err);
    return NextResponse.json({ error: "Gagal memproses interaksi" }, { status: 500 });
  }
}
