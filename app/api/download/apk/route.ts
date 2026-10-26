import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const GITHUB_APK_URL = "https://github.com/Ghilbranalf/Brnsic/releases/download/latest-apk/Brnsic.apk";
  return NextResponse.redirect(GITHUB_APK_URL, 302);
}
