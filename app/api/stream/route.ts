import { NextRequest, NextResponse } from "next/server";
import { Ytdl, Client } from "@distube/ytdl-core";

export const dynamic = "force-dynamic";

let ytdlInstance: Ytdl | null = null;
function getYtdl(): Ytdl {
  if (!ytdlInstance) {
    ytdlInstance = new Ytdl({
      clients: [Client.Tv]
    });
  }
  return ytdlInstance;
}

// Memory cache to avoid re-extracting the same video within 3 hours
const streamCache = new Map<string, { url: string; mimeType: string; expires: number }>();

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const videoId = (searchParams.get("id") || searchParams.get("videoId") || "").trim();
  const format = searchParams.get("format") || "";

  if (!videoId || videoId.length < 5) {
    return NextResponse.json({ error: "Missing or invalid videoId" }, { status: 400 });
  }

  try {
    let chosenUrl = "";
    let chosenMime = "audio/mp4";

    // 1. Check in-memory cache
    const cached = streamCache.get(videoId);
    if (cached && cached.expires > Date.now()) {
      chosenUrl = cached.url;
      chosenMime = cached.mimeType || "audio/mp4";
    } else {
      const ytdl = getYtdl();
      const info = await ytdl.getInfo(`https://www.youtube.com/watch?v=${videoId}`);

      // Filter audio formats, prefer audio/mp4 (m4a) for universal Apple iOS & Android compatibility
      const audioFormats = (info.formats || []).filter(
        (f: any) => f.hasAudio && !f.hasVideo && f.url
      );

      let chosen = audioFormats.find((f: any) => (f.mimeType || "").includes("mp4"));
      if (!chosen && audioFormats.length > 0) {
        chosen = audioFormats[0];
      }

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

      chosenUrl = chosen.url;
      chosenMime = chosen.mimeType || "audio/mp4";
      streamCache.set(videoId, {
        url: chosenUrl,
        mimeType: chosenMime,
        expires: Date.now() + 3 * 3600 * 1000
      });
    }

    if (format === "json") {
      return NextResponse.json({
        streamUrl: chosenUrl,
        mimeType: chosenMime
      });
    }

    // 2. Stream Audio with HTTP 206 Range support for seamless iPhone & mobile background play
    const rangeHeader = req.headers.get("range") || "bytes=0-";
    const upstreamRes = await fetch(chosenUrl, {
      headers: {
        Range: rangeHeader,
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15"
      }
    });

    const responseHeaders = new Headers();
    responseHeaders.set("Content-Type", chosenMime);
    responseHeaders.set("Accept-Ranges", "bytes");
    responseHeaders.set("Access-Control-Allow-Origin", "*");
    responseHeaders.set("Cache-Control", "public, max-age=10800, s-maxage=10800");

    if (upstreamRes.headers.get("content-range")) {
      responseHeaders.set("Content-Range", upstreamRes.headers.get("content-range")!);
    }
    if (upstreamRes.headers.get("content-length")) {
      responseHeaders.set("Content-Length", upstreamRes.headers.get("content-length")!);
    }

    return new Response(upstreamRes.body, {
      status: upstreamRes.status,
      headers: responseHeaders
    });
  } catch (err: any) {
    console.error("Stream extraction error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to resolve audio stream" },
      { status: 500 }
    );
  }
}
