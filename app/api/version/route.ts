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
    version: "4.0.8",
    versionCode: 26,
    minVersionCode: 26,
    releaseDate: "2026-11-28",
    title: "Pembaruan Wajib Brnsic v4.0.8",
    notes: "Pembaruan wajib v4.0.8: Audio murni bebas ndet-ndetan/ngeframe di APK, pencarian cerdas judul parsial/artis/album/lirik, putar 1 album 1-tap, perbaikan logo, dan Dynamic Island.",
    apkUrl: "/Brnsic.apk",
    apkSize,
    forceUpdate: true,
    buildId: "20261128-v408"
  });
}
