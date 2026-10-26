import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin || "https://brnsic.vercel.app";
  const GOOGLE_CLIENT_ID =
    process.env.GOOGLE_CLIENT_ID ||
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
    "";
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";

  // 1. Direct Official Google Cloud OAuth Account Chooser
  if (GOOGLE_CLIENT_ID) {
    const callbackUrl = `${origin}/api/auth/google/callback`;
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(
      GOOGLE_CLIENT_ID
    )}&redirect_uri=${encodeURIComponent(
      callbackUrl
    )}&response_type=code&scope=${encodeURIComponent(
      "openid email profile"
    )}&access_type=offline&prompt=select_account`;

    return NextResponse.json({ url: googleAuthUrl, enabled: true, mode: "google-direct" });
  }

  // 2. Supabase Google Provider
  if (SUPABASE_URL) {
    try {
      const checkRes = await fetch(`${SUPABASE_URL}/auth/v1/authorize?provider=google`, {
        redirect: "manual",
        cache: "no-store"
      });
      if (checkRes.status === 302 || checkRes.status === 200) {
        const redirectUrl = `${SUPABASE_URL}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(origin)}`;
        return NextResponse.json({ url: redirectUrl, enabled: true, mode: "supabase-oauth" });
      }
    } catch (e) {}
  }

  return NextResponse.json({ url: null, enabled: false });
}
