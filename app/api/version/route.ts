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
    version: "4.0.5",
    versionCode: 23,
    minVersionCode: 23,
    releaseDate: "2026-11-22",
    title: "Brnsic v4.0.5",
    notes: "Pembaruan v4.0.5: Menghapus tombol aksesibilitas melayang, perbaikan shuffle & pemutaran, Sleep Timer, swipe gesture, dan tema kalender otomatis.",
    apkUrl: "/Brnsic.apk",
    apkSize,
    forceUpdate: false,
    buildId: "20261122-clean-v405"
  });
}
