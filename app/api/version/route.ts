import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    version: "2.2.0",
    releaseDate: "2026-10-26",
    title: "Brnsic 2.2 • Pembaruan Sistem",
    notes: "Pembaruan resmi tangga lagu Spotify Top 50 Indonesia & Global, prioritas pencarian judul lagu teratas, dan peningkatan performa audio.",
    buildTime: Date.now()
  });
}
