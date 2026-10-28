import { NextRequest, NextResponse } from "next/server";
import { dbFindUserByEmail, dbCreateUser, dbUpdateUser } from "@/lib/db";
import { createSessionToken, toSafeUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin || "https://brnsic.vercel.app";
  const code = req.nextUrl.searchParams.get("code");
  const error = req.nextUrl.searchParams.get("error");
  const state = req.nextUrl.searchParams.get("state") || "";

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
    const safeUser = toSafeUser(user);
    const userJson = encodeURIComponent(JSON.stringify(safeUser));

    // If request originated from Android native APK, return deep link to switch back to APK!
    if (state === "native_apk") {
      const deepLink = `brnsic://auth?login_success=true&token=${encodeURIComponent(sessionToken)}&user=${userJson}`;
      const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Membuka Brnsic...</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { background: #000; color: #fff; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; padding: 20px; text-align: center; }
    .card { max-width: 340px; width: 100%; background: #121212; border: 1px solid rgba(255,255,255,0.1); border-radius: 24px; padding: 32px 24px; box-shadow: 0 20px 40px rgba(0,0,0,0.8); }
    .btn { display: block; margin-top: 24px; background: #1ed760; color: #000; font-weight: 800; font-size: 14px; padding: 14px 20px; border-radius: 999px; text-decoration: none; }
  </style>
</head>
<body>
  <div class="card">
    <div style="width:48px;height:48px;border-radius:50%;background:rgba(30,215,96,0.2);color:#1ed760;font-size:24px;font-weight:900;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;">✓</div>
    <h2 style="margin:0 0 8px;font-size:20px;font-weight:800;">Login Berhasil</h2>
    <p style="margin:0;color:#b3b3b3;font-size:13px;line-height:1.5;">Membuka kembali aplikasi Brnsic...</p>
    <a href="${deepLink}" class="btn">Buka Aplikasi Brnsic</a>
  </div>
  <script>
    var target = "${deepLink}";
    window.location.replace(target);
  </script>
</body>
</html>`;

      const response = new NextResponse(html, {
        headers: { "Content-Type": "text/html; charset=utf-8" }
      });
      response.cookies.set("brnsic_session", sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 90,
        path: "/"
      });
      return response;
    }

    const redirectUrl = `/?login_success=true&token=${encodeURIComponent(sessionToken)}&user=${userJson}`;
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Login Berhasil</title>
</head>
<body style="background:#000;color:#fff;">
  <script>
    try {
      localStorage.setItem("brnsic_auth_token", "${sessionToken}");
      localStorage.setItem("brnsic_user_profile", decodeURIComponent("${userJson}"));
    } catch (e) {}
    window.location.replace("${redirectUrl}");
  </script>
</body>
</html>`;

    const redirectResponse = new NextResponse(html, {
      headers: { "Content-Type": "text/html; charset=utf-8" }
    });
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
