import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    version: "3.2.0",
    releaseDate: "2026-10-27",
    title: "Pembaruan Siap Digunakan",
    notes: "Pembaruan performa audio studio dan stabilitas sistem.",
    buildTime: Date.now()
  });
}
