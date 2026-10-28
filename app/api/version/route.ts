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
    version: "3.9.3",
    versionCode: 11,
    minVersionCode: 11,
    releaseDate: "2026-10-29",
    title: "Pembaruan Brnsic v3.9.3",
    notes: "Kapsul Dynamic Island diperpendek ke 210dp, dinaikkan tingginya ke 40dp, dan kartu pemutar dibuat ultra-rounded (44dp squircle).",
    apkUrl: "/Brnsic.apk",
    apkSize,
    forceUpdate: true,
    buildTime: Date.now()
  });
}
