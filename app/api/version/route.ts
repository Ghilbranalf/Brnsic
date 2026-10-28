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
    version: "3.6.0",
    versionCode: 5,
    minVersionCode: 5,
    releaseDate: "2026-10-29",
    title: "Pembaruan Brnsic v3.6.0",
    notes: "Pembaruan Dynamic Island terkunci, visualizer nada live, teks berjalan, dan filter mood cerdas.",
    apkUrl: "/Brnsic.apk",
    apkSize,
    forceUpdate: true,
    buildTime: Date.now()
  });
}
