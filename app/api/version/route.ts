import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    version: "2.7.0",
    releaseDate: "2026-10-26",
    title: "Brnsic 2.7 • Fitur Dislike, Scrubber Akurat & Onboarding Spotify",
    notes: "Fitur Dislike / Sembunyikan lagu, perbaikan durasi lagu dan scrubber timeline akurat, pencegahan lagu berulang, onboarding bundar ala Spotify, dan audio studio master resmi.",
    buildTime: Date.now()
  });
}
