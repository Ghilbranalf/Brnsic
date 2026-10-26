import { NextResponse } from "next/server";
import { dbFindUserByEmail, dbCreateUser, dbUpdateUser } from "@/lib/db";
import { createSessionToken, toSafeUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, name, avatar, googleId } = body || {};

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "Email Google tidak valid" }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = (name && typeof name === "string" ? name : cleanEmail.split("@")[0]).trim();
    const cleanAvatar = avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(cleanEmail)}`;

    let user = await dbFindUserByEmail(cleanEmail);

    if (!user) {
      // First time Google sign in -> automatically create user in Supabase / DB
      user = await dbCreateUser(cleanName, cleanEmail, `google-oauth-${Date.now()}`, "google-salt");
      if (cleanAvatar) {
        user = (await dbUpdateUser(user.id, { avatar: cleanAvatar })) || user;
      }
    } else if (cleanAvatar && user.avatar.includes("dicebear")) {
      user = (await dbUpdateUser(user.id, { avatar: cleanAvatar, name: cleanName })) || user;
    }

    const token = createSessionToken(user.id, user.email);

    const res = NextResponse.json({
      success: true,
      user: toSafeUser(user),
      token
    });

    res.cookies.set("brnsic_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 90, // 90 days
      path: "/"
    });

    return res;
  } catch (err: any) {
    console.error("Google Auth error:", err);
    return NextResponse.json({ error: "Gagal memproses login Google" }, { status: 500 });
  }
}
