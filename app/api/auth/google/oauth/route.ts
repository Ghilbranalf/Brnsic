import { NextRequest, NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
  if (isSupabaseConfigured() && SUPABASE_URL) {
    const origin = req.nextUrl.origin || "https://brnsic.vercel.app";
    const redirectUrl = `${SUPABASE_URL}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(origin)}`;
    return NextResponse.json({ url: redirectUrl });
  }
  return NextResponse.json({ url: null });
}
