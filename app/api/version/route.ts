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
    version: "4.0.6",
    versionCode: 24,
    minVersionCode: 24,
    releaseDate: "2026-11-28",
    title: "Brnsic v4.0.6",
    notes: "Pembaruan v4.0.6: Filter ketat lagu berlirik, pemutar audio native bebas frame drop, perbaikan background play iPhone PWA, perbaikan navbar Android 15+, proporsi logo, dan jembatan login Chrome ke APK.",
    apkUrl: "/Brnsic.apk",
    apkSize,
    forceUpdate: true,
    buildId: "20261128-v406"
  });
}
