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
    version: "3.4.0",
    versionCode: 3,
    minVersionCode: 3,
    releaseDate: "2026-10-28",
    title: "Pembaruan Pemutar Musik Brnsic v3.4.0",
    notes: "Pembaruan notifikasi pemutar media Android resmi (MediaSession kartu notifikasi Spotify dengan seekbar interaktif dan kontrol layar kunci).",
    apkUrl: "/Brnsic.apk",
    apkSize,
    forceUpdate: true,
    buildTime: Date.now()
  });
}
