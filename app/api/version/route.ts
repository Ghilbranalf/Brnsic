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
    version: "4.0.1",
    versionCode: 19,
    minVersionCode: 19,
    releaseDate: "2026-11-01",
    title: "Brnsic v4.0.1",
    notes: "Pembaruan v4.0.1: Fitur tema musiman & aksen hari spesial (Halloween, Natal, Tahun Baru, Valentine, Ramadan, dll) dan variasi suasana harian tanpa merubah desain.",
    apkUrl: "/Brnsic.apk",
    apkSize,
    forceUpdate: false,
    buildId: "20261101-welcome-gate-v35"
  });
}
