import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    version: "3.0.0",
    releaseDate: "2026-10-27",
    title: "Brnsic 3.0 • Database Cloud Supabase & Prisma ORM",
    notes: "Penyimpanan data cloud permanen dengan Prisma ORM & PostgreSQL Supabase, modal login minimalis Google 1-klik, avatar profil Spotify, dan perbaikan tombol cari.",
    buildTime: Date.now()
  });
}
