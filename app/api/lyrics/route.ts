import { NextRequest, NextResponse } from "next/server";
import { fetchRealLyrics } from "@/lib/lyrics";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const artist = (searchParams.get("artist") || "").trim();
  const title = (searchParams.get("title") || "").trim();
  const rawDuration = parseFloat(searchParams.get("duration") || "210");
  const duration = isNaN(rawDuration) || rawDuration <= 10 ? 210 : rawDuration;

  if (!artist && !title) {
    return NextResponse.json({ lyrics: [], synced: false, hasLyrics: false });
  }

  const result = await fetchRealLyrics(artist, title, duration, 3500);
  return NextResponse.json(result);
}
