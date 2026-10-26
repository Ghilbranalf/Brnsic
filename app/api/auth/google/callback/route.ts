import { NextRequest, NextResponse } from "next/server";
import { dbFindUserByEmail, dbCreateUser, dbUpdateUser } from "@/lib/db";
import { createSessionToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin || "https://brnsic.vercel.app";
  const code = req.nextUrl.searchParams.get("code");
  const error = req.nextUrl.searchParams.get("error");

  if (error || !code) {
    return NextResponse.redirect(new URL("/?auth_error=" + encodeURIComponent(error || "Akses Google ditolak"), origin));
  }

  const GOOGLE_CLIENT_ID = (
    process.env.GOOGLE_CLIENT_ID ||
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
    ""
  ).trim();
  const GOOGLE_CLIENT_SECRET = (
    process.env.GOOGLE_CLIENT_SECRET ||
    ""
  ).trim();

  const callbackUrl = `${origin}/api/auth/google/callback`;

  try {
    // 1. Exchange authorization code for Google access token
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: callbackUrl,
        grant_type: "authorization_code"
      })
    });

    if (!tokenRes.ok) {
      const errBody = await tokenRes.text();
      console.error("Google token exchange error:", errBody);
      return NextResponse.redirect(new URL("/?auth_error=Gagal+verifikasi+token+Google", origin));
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    // 2. Fetch official Google User profile information
    const userRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (!userRes.ok) {
      return NextResponse.redirect(new URL("/?auth_error=Gagal+mengambil+profil+Google", origin));
    }

    const googleUser = await userRes.json();
    const email = (googleUser.email || "").trim().toLowerCase();
    const name = (googleUser.name || googleUser.given_name || email.split("@")[0] || "Pengguna Google").trim();
    const avatar = googleUser.picture || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(email)}`;

    if (!email) {
      return NextResponse.redirect(new URL("/?auth_error=Email+Google+tidak+ditemukan", origin));
    }

    // 3. Upsert user in PostgreSQL Supabase via Prisma ORM
    let user = await dbFindUserByEmail(email);
    if (!user) {
      user = await dbCreateUser(name, email, `google-oauth-${Date.now()}`, "google-salt");
      if (avatar) {
        user = (await dbUpdateUser(user.id, { avatar, name })) || user;
      }
    } else {
      user = (await dbUpdateUser(user.id, { avatar, name })) || user;
    }

    // 4. Create secure JWT session token
    const sessionToken = createSessionToken(user.id, user.email);

    const redirectResponse = NextResponse.redirect(new URL("/?login_success=true", origin));
    redirectResponse.cookies.set("brnsic_session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 90, // 90 days
      path: "/"
    });

    return redirectResponse;
  } catch (err: any) {
    console.error("Google OAuth Callback exception:", err);
    return NextResponse.redirect(new URL("/?auth_error=" + encodeURIComponent(err.message || "Error"), origin));
  }
}
