import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    version: "2.6.0",
    releaseDate: "2026-10-26",
    title: "Brnsic 2.6 • Smart Shuffle & Onboarding Baru",
    notes: "Pembaruan Smart Shuffle berbasis selera & genre, modal kurasi musik di awal, login akun Google instan, serta background audio keepalive.",
    buildTime: Date.now()
  });
}
