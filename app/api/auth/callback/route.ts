import { NextRequest, NextResponse } from "next/server";
import { dbFindUserByEmail, dbCreateUser, dbUpdateUser } from "@/lib/db";
import { createSessionToken, toSafeUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const requestUrl = new URL(req.url);
  const code = requestUrl.searchParams.get("code");
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const origin = requestUrl.origin || "https://brnsic.vercel.app";

  if (code && SUPABASE_URL) {
    try {
      // Exchange code for Supabase session token
      const tokenRes = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=authorization_code`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
        },
        body: JSON.stringify({ code })
      });

      if (tokenRes.ok) {
        const tokenData = await tokenRes.json();
        const userObj = tokenData.user;
        if (userObj && userObj.email) {
          const email = userObj.email.toLowerCase().trim();
          const name = userObj.user_metadata?.full_name || userObj.user_metadata?.name || email.split("@")[0];
          const avatar = userObj.user_metadata?.avatar_url || userObj.user_metadata?.picture || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(email)}`;

          let user = await dbFindUserByEmail(email);
          if (!user) {
            user = await dbCreateUser(name, email, `google-sso-${Date.now()}`, "google-sso");
            if (avatar) {
              user = (await dbUpdateUser(user.id, { avatar, name })) || user;
            }
          } else {
            user = (await dbUpdateUser(user.id, { avatar, name })) || user;
          }

          const sessionToken = createSessionToken(user.id, user.email);
          const response = NextResponse.redirect(new URL("/", origin));
          response.cookies.set("brnsic_session", sessionToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24 * 90,
            path: "/"
          });
          return response;
        }
      }
    } catch (e) {
      console.error("OAuth callback error:", e);
    }
  }

  return NextResponse.redirect(new URL("/", origin));
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { accessToken } = body || {};
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";

    if (!accessToken || !SUPABASE_URL) {
      return NextResponse.json({ error: "Access token required" }, { status: 400 });
    }

    // Fetch user from Supabase using access token
    const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
      }
    });

    if (!userRes.ok) {
      return NextResponse.json({ error: "Invalid Supabase token" }, { status: 401 });
    }

    const sbUser = await userRes.json();
    if (!sbUser || !sbUser.email) {
      return NextResponse.json({ error: "Email not found in token" }, { status: 400 });
    }

    const email = sbUser.email.toLowerCase().trim();
    const name = sbUser.user_metadata?.full_name || sbUser.user_metadata?.name || email.split("@")[0];
    const avatar = sbUser.user_metadata?.avatar_url || sbUser.user_metadata?.picture || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(email)}`;

    let user = await dbFindUserByEmail(email);
    if (!user) {
      user = await dbCreateUser(name, email, `google-sso-${Date.now()}`, "google-sso");
      if (avatar) {
        user = (await dbUpdateUser(user.id, { avatar, name })) || user;
      }
    } else {
      user = (await dbUpdateUser(user.id, { avatar, name })) || user;
    }

    const sessionToken = createSessionToken(user.id, user.email);
    const res = NextResponse.json({
      success: true,
      user: toSafeUser(user),
      token: sessionToken
    });

    res.cookies.set("brnsic_session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 90,
      path: "/"
    });

    return res;
  } catch (err: any) {
    console.error("Callback POST error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
