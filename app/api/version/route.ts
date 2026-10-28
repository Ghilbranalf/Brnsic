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
    version: "3.9.0",
    versionCode: 8,
    minVersionCode: 8,
    releaseDate: "2026-10-29",
    title: "Pembaruan Brnsic v3.9.0",
    notes: "Kapsul Dynamic Island diperlebar & diturunkan presisi, tombol teks bawah dihapus & diganti grab bar panjang di bawah kartu.",
    apkUrl: "/Brnsic.apk",
    apkSize,
    forceUpdate: true,
    buildTime: Date.now()
  });
}
