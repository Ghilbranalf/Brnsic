import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const apkUrl = `${url.origin}/Brnsic.apk`;
  return NextResponse.redirect(apkUrl, 302);
}
