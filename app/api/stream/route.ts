import { NextRequest, NextResponse } from "next/server";
import { Ytdl } from "@distube/ytdl-core";

export const dynamic = "force-dynamic";

let ytdlInstance: Ytdl | null = null;
function getYtdl(): Ytdl {
  if (!ytdlInstance) {
    ytdlInstance = new Ytdl();
  }
  return ytdlInstance;
}

// Memory cache to avoid re-extracting the same video within 3 hours
const streamCache = new Map<string, { url: string; expires: number }>();

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const videoId = (searchParams.get("id") || searchParams.get("videoId") || "").trim();
  const format = searchParams.get("format") || "";

  if (!videoId || videoId.length < 5) {
    return NextResponse.json({ error: "Missing or invalid videoId" }, { status: 400 });
  }

  // 1. Check in-memory cache
  const cached = streamCache.get(videoId);
  if (cached && cached.expires > Date.now()) {
    if (format === "json") {
      return NextResponse.json({ streamUrl: cached.url, cached: true });
    }
    return NextResponse.redirect(cached.url, 302);
  }

  try {
    const ytdl = getYtdl();
    const info = await ytdl.getInfo(`https://www.youtube.com/watch?v=${videoId}`);

    // Filter audio formats, prefer audio/mp4 (m4a) for universal Android MediaPlayer compatibility
    const audioFormats = (info.formats || []).filter(
      (f: any) => f.hasAudio && !f.hasVideo && f.url
    );

    let chosen = audioFormats.find((f: any) => (f.mimeType || "").includes("mp4"));
    if (!chosen && audioFormats.length > 0) {
      chosen = audioFormats[0];
    }

    // Fallback: any format with audio
    if (!chosen) {
      const anyAudio = (info.formats || []).filter((f: any) => f.hasAudio && f.url);
      chosen = anyAudio[0];
    }

    if (!chosen || !chosen.url) {
      return NextResponse.json(
        { error: "No streamable audio found for this track" },
        { status: 404 }
      );
    }

    const streamUrl = chosen.url;
    // Cache for 3 hours (YouTube CDN URLs typically expire after 6 hours)
    streamCache.set(videoId, { url: streamUrl, expires: Date.now() + 3 * 3600 * 1000 });

    if (format === "json") {
      return NextResponse.json({
        streamUrl,
        mimeType: chosen.mimeType,
        bitrate: chosen.bitrate,
        title: info.videoDetails?.title
      });
    }

    return NextResponse.redirect(streamUrl, 302);
  } catch (err: any) {
    console.error("Stream extraction error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to resolve audio stream" },
      { status: 500 }
    );
  }
}
