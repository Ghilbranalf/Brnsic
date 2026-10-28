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
    version: "3.9.6",
    versionCode: 14,
    minVersionCode: 14,
    releaseDate: "2026-10-29",
    title: "Pembaruan Brnsic v3.9.6",
    notes: "Tebal kapsul Dynamic Island diturunkan ke 44dp dan posisi top disetel 12dp agar bagian paling atas bisa diklik tanpa terserap status bar.",
    apkUrl: "/Brnsic.apk",
    apkSize,
    forceUpdate: true,
    buildTime: Date.now()
  });
}
