import { NextResponse } from "next/server";
import { dbFindUserByEmail, dbCreateUser } from "@/lib/db";
import { hashPassword, createSessionToken, toSafeUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password } = body || {};

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "Email tidak valid" }, { status: 400 });
    }

    if (!password || typeof password !== "string" || password.length < 6) {
      return NextResponse.json({ error: "Kata sandi minimal 6 karakter" }, { status: 400 });
    }

    const cleanName = (name && typeof name === "string" ? name : email.split("@")[0]).trim();
    const existing = await dbFindUserByEmail(email);
    if (existing) {
      return NextResponse.json({ error: "Email sudah terdaftar. Silakan masuk." }, { status: 409 });
    }

    const { hash, salt } = hashPassword(password);
    const user = await dbCreateUser(cleanName, email, hash, salt);
    const token = createSessionToken(user.id, user.email);

    const res = NextResponse.json({
      success: true,
      user: toSafeUser(user),
      token
    });

    // Set HTTP-Only Cookie
    res.cookies.set("brnsic_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 90, // 90 days
      path: "/"
    });

    return res;
  } catch (err: any) {
    console.error("Register error:", err);
    return NextResponse.json({ error: "Gagal mendaftarkan akun" }, { status: 500 });
  }
}
