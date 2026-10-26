import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    version: "2.5.0",
    releaseDate: "2026-10-26",
    title: "Brnsic 2.5 • Background Audio & Seamless PWA Install",
    notes: "Fitur pemutaran lagu di latar belakang saat membuka aplikasi lain (WhatsApp, Instagram, dsb.) atau layar mati di HP & laptop, integrasi MediaSession API, service worker offline cache, serta modal instalasi bertahap dengan indikator loading unduhan jelas.",
    buildTime: Date.now()
  });
}
