import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    version: "2.4.0",
    releaseDate: "2026-10-26",
    title: "Brnsic 2.4 • Supabase Cloud Sync & User Accounts",
    notes: "Fitur akun pengguna & login lintas perangkat terintegrasi Supabase Studio, modal onboarding kurasi selera awal (pilih 3+ artis & genre), logging aktivitas real-time (putar, like, skip, replay, selesai), dan sinkronisasi preferensi cloud.",
    buildTime: Date.now()
  });
}
