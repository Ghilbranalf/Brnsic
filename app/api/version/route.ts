import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    version: "2.3.0",
    releaseDate: "2026-10-26",
    title: "Brnsic 2.3 • Spotify Smart Shuffle & Taste Engine",
    notes: "Fitur Spotify Smart Shuffle 3-state (Off / Standard Fewer Repeats / Smart ✨), algoritma pengacakan seimbang berbasis genre & selera lokal tanpa login, serta penataan kontrol audio resmi Spotify.",
    buildTime: Date.now()
  });
}
