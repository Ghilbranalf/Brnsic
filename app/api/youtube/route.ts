import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");

  if (!q) {
    return NextResponse.json({ error: "Query required" }, { status: 400 });
  }

  try {
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(
      q + " audio"
    )}`;
    
    const response = await fetch(searchUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7"
      },
      next: { revalidate: 3600 }
    });

    const html = await response.text();
    
    // Extract video IDs from videoId field or watch?v=
    const ids: string[] = [];
    const vidRegex = /"videoId":"([a-zA-Z0-9_-]{11})"/g;
    let match;
    while ((match = vidRegex.exec(html)) !== null) {
      if (!ids.includes(match[1])) {
        ids.push(match[1]);
      }
      if (ids.length >= 5) break;
    }

    if (ids.length === 0) {
      const urlRegex = /\/watch\?v=([a-zA-Z0-9_-]{11})/g;
      while ((match = urlRegex.exec(html)) !== null) {
        if (!ids.includes(match[1])) {
          ids.push(match[1]);
        }
        if (ids.length >= 5) break;
      }
    }

    const videoId = ids[0] || "HDEzc4kcJXg";

    return NextResponse.json({ videoId, candidates: ids, query: q });
  } catch (err: any) {
    return NextResponse.json({ error: err.message, videoId: "HDEzc4kcJXg", candidates: [] }, { status: 500 });
  }
}
