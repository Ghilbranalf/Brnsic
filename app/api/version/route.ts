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
    version: "4.0.0",
    versionCode: 18,
    minVersionCode: 18,
    releaseDate: "2026-10-29",
    title: "Brnsic v4.0.0",
    notes: "Fitur Wajib Masuk (Fullscreen Welcome Gate): eliminasi total mode tamu, autentikasi 1-klik Google, sinkronisasi cloud real-time.",
    apkUrl: "/Brnsic.apk",
    apkSize,
    forceUpdate: false,
    buildId: "20261031-welcome-gate-v24"
  });
}
