import { NextRequest, NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
  if (SUPABASE_URL) {
    try {
      // Test if Google provider is enabled in Supabase
      const checkRes = await fetch(`${SUPABASE_URL}/auth/v1/authorize?provider=google`, {
        redirect: "manual",
        cache: "no-store"
      });

      // If status is 302 or 200, Google provider is enabled!
      if (checkRes.status === 302 || checkRes.status === 200) {
        const origin = req.nextUrl.origin || "https://brnsic.vercel.app";
        const redirectUrl = `${SUPABASE_URL}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(origin)}`;
        return NextResponse.json({ url: redirectUrl, enabled: true });
      }

      // If 400, it means Google provider toggle is not turned on yet
      return NextResponse.json({ url: null, enabled: false });
    } catch (e) {
      return NextResponse.json({ url: null, enabled: false });
    }
  }
  return NextResponse.json({ url: null, enabled: false });
}
