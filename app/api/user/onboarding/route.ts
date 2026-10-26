import { NextResponse } from "next/server";
import { getAuthUser, toSafeUser } from "@/lib/auth";
import { dbUpdateUser, derivePersona, TasteProfile } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: "Sesi tidak valid. Silakan login." }, { status: 401 });
    }

    const body = await req.json();
    const { selectedArtists = [], selectedGenres = [] } = body || {};

    if (!Array.isArray(selectedArtists) || !Array.isArray(selectedGenres)) {
      return NextResponse.json({ error: "Format data tidak valid" }, { status: 400 });
    }

    // Build seeded taste profile
    const artistWeights: Record<string, number> = { ...(user.taste?.artistWeights || {}) };
    const genreWeights: Record<string, number> = { ...(user.taste?.genreWeights || {}) };

    for (const artist of selectedArtists) {
      if (typeof artist === "string" && artist.trim()) {
        artistWeights[artist.trim()] = Math.max(5, (artistWeights[artist.trim()] || 0) + 5);
      }
    }

    for (const genre of selectedGenres) {
      if (typeof genre === "string" && genre.trim()) {
        genreWeights[genre.trim()] = Math.max(4, (genreWeights[genre.trim()] || 0) + 4);
      }
    }

    const updatedTaste: TasteProfile = {
      ...user.taste,
      artistWeights,
      genreWeights,
      likedArtists: Array.from(new Set([...(user.taste?.likedArtists || []), ...selectedArtists])),
      persona: derivePersona(artistWeights, genreWeights)
    };

    const updated = await dbUpdateUser(user.id, {
      selectedArtists,
      selectedGenres,
      taste: updatedTaste,
      onboardingCompleted: true
    });

    if (!updated) {
      return NextResponse.json({ error: "Gagal menyimpan preferensi" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      user: toSafeUser(updated)
    });
  } catch (err: any) {
    console.error("Onboarding error:", err);
    return NextResponse.json({ error: "Gagal memproses onboarding" }, { status: 500 });
  }
}
