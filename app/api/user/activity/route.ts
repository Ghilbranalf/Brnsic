import { NextResponse } from "next/server";
import { getAuthUser, toSafeUser } from "@/lib/auth";
import { dbLogUserActivity } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const user = await getAuthUser(req);
    const body = await req.json();
    const { songId, title, artist, genre, action, duration, listenSeconds } = body || {};

    if (!title || !artist || !action) {
      return NextResponse.json({ error: "Data interaksi tidak lengkap" }, { status: 400 });
    }

    if (!user) {
      // Guest mode: interaction accepted, stored locally by client
      return NextResponse.json({ success: true, guest: true });
    }

    const updatedUser = await dbLogUserActivity(user.id, {
      songId: songId || title,
      title,
      artist,
      genre,
      action,
      duration,
      listenSeconds
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
