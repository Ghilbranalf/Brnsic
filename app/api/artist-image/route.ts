import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// In-memory cache for ultra-fast response
const MEMORY_CACHE = new Map<string, string>();

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const name = searchParams.get("name")?.trim();

  if (!name) {
    return NextResponse.json({ image: "" });
  }

  const cacheKey = name.toLowerCase();
  if (MEMORY_CACHE.has(cacheKey)) {
    return NextResponse.json({
      name,
      image: MEMORY_CACHE.get(cacheKey),
      source: "cache"
    }, {
      headers: {
        "Cache-Control": "public, s-maxage=2592000, max-age=86400, stale-while-revalidate=86400"
      }
    });
  }

  try {
    const itunesUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(
      name
    )}&country=id&entity=song&limit=1`;
    const res = await fetch(itunesUrl, { next: { revalidate: 86400 } });
    if (res.ok) {
      const data = await res.json();
      const rawImg = data.results?.[0]?.artworkUrl100;
      if (rawImg) {
        const highRes = rawImg.replace("100x100bb", "600x600bb");
        MEMORY_CACHE.set(cacheKey, highRes);
        return NextResponse.json({
          name,
          image: highRes,
          source: "network"
        }, {
          headers: {
            "Cache-Control": "public, s-maxage=2592000, max-age=86400, stale-while-revalidate=86400"
          }
        });
      }
    }
  } catch (e) {}

  // Fallback to high-resolution artist avatar generator
  const fallback = `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(name)}`;
  return NextResponse.json({ name, image: fallback, source: "fallback" });
}
