import { NextRequest, NextResponse } from "next/server";
import { dbGetPlaylistById } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "ID Playlist diperlukan" }, { status: 400 });
    }

    const playlist = await dbGetPlaylistById(id.trim());
    if (!playlist) {
      return NextResponse.json({ error: "Playlist tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({ success: true, playlist });
  } catch (err: any) {
    console.error("API Playlist error:", err);
    return NextResponse.json({ error: "Gagal memuat playlist" }, { status: 500 });
  }
}
