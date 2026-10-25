import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const artist = searchParams.get("artist") || "";
  const title = searchParams.get("title") || "";

  if (!artist && !title) {
    return NextResponse.json({ lyrics: [] });
  }

  try {
    // 1. Try exact match
    let res = await fetch(
      `https://lrclib.net/api/get?artist_name=${encodeURIComponent(
        artist
      )}&track_name=${encodeURIComponent(title)}`,
      {
        headers: {
          "User-Agent": "SpotifyNextApp/1.0 (https://github.com)"
        },
        next: { revalidate: 86400 }
      }
    );

    let data: any = null;
    if (res.ok) {
      data = await res.json();
    } else {
      // 2. Fallback to search query
      const searchRes = await fetch(
        `https://lrclib.net/api/search?q=${encodeURIComponent(`${artist} ${title}`)}`,
        {
          headers: {
            "User-Agent": "SpotifyNextApp/1.0 (https://github.com)"
          },
          next: { revalidate: 86400 }
        }
      );
      if (searchRes.ok) {
        const results = await searchRes.json();
        if (Array.isArray(results) && results.length > 0) {
          // Find first result with syncedLyrics or plainLyrics
          data = results.find((r: any) => r.syncedLyrics) || results[0];
        }
      }
    }

    if (data && data.syncedLyrics) {
      const lines = data.syncedLyrics.split("\n");
      const parsed: { time: number; text: string }[] = [];
      const timeReg = /\[(\d{2}):(\d{2})(?:\.(\d{2,3}))?\]/;

      lines.forEach((l: string) => {
        const m = timeReg.exec(l);
        if (m) {
          const min = parseInt(m[1], 10);
          const sec = parseInt(m[2], 10);
          const ms = m[3] ? parseInt(m[3].padEnd(3, "0"), 10) : 0;
          const text = l.replace(timeReg, "").trim();
          if (text) {
            parsed.push({ time: min * 60 + sec + ms / 1000, text });
          }
        }
      });

      if (parsed.length > 0) {
        return NextResponse.json({ lyrics: parsed, synced: true });
      }
    }

    // If plain lyrics exist but no synced
    if (data && data.plainLyrics) {
      const lines = data.plainLyrics
        .split("\n")
        .map((l: string) => l.trim())
        .filter((l: string) => l.length > 0);
      const estStep = 4.5;
      const parsed = lines.map((text: string, i: number) => ({
        time: i * estStep,
        text
      }));
      return NextResponse.json({ lyrics: parsed, synced: false });
    }

    // Default placeholder lyrics if not found in database
    return NextResponse.json({
      lyrics: [
        { time: 0, text: `♪ ${title} ♪` },
        { time: 5, text: `By ${artist}` },
        { time: 10, text: "Lyrics unavailable for this track or instrumental" }
      ],
      synced: false
    });
  } catch (err: any) {
    return NextResponse.json({
      lyrics: [
        { time: 0, text: `♪ ${title} ♪` },
        { time: 5, text: `By ${artist}` }
      ],
      synced: false
    });
  }
}
