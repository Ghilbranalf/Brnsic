import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export async function GET() {
  let apkSize = "9.1 MB";
  try {
    const apkPath = path.join(process.cwd(), "public", "Brnsic.apk");
    if (fs.existsSync(apkPath)) {
      const stats = fs.statSync(apkPath);
      apkSize = `${(stats.size / 1000000).toFixed(1)} MB`;
    }
  } catch (e) {}

  return NextResponse.json({
    version: "4.0.0",
    versionCode: 18,
    minVersionCode: 18,
    releaseDate: "2026-10-29",
    title: "Pembaruan Brnsic v4.0.0",
    notes: "Fitur Putar Berikutnya & Tambah ke Antrean, tombol Acak Lagu di Playlist, data rekomendasi 100% real-time artis & genre, serta eliminasi total data dummy.",
    apkUrl: "/Brnsic.apk",
    apkSize,
    forceUpdate: true,
    buildTime: Date.now()
  });
}
