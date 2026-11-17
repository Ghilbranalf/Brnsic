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
    version: "4.0.3",
    versionCode: 21,
    minVersionCode: 21,
    releaseDate: "2026-11-17",
    title: "Brnsic v4.0.3",
    notes: "Pembaruan v4.0.3: Desain Dynamic Island lebih tipis (30dp) & posisi lebih tinggi sejajar punch-hole seperti iOS.",
    apkUrl: "/Brnsic.apk",
    apkSize,
    forceUpdate: false,
    buildId: "20261117-slim-island-v403"
  });
}
