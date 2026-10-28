import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, createSessionToken, toSafeUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin || "https://brnsic.vercel.app";
  const user = await getAuthUser(req);

  // If user is already logged in on the browser, return instant seamless deep-link into APK!
  if (user) {
    const sessionToken = createSessionToken(user.id, user.email);
    const safeUser = toSafeUser(user);
    const userJson = encodeURIComponent(JSON.stringify(safeUser));
    const deepLink = `brnsic://auth?login_success=true&token=${encodeURIComponent(sessionToken)}&user=${userJson}`;

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Menyambungkan ke Brnsic...</title>
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
    <h2 style="margin:0 0 8px;font-size:20px;font-weight:800;">Akun Ditemukan</h2>
    <p style="margin:0;color:#b3b3b3;font-size:13px;line-height:1.5;">Menghubungkan akun ${user.email} ke aplikasi Brnsic...</p>
    <a href="${deepLink}" class="btn">Buka Aplikasi Brnsic</a>
  </div>
  <script>
    var target = "${deepLink}";
    window.location.replace(target);
  </script>
</body>
</html>`;

    return new NextResponse(html, {
      headers: { "Content-Type": "text/html; charset=utf-8" }
    });
  }

  // If not logged in yet, forward to standard Google OAuth
  const GOOGLE_CLIENT_ID = (
    process.env.GOOGLE_CLIENT_ID ||
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
    ""
  ).trim();

  if (GOOGLE_CLIENT_ID) {
    const callbackUrl = `${origin}/api/auth/google/callback`;
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(
      GOOGLE_CLIENT_ID
    )}&redirect_uri=${encodeURIComponent(
      callbackUrl
    )}&response_type=code&scope=${encodeURIComponent(
      "openid email profile"
    )}&access_type=offline&prompt=select_account&state=native_apk`;

    return NextResponse.redirect(googleAuthUrl);
  }

  return NextResponse.redirect(new URL("/?auth_error=Google+Client+ID+tidak+terkonfigurasi", origin));
}
