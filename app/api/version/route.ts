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
    version: "3.8.0",
    versionCode: 7,
    minVersionCode: 7,
    releaseDate: "2026-10-29",
    title: "Pembaruan Brnsic v3.8.0",
    notes: "Dynamic Island mepet paling atas sejajar status bar, kartu pintasan Spotify 4-grid, dan reset selera bersih.",
    apkUrl: "/Brnsic.apk",
    apkSize,
    forceUpdate: true,
    buildTime: Date.now()
  });
}
