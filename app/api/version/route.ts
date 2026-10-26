import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    version: "3.1.0",
    releaseDate: "2026-10-27",
    title: "Brnsic 3.1 • Logo Transparan & Database Cloud Prisma ORM",
    notes: "Pembaruan visual logo transparan jernih tanpa latar belakang hitam, sinkronisasi cloud Supabase PostgreSQL, modal login Google 1-klik, dan optimasi 120 FPS.",
    buildTime: Date.now()
  });
}
