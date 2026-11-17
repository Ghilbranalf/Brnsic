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
    version: "4.0.2",
    versionCode: 20,
    minVersionCode: 20,
    releaseDate: "2026-11-17",
    title: "Brnsic v4.0.2",
    notes: "Pembaruan v4.0.2: Mode Dynamic Island tembus status bar (AccessibilityService), perbaikan tombol aktivasi, dan upgrade algoritma rekomendasi musik.",
    apkUrl: "/Brnsic.apk",
    apkSize,
    forceUpdate: false,
    buildId: "20261117-a11y-island-v402"
  });
}
