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
    version: "3.9.5",
    versionCode: 13,
    minVersionCode: 13,
    releaseDate: "2026-10-29",
    title: "Pembaruan Brnsic v3.9.5",
    notes: "Dynamic Island tetap di paling atas (6dp) & 100% responsif diklik dengan Cutout Display Mode & Immediate Touch Consumer.",
    apkUrl: "/Brnsic.apk",
    apkSize,
    forceUpdate: true,
    buildTime: Date.now()
  });
}
