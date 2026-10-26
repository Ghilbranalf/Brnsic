import { NextResponse } from "next/server";
import { dbFindUserByEmail } from "@/lib/db";
import { verifyPassword, createSessionToken, toSafeUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body || {};

    if (!email || !password) {
      return NextResponse.json({ error: "Email dan kata sandi wajib diisi" }, { status: 400 });
    }

    const user = await dbFindUserByEmail(email);
    if (!user) {
      return NextResponse.json({ error: "Email atau kata sandi salah" }, { status: 401 });
    }

    const isValid = verifyPassword(password, user.passwordHash, user.salt);
    if (!isValid) {
      return NextResponse.json({ error: "Email atau kata sandi salah" }, { status: 401 });
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
      maxAge: 60 * 60 * 24 * 90,
      path: "/"
    });

    return res;
  } catch (err: any) {
    console.error("Login error:", err);
    return NextResponse.json({ error: "Gagal memproses login" }, { status: 500 });
  }
}
