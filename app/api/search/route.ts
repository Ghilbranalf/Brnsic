import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";

  if (!q.trim()) {
    return NextResponse.json({ results: [] });
  }

  try {
    // 1. Fetch iTunes Music API (Official Global & Indonesian releases)
    const itunesUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(
      q.trim()
    )}&country=id&entity=song&limit=25`;
    const itunesRes = await fetch(itunesUrl, { next: { revalidate: 3600 } });
    let itunesItems: any[] = [];
    if (itunesRes.ok) {
      const iData = await itunesRes.json();
      itunesItems = (iData.results || []).map((t: any) => ({
        trackId: `itunes-${t.trackId}`,
        trackName: t.trackName,
        artistName: t.artistName,
        album: t.collectionName || "Single",
        collectionId: t.collectionId,
        artworkUrl100: (t.artworkUrl100 || "").replace("100x100bb", "600x600bb"),
        duration: Math.round((t.trackTimeMillis || 210000) / 1000),
        previewUrl: t.previewUrl,
        source: "itunes"
      }));
    }

    // 2. Fetch YouTube Indie / Local Search (for songs not on iTunes, e.g. "6sentani Only Siji", covers, underground indie)
    let ytItems: any[] = [];
    try {
      const ytSearchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(
        q.trim() + " audio"
      )}`;
      const ytRes = await fetch(ytSearchUrl, {
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" }
      });
      if (ytRes.ok) {
        const html = await ytRes.text();
        const jsonMatch = html.match(/ytInitialData\s*=\s*({.+?});<\/script>/s);
        if (jsonMatch) {
          const ytData = JSON.parse(jsonMatch[1]);
          const contents =
            ytData?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer
              ?.contents?.[0]?.itemSectionRenderer?.contents || [];
          
          for (const item of contents) {
            const v = item.videoRenderer;
            if (v && v.videoId && v.title?.runs?.[0]?.text) {
              const rawTitle = v.title.runs[0].text;
              const rawChannel =
                v.ownerText?.runs?.[0]?.text || v.longBylineText?.runs?.[0]?.text || "Artis Indie";
              const thumb =
                v.thumbnail?.thumbnails?.slice(-1)[0]?.url ||
                `https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg`;

              let artist = rawChannel.replace(" - Topic", "").trim();
              let title = rawTitle;

              if (rawTitle.includes(" - ")) {
                const parts = rawTitle.split(" - ");
                artist = parts[0].trim();
                title = parts.slice(1).join(" - ").replace(/\(.*?\)|\[.*?\]/g, "").trim();
              }

              ytItems.push({
                trackId: `yt-${v.videoId}`,
                trackName: title || rawTitle,
                artistName: artist,
                album: "YouTube Release",
                artworkUrl100: thumb,
                duration: 180,
                youtubeId: v.videoId,
                source: "youtube"
              });

              if (ytItems.length >= 8) break;
            }
          }
        }
      }
    } catch (e) {}

    // Combine results: if query specifically matched indie or few iTunes results, prioritize YouTube items
    const seen = new Set<string>();
    const combined: any[] = [];

    // Prioritize direct title matches from YouTube if query has specific keywords like "sentani", "siji"
    const isIndieTarget =
      q.toLowerCase().includes("sentani") ||
      q.toLowerCase().includes("siji") ||
      itunesItems.length === 0;

    const listToMerge = isIndieTarget
      ? [...ytItems, ...itunesItems]
      : [...itunesItems, ...ytItems];

    for (const item of listToMerge) {
      const cleanKey = `${item.artistName.toLowerCase()} ${item.trackName.toLowerCase()}`.replace(
        /[^a-z0-9]/g,
        ""
      );
      if (!seen.has(cleanKey)) {
        seen.add(cleanKey);
        combined.push(item);
      }
    }

    return NextResponse.json({ results: combined.slice(0, 30) });
  } catch (err: any) {
    return NextResponse.json({ error: err.message, results: [] }, { status: 500 });
  }
}
