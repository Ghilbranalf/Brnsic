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
    version: "3.9.7",
    versionCode: 15,
    minVersionCode: 15,
    releaseDate: "2026-10-29",
    title: "Pembaruan Brnsic v3.9.7",
    notes: "Kartu Dynamic Island dibuat rounded full (54dp), tetap muncul saat dijeda (hanya hilang saat close APK), modal update dibersihkan, dan algoritma lirik cerdas dengan scoring & auto-offset.",
    apkUrl: "/Brnsic.apk",
    apkSize,
    forceUpdate: true,
    buildTime: Date.now()
  });
}
