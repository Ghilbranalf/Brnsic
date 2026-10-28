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
    version: "3.9.4",
    versionCode: 12,
    minVersionCode: 12,
    releaseDate: "2026-10-29",
    title: "Pembaruan Brnsic v3.9.4",
    notes: "Tinggi kapsul Dynamic Island dinaikkan ke 52dp (corner radius 26dp) dengan cover 36dp & waveform 24dp.",
    apkUrl: "/Brnsic.apk",
    apkSize,
    forceUpdate: true,
    buildTime: Date.now()
  });
}
