import { NextResponse } from "next/server";
import { getAuthUser, toSafeUser, createSessionToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ authenticated: false, user: null }, { status: 200 });
    }

    const token = createSessionToken(user.id, user.email);

    return NextResponse.json({
      authenticated: true,
      user: toSafeUser(user),
      token
    });
  } catch (err: any) {
    return NextResponse.json({ authenticated: false, user: null }, { status: 200 });
  }
}
