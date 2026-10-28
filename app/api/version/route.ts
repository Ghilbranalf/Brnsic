import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export async function GET() {
  let apkSize = "8.9 MB";
  try {
    const apkPath = path.join(process.cwd(), "public", "Brnsic.apk");
    if (fs.existsSync(apkPath)) {
      const stats = fs.statSync(apkPath);
      apkSize = `${(stats.size / (1024 * 1024)).toFixed(1)} MB`;
    }
  } catch (e) {}

  return NextResponse.json({
    version: "3.3.0",
    versionCode: 2,
    minVersionCode: 2,
    releaseDate: "2026-10-28",
    title: "Pembaruan Aplikasi Diperlukan",
    notes: "Pembaruan algoritma kecerdasan musik, lirik ultra-presisi tanpa delay, dan sinkronisasi playlist permanen.",
    apkUrl: "/Brnsic.apk",
    apkSize,
    forceUpdate: true,
    buildTime: Date.now()
  });
}
