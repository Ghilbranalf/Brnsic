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
    version: "3.9.1",
    versionCode: 9,
    minVersionCode: 9,
    releaseDate: "2026-10-29",
    title: "Pembaruan Brnsic v3.9.1",
    notes: "Kapsul Dynamic Island diperlebar (265dp) dan dibuat lebih ramping/pendek (32dp) presisi khas Apple.",
    apkUrl: "/Brnsic.apk",
    apkSize,
    forceUpdate: true,
    buildTime: Date.now()
  });
}
