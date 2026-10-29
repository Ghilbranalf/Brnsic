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
    version: "3.9.9",
    versionCode: 17,
    minVersionCode: 17,
    releaseDate: "2026-10-29",
    title: "Pembaruan Brnsic v3.9.9",
    notes: "Radio genre presisi tinggi, perbaikan resume lagu setelah tutup APK, prioritas rekomendasi beranda, dan eliminasi error hidrasi React.",
    apkUrl: "/Brnsic.apk",
    apkSize,
    forceUpdate: true,
    buildTime: Date.now()
  });
}
